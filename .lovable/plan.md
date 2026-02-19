

## Route Preview, Skip, and Reorder Before Starting a Run

### What Changes

The **Route Run Setup** screen (the page shown before you tap "Start Route") will be enhanced with an interactive stop list that shows:

- The **full location name** for each stop (resolved from the database, not just IDs)
- A **skip toggle** on each stop so you can exclude locations you don't need to visit today
- **Move up / Move down buttons** on each stop so you can rearrange the order before starting

The route run will then only cycle through the stops you kept enabled, in the order you set.

### User Experience

1. Tap "Run Route" on a saved route
2. The setup screen appears with vehicle/tracking mode selection AND a full list of stops with names
3. Each stop shows the location name, with buttons to move it up/down and a toggle to skip it
4. After customizing, tap "Start Route" -- only the active, reordered stops are used for the run

### Technical Details

**Modified Files:**

1. **`src/components/mileage/RouteRunSetup.tsx`**
   - Add state for a mutable stops list (cloned from `route.stops`) with `enabled` and resolved `displayName` fields
   - Use the `useLocations` hook to resolve `locationId` to actual location names
   - Render an interactive list with each stop showing:
     - Location name (resolved or custom)
     - Move up / move down icon buttons (swap with adjacent stop)
     - A switch/checkbox to skip the stop
   - Pass only the enabled, reordered stops list to `onStart`

2. **`src/components/mileage/RouteRunSetup.tsx` (props change)**
   - `onStart` signature updated to also accept a `customStops: RouteStop[]` parameter (the filtered/reordered list)

3. **`src/components/mileage/RouteRunPage.tsx`**
   - Accept the custom stops from setup and use them (instead of `route.stops`) for the running phase
   - Store the custom stops in local state so the stop view iterates over the right list

4. **`src/hooks/useRouteRun.ts`**
   - `startRouteRun` updated to accept an optional `customStops` override so the run uses the reordered/filtered stops
   - The start/end location names on the mileage entry are derived from the custom stops list

No database changes needed -- the stop customization is ephemeral (per-run) and the `stop_data` JSONB already captures what actually happened during the run.
