// Driving distance between two points, used to auto-fill route builder mileage.
// Uses the public OSRM router (same OpenStreetMap ecosystem as the map/geocoder),
// with a localStorage cache and a straight-line fallback.
//
// NOTE: this only pre-fills route *planning* estimates. Actual mileage logging
// remains strictly odometer-based.

import { haversineMeters, metersToMiles } from "./geo";

const CACHE_KEY = "clawops_route_distance_cache_v1";

export type LatLng = { lat: number; lng: number };

function readCache(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, number>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* best effort */
  }
}

function cacheKey(from: LatLng, to: LatLng): string {
  const r = (n: number) => n.toFixed(4);
  return `${r(from.lat)},${r(from.lng)}|${r(to.lat)},${r(to.lng)}`;
}

/** Straight-line distance padded to approximate real road distance. */
export function fallbackMiles(from: LatLng, to: LatLng): number {
  const meters = haversineMeters(from.lat, from.lng, to.lat, to.lng);
  return Math.round(metersToMiles(meters) * 1.25 * 10) / 10;
}

/** Driving miles between two coordinates. Never throws. */
export async function drivingMiles(from: LatLng, to: LatLng): Promise<number> {
  const key = cacheKey(from, to);
  const cache = readCache();
  if (key in cache) return cache[key];

  let miles: number;
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Router returned ${response.status}`);
    const data = await response.json();
    const meters = data?.routes?.[0]?.distance;
    if (typeof meters !== "number") throw new Error("No route returned");
    miles = Math.round(metersToMiles(meters) * 10) / 10;
  } catch {
    miles = fallbackMiles(from, to);
  }

  cache[key] = miles;
  writeCache(cache);
  return miles;
}
