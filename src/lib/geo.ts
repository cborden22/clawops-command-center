// Geospatial helpers shared by arrival detection (geofencing).
// NOTE: GPS is used only to detect arrival at a location.
// Mileage in this app remains strictly odometer-based.

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Distance between two lat/lng points in meters (Haversine). */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

/** Human friendly distance for arrival UI. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  const miles = metersToMiles(meters);
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}
