// Address -> coordinates lookup used for location geofences.
// Uses the same OpenStreetMap/Nominatim service as the location map,
// with a localStorage cache so repeated saves don't re-query.

const GEOCODE_CACHE_KEY = "clawops_geocode_cache_v1";

type Coords = { lat: number; lng: number } | null;

function readCache(): Record<string, Coords> {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, Coords>) {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full or unavailable — cache is best-effort */
  }
}

export function clearGeocodeCache() {
  try {
    localStorage.removeItem(GEOCODE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export async function geocodeAddress(address: string): Promise<Coords> {
  const key = address.trim().toLowerCase();
  if (!key) return null;

  const cache = readCache();
  if (key in cache) return cache[key];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    const coords: Coords = first
      ? { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
      : null;
    cache[key] = coords;
    writeCache(cache);
    return coords;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}
