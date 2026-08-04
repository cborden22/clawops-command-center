# Easier Route Builder with Auto Mileage

Rework the route builder so it starts from your warehouse and fills in the driving miles for you, instead of asking you to type miles between every stop.

## What changes

**1. Warehouse as the starting point**
- The first stop becomes a dedicated "Start" card with a warehouse picker listing your saved warehouses (default warehouse pre-selected), plus a "Custom start" option.
- A "Return to warehouse" toggle adds the warehouse back as the final stop and includes the return leg in the total.

**2. Auto-calculated miles**
- Stops are picked from your locations list; the builder geocodes each address and asks a road-routing service for the actual driving distance between consecutive stops.
- Miles auto-fill per leg and roll up into the total. A small "Auto" tag shows a leg was calculated; typing over a value marks it "Manual" and it stops being overwritten.
- A "Recalculate miles" button refreshes all auto legs at once.
- If a stop has no usable address (custom text, or geocoding fails), that leg falls back to manual entry with a short inline note.

**3. Simpler stop rows**
- Compact single-line rows: stop number, location picker, resolved address, miles badge, and remove button.
- Reorder with up/down buttons (matching the run-setup screen you already use).
- "Add Stop" opens the location picker directly so adding several stops is fast.
- Route Name auto-suggests from the day/schedule but stays editable.

Nothing changes in how routes run, in odometer-based mileage tracking, or in scheduling.

## Technical notes

- New `src/lib/routeDistance.ts`: given two coordinate pairs, fetch driving distance from the public OSRM router (`router.project-osrm.org/route/v1/driving/...`), convert meters to miles, and cache results in `localStorage` keyed by rounded coordinate pairs. Falls back to straight-line distance from `src/lib/geo.ts` x1.25 if the router is unreachable, and to manual entry if coordinates are unknown.
- Coordinates come from `locations.latitude/longitude` (already populated by the geofence work); missing ones resolve through the existing `geocodeAddress` helper in `src/lib/geocode.ts` with its localStorage cache. Warehouse coordinates geocode from the composed warehouse address.
- `RouteEditor.tsx`: replace the free-form first stop with warehouse selection sourced from `useWarehousesDB`, add per-leg `isAuto` state, a debounced effect that recalculates auto legs when stop order or selection changes, and the return-to-warehouse toggle (persisted through the existing `isRoundTrip` argument to `onSave`, which `useRoutesDB` already doubles the mileage for — instead it will append an explicit warehouse stop so the return leg is a real leg and `isRoundTrip` stays `false`).
- `RouteStopItem.tsx`: restyle to the compact row, expose move up/down, show address + auto/manual miles badge.
- No database or schema changes; stop rows still save as `RouteStopInput` (locationId / customLocationName / milesFromPrevious).
