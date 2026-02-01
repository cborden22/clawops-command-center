import { useState, useCallback, useRef } from "react";

export interface GeocodedLocation {
  address: string;
  lat: number;
  lng: number;
}

interface GeocodeCache {
  [address: string]: { lat: number; lng: number } | null;
}

// Rate limit: 1 request per second for Nominatim
const RATE_LIMIT_MS = 1100;

export function useGeocode() {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const cacheRef = useRef<GeocodeCache>({});
  const lastRequestTimeRef = useRef<number>(0);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address || address.trim().length < 3) {
      return null;
    }

    // Check cache first
    const cached = cacheRef.current[address];
    if (cached !== undefined) {
      return cached;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
    }

    try {
      lastRequestTimeRef.current = Date.now();
      
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'ClawOps-RouteTracker/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        cacheRef.current[address] = result;
        return result;
      } else {
        cacheRef.current[address] = null;
        return null;
      }
    } catch (error) {
      console.error("Geocoding error for address:", address, error);
      cacheRef.current[address] = null;
      return null;
    }
  }, []);

  const geocodeAddresses = useCallback(async (addresses: string[]): Promise<GeocodedLocation[]> => {
    setIsGeocoding(true);
    const results: GeocodedLocation[] = [];

    for (const address of addresses) {
      if (!address || address.trim().length < 3) continue;
      
      const coords = await geocodeAddress(address);
      if (coords) {
        results.push({
          address,
          lat: coords.lat,
          lng: coords.lng
        });
      }
    }

    setIsGeocoding(false);
    return results;
  }, [geocodeAddress]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    geocodeAddress,
    geocodeAddresses,
    isGeocoding,
    clearCache
  };
}
