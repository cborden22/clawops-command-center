import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { haversineMeters } from "@/lib/geo";
import { geocodeAddress } from "@/lib/geocode";

export interface GeofencedLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radiusM: number;
}

export interface NearestLocation {
  location: GeofencedLocation;
  distanceMeters: number;
  inside: boolean;
}

export type GeoStatus =
  | "unsupported"
  | "idle"
  | "locating"
  | "tracking"
  | "denied"
  | "error";

const DEFAULT_RADIUS = 150;
const MAX_BACKFILL_PER_SESSION = 8;
const NOMINATIM_DELAY_MS = 1100;

/**
 * Arrival detection for locations (geofencing only — never used for mileage).
 * Watches the device position and reports the closest saved location.
 */
export function useGeofence(options?: { autoStart?: boolean }) {
  const autoStart = options?.autoStart ?? true;

  const [locations, setLocations] = useState<GeofencedLocation[]>([]);
  const [status, setStatus] = useState<GeoStatus>(
    typeof navigator !== "undefined" && navigator.geolocation ? "idle" : "unsupported"
  );
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Load locations that can be geofenced, backfilling coordinates from addresses.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from("locations")
        .select("id, name, address, latitude, longitude, geofence_radius_m")
        .eq("is_active", true);

      if (fetchError || !data || cancelled) return;

      const mapped: GeofencedLocation[] = data
        .filter((l) => l.latitude !== null && l.longitude !== null)
        .map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          radiusM: Number(l.geofence_radius_m) || DEFAULT_RADIUS,
        }));

      setLocations(mapped);

      const missing = data
        .filter((l) => (l.latitude === null || l.longitude === null) && l.address?.trim())
        .slice(0, MAX_BACKFILL_PER_SESSION);

      if (missing.length === 0) return;

      setIsBackfilling(true);
      for (const loc of missing) {
        if (cancelled) break;
        const coords = await geocodeAddress(loc.address!);
        if (coords) {
          await supabase
            .from("locations")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", loc.id);

          if (!cancelled) {
            setLocations((prev) => [
              ...prev.filter((p) => p.id !== loc.id),
              {
                id: loc.id,
                name: loc.name,
                address: loc.address,
                latitude: coords.lat,
                longitude: coords.lng,
                radiusM: Number(loc.geofence_radius_m) || DEFAULT_RADIUS,
              },
            ]);
          }
        }
        await new Promise((r) => setTimeout(r, NOMINATIM_DELAY_MS));
      }
      if (!cancelled) setIsBackfilling(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    if (watchIdRef.current !== null) return;

    setStatus("locating");
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setStatus("tracking");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Location permission denied. Enable location access to detect arrivals.");
        } else {
          setStatus("error");
          setError(
            err.code === err.TIMEOUT
              ? "Location request timed out."
              : "Location unavailable — check your GPS signal."
          );
        }
        stopWatching();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  }, [stopWatching]);

  // Auto-start only when permission was already granted, so we never
  // surprise the user with a permission prompt on page load.
  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;

    const maybeStart = async () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return;
      try {
        const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (cancelled) return;
        if (!perm || perm.state === "granted") startWatching();
        else if (perm.state === "denied") setStatus("denied");
      } catch {
        /* Permissions API unavailable — wait for an explicit request */
      }
    };

    maybeStart();
    return () => {
      cancelled = true;
    };
  }, [autoStart, startWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const nearest = useMemo<NearestLocation | null>(() => {
    if (!position || locations.length === 0) return null;
    let best: NearestLocation | null = null;
    for (const location of locations) {
      const distanceMeters = haversineMeters(
        position.lat,
        position.lng,
        location.latitude,
        location.longitude
      );
      if (!best || distanceMeters < best.distanceMeters) {
        best = {
          location,
          distanceMeters,
          inside: distanceMeters <= location.radiusM,
        };
      }
    }
    return best;
  }, [position, locations]);

  const distanceTo = useCallback(
    (locationId?: string | null): NearestLocation | null => {
      if (!locationId || !position) return null;
      const location = locations.find((l) => l.id === locationId);
      if (!location) return null;
      const distanceMeters = haversineMeters(
        position.lat,
        position.lng,
        location.latitude,
        location.longitude
      );
      return { location, distanceMeters, inside: distanceMeters <= location.radiusM };
    },
    [position, locations]
  );

  return {
    status,
    error,
    accuracy,
    position,
    locations,
    nearest,
    distanceTo,
    isBackfilling,
    requestLocation: startWatching,
    stopTracking: stopWatching,
  };
}
