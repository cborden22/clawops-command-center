import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocations } from "@/hooks/useLocationsDB";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { differenceInDays, subDays } from "date-fns";

const GEOCODE_CACHE_KEY = "location_map_geocode_cache_v1";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createColorIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-map-pin",
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

const greenIcon = createColorIcon("#22c55e");
const yellowIcon = createColorIcon("#eab308");
const redIcon = createColorIcon("#ef4444");
const grayIcon = createColorIcon("#6b7280");

function parseLatLng(address: string): [number, number] | null {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const lat = parseFloat(parts[parts.length - 2]);
    const lng = parseFloat(parts[parts.length - 1]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return [lat, lng];
    }
  }
  return null;
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lng)) return null;

    return [lat, lng];
  } catch {
    return null;
  }
}

const LocationMap = () => {
  const { locations, isLoaded } = useLocations();
  const { entries } = useRevenueEntries();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [coordsByLocationId, setCoordsByLocationId] = useState<Record<string, [number, number] | null>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);

  const activeLocations = useMemo(
    () => locations.filter((l) => l.isActive && l.address),
    [locations]
  );

  useEffect(() => {
    if (!isLoaded || activeLocations.length === 0) return;

    let mounted = true;

    const geocodeAll = async () => {
      setIsGeocoding(true);

      let cache: Record<string, [number, number] | null> = {};
      try {
        const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, [number, number] | null>;
          if (parsed && typeof parsed === "object") cache = parsed;
        }
      } catch {
        cache = {};
      }

      const nextCoords: Record<string, [number, number] | null> = {};

      for (const loc of activeLocations) {
        const address = loc.address?.trim() ?? "";
        if (!address) {
          nextCoords[loc.id] = null;
          continue;
        }

        const parsedCoords = parseLatLng(address);
        if (parsedCoords) {
          nextCoords[loc.id] = parsedCoords;
          cache[address.toLowerCase()] = parsedCoords;
          continue;
        }

        const cacheKey = address.toLowerCase();
        if (cacheKey in cache) {
          nextCoords[loc.id] = cache[cacheKey];
          continue;
        }

        const geocoded = await geocodeAddress(address);
        cache[cacheKey] = geocoded;
        nextCoords[loc.id] = geocoded;

        // small delay to avoid geocoder rate limiting
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (!mounted) return;
      setCoordsByLocationId(nextCoords);
      localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
      setIsGeocoding(false);
    };

    geocodeAll();

    return () => {
      mounted = false;
    };
  }, [isLoaded, activeLocations]);

  const locationStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    return activeLocations.map((loc) => {
      const locRevenue = entries
        .filter((e) => e.locationId === loc.id && e.type === "income" && e.date >= thirtyDaysAgo)
        .reduce((sum, e) => sum + e.amount, 0);

      const daysSinceCollection = loc.lastCollectionDate
        ? differenceInDays(now, new Date(loc.lastCollectionDate))
        : null;

      const isOverdue = loc.collectionFrequencyDays && daysSinceCollection
        ? daysSinceCollection > loc.collectionFrequencyDays
        : false;

      return {
        ...loc,
        revenue30d: locRevenue,
        daysSinceCollection,
        isOverdue,
        coords: coordsByLocationId[loc.id] ?? null,
      };
    });
  }, [activeLocations, entries, coordsByLocationId]);

  const mappableStats = useMemo(
    () => locationStats.filter((stat) => stat.coords),
    [locationStats]
  );

  const avgRevenue = useMemo(() => {
    const revs = locationStats.map((l) => l.revenue30d);
    return revs.length ? revs.reduce((a, b) => a + b, 0) / revs.length : 0;
  }, [locationStats]);

  const getIcon = (stat: (typeof locationStats)[0]) => {
    if (stat.isOverdue) return redIcon;
    if (stat.revenue30d >= avgRevenue && avgRevenue > 0) return greenIcon;
    if (stat.revenue30d > 0) return yellowIcon;
    return grayIcon;
  };

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mappableStats.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] = mappableStats[0].coords as [number, number];
    const map = L.map(mapContainerRef.current).setView(center, 10);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    mappableStats.forEach((stat) => {
      if (!stat.coords) return;

      const marker = L.marker(stat.coords, { icon: getIcon(stat) }).addTo(map);
      bounds.extend(stat.coords);

      marker.bindPopup(`
        <div style="min-width:180px;font-size:13px;line-height:1.5;">
          <p style="font-weight:600;font-size:15px;margin:0 0 4px;">${stat.name}</p>
          <p style="color:#6b7280;margin:0 0 4px;">${stat.address}</p>
          <p style="margin:0;">Machines: <strong>${stat.machineCount}</strong></p>
          <p style="margin:0;">30-day Revenue: <strong>$${stat.revenue30d.toFixed(2)}</strong></p>
          ${stat.daysSinceCollection !== null
            ? `<p style="margin:0;${stat.isOverdue ? "color:#dc2626;font-weight:600;" : ""}">${stat.isOverdue ? "⚠ " : ""}Last collected: ${stat.daysSinceCollection}d ago</p>`
            : ""
          }
        </div>
      `);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLoaded, mappableStats, avgRevenue]);

  if (!isLoaded) {
    return (
      <div className="bg-background min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Location Map</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Visual overview of all your locations color-coded by performance
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" /> Above average
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-yellow-500" /> Needs attention
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500" /> Overdue collection
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-gray-500" /> No recent data
          </div>
        </div>

        {activeLocations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No locations with addresses found. Add addresses to your locations to see them on the map.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: "65vh" }}>
            {mappableStats.length === 0 && isGeocoding ? (
              <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
                Locating addresses on the map...
              </div>
            ) : (
              <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;
