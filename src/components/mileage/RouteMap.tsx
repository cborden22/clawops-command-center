import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Loader2 } from "lucide-react";
import { MileageRoute } from "@/hooks/useRoutesDB";
import { Location, useLocations } from "@/hooks/useLocationsDB";
import { useGeocode, GeocodedLocation } from "@/hooks/useGeocode";

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const startIcon = createIcon("#22c55e"); // green
const middleIcon = createIcon("hsl(221, 83%, 53%)"); // primary blue
const endIcon = createIcon("#ef4444"); // red
const defaultIcon = createIcon("hsl(221, 83%, 53%)"); // primary blue

interface MapBoundsHandlerProps {
  positions: [number, number][];
}

function MapBoundsHandler({ positions }: MapBoundsHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, positions]);

  return null;
}

interface RouteMapProps {
  selectedRoute?: MileageRoute;
  className?: string;
}

export function RouteMap({ selectedRoute, className = "" }: RouteMapProps) {
  const { locations, getLocationById } = useLocations();
  const { geocodeAddresses, isGeocoding } = useGeocode();
  const [geocodedLocations, setGeocodedLocations] = useState<GeocodedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get addresses to geocode based on selected route or all locations
  const addressesToGeocode = useMemo(() => {
    if (selectedRoute) {
      return selectedRoute.stops
        .map(stop => {
          if (stop.locationId) {
            const location = getLocationById(stop.locationId);
            return location?.address || "";
          }
          return stop.customLocationName || "";
        })
        .filter(addr => addr.length > 0);
    } else {
      // Show all locations with addresses
      return locations
        .filter(loc => loc.address && loc.address.length > 3)
        .map(loc => loc.address);
    }
  }, [selectedRoute, locations, getLocationById]);

  // Geocode addresses when they change
  useEffect(() => {
    const doGeocode = async () => {
      if (addressesToGeocode.length === 0) {
        setGeocodedLocations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const results = await geocodeAddresses(addressesToGeocode);
      setGeocodedLocations(results);
      setIsLoading(false);
    };

    doGeocode();
  }, [addressesToGeocode, geocodeAddresses]);

  // Build marker data with proper icons and names
  const markerData = useMemo(() => {
    if (selectedRoute) {
      // For selected route, use ordered stops with colored markers
      return selectedRoute.stops
        .map((stop, index) => {
          const address = stop.locationId 
            ? getLocationById(stop.locationId)?.address || ""
            : stop.customLocationName || "";
          
          const name = stop.locationId
            ? getLocationById(stop.locationId)?.name || "Unknown"
            : stop.customLocationName || "Custom Stop";
          
          const geocoded = geocodedLocations.find(g => g.address === address);
          if (!geocoded) return null;

          let icon = middleIcon;
          if (index === 0) icon = startIcon;
          else if (index === selectedRoute.stops.length - 1) icon = endIcon;

          return {
            position: [geocoded.lat, geocoded.lng] as [number, number],
            name,
            address,
            icon,
            order: index + 1
          };
        })
        .filter(Boolean);
    } else {
      // Show all locations
      return locations
        .filter(loc => loc.address && loc.address.length > 3)
        .map(loc => {
          const geocoded = geocodedLocations.find(g => g.address === loc.address);
          if (!geocoded) return null;

          return {
            position: [geocoded.lat, geocoded.lng] as [number, number],
            name: loc.name,
            address: loc.address,
            icon: defaultIcon,
            order: undefined
          };
        })
        .filter(Boolean);
    }
  }, [selectedRoute, locations, geocodedLocations, getLocationById]);

  const positions = markerData
    .filter(Boolean)
    .map(m => m!.position);

  // Default center (US center) if no positions
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const center = positions.length > 0 ? positions[0] : defaultCenter;

  if (isLoading || isGeocoding) {
    return (
      <Card className={`glass-card overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div className="h-[250px] flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className={`glass-card overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div className="h-[250px] flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {selectedRoute 
                  ? "No geocodable addresses in this route"
                  : "Add locations with addresses to see them on the map"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="h-[250px] relative">
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapBoundsHandler positions={positions} />

            {/* Draw route line if a route is selected */}
            {selectedRoute && positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{
                  color: "hsl(221, 83%, 53%)",
                  weight: 3,
                  dashArray: "8, 8",
                  opacity: 0.7
                }}
              />
            )}

            {/* Render markers */}
            {markerData.filter(Boolean).map((marker, index) => (
              <Marker
                key={`${marker!.address}-${index}`}
                position={marker!.position}
                icon={marker!.icon}
              >
                <Popup>
                  <div className="text-sm">
                    {marker!.order && (
                      <span className="text-xs font-medium text-primary">
                        Stop {marker!.order}
                      </span>
                    )}
                    <p className="font-semibold">{marker!.name}</p>
                    <p className="text-muted-foreground text-xs">{marker!.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
