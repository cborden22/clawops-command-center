

## Add Interactive Map to Routes Section

This plan adds an interactive map visualization that displays route stops as markers, using free OpenStreetMap tiles with no API key required.

---

## What You'll Get

1. **Interactive Map Component** - A visual map showing all stops as markers with connecting lines
2. **Route-Specific View** - When you select a route, the map zooms to show just those stops
3. **All Locations View** - When no route is selected, shows all your saved locations on the map
4. **Clickable Markers** - Tap a marker to see the location name and address
5. **Automatic Geocoding** - Converts your addresses to map coordinates automatically

---

## Visual Preview

```text
+----------------------------------------+
|  Routes Tab                            |
+----------------------------------------+
|                                        |
|  [   Interactive Map with Markers  ]   |
|  [                                 ]   |
|  [    📍----📍----📍----📍         ]   |
|  [                                 ]   |
|                                        |
|  Route Cards Below...                  |
|  +------------------+ +---------------+|
|  | Monday Route     | | Tuesday Route ||
|  | 4 stops, 23.4 mi | | 3 stops, 15 mi||
|  +------------------+ +---------------+|
|                                        |
+----------------------------------------+
```

When a route is selected:
- Map centers and zooms to fit all stops
- Markers are connected by a line showing the route path
- Different colors: green (start), blue (middle stops), red (end)

---

## Implementation Approach

### New Dependencies

| Package | Purpose |
|---------|---------|
| `react-leaflet` | React wrapper for Leaflet maps |
| `leaflet` | Core mapping library |
| `@types/leaflet` | TypeScript types |

### New Files

| File | Purpose |
|------|---------|
| `src/components/mileage/RouteMap.tsx` | Main map component with markers and route lines |
| `src/hooks/useGeocode.ts` | Hook to convert addresses to coordinates using OpenStreetMap's Nominatim API |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/mileage/RouteManager.tsx` | Add map display above route cards |
| `src/index.css` | Add Leaflet CSS import |

---

## How It Works

### Address Geocoding

The system will convert your addresses to map coordinates using OpenStreetMap's free Nominatim service:

1. When the map loads, it fetches coordinates for each location's address
2. Results are cached in browser memory to avoid repeated lookups
3. If an address can't be found, that stop shows without a marker (graceful degradation)

### Map Features

- **Tile Source**: OpenStreetMap (free, no API key)
- **Markers**: Custom colored markers for start/middle/end stops
- **Route Line**: Dashed line connecting stops in order
- **Popups**: Click a marker to see location details
- **Fit Bounds**: Map automatically zooms to show all relevant markers
- **Responsive**: Works on mobile and desktop

---

## Technical Details

### RouteMap Component

The map component will:
- Accept either a selected route or show all locations
- Handle loading state while geocoding addresses
- Cache geocoded coordinates to avoid rate limits
- Use proper attribution for OpenStreetMap

### Geocoding Strategy

- Use Nominatim's free geocoding API (rate limited to 1 request/second)
- Implement request queuing to respect rate limits
- Cache results in component state during session
- Show placeholder for locations without valid coordinates

### Database Consideration

Optionally, we could add latitude/longitude columns to the `locations` table to store coordinates permanently, avoiding repeated geocoding. This would be a future enhancement.

---

## Limitations

- **Geocoding Rate Limit**: Nominatim has a 1 request/second limit, so initial load may take a few seconds for many locations
- **Address Accuracy**: Geocoding depends on address format - some addresses may not resolve correctly
- **No Real Routing**: The line between stops is straight, not actual driving directions

---

## Summary

| Aspect | Details |
|--------|---------|
| **Cost** | Free (OpenStreetMap + Nominatim) |
| **API Key Required** | No |
| **New Dependencies** | 3 packages (react-leaflet, leaflet, @types/leaflet) |
| **New Components** | 2 (RouteMap, useGeocode hook) |
| **Mobile Friendly** | Yes |

