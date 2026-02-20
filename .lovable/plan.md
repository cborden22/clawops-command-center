
## Fix Location Names in Route Run + Add Quick Route Start to Mobile Menu

### Problem 1: "Location Stop" instead of actual names

The bug is in `RouteRunSetup.tsx` line 85. When the setup passes stops to the running phase, it strips the resolved `displayName` field and does NOT write it into `customLocationName`:

```typescript
// Current (broken):
.map(({ enabled, displayName, ...stop }, idx) => ({ ...stop, stopOrder: idx }));
```

Since `customLocationName` is null for location-linked stops, `RouteRunStopView.tsx` line 52 falls back to `"Location Stop"`.

**Fix:** When building the active stops list, copy the resolved `displayName` into `customLocationName` so it carries through to the stop view:

```typescript
.map(({ enabled, displayName, ...stop }, idx) => ({
  ...stop,
  stopOrder: idx,
  customLocationName: displayName,  // Carry the resolved name
}));
```

**File:** `src/components/mileage/RouteRunSetup.tsx` (line 85, one-line change)

---

### Problem 2: Quick action to start a route from mobile

Add a "Run Route" tab/option to the Quick Add bottom sheet so mobile users can pick a saved route and jump straight to the mileage tracker with that route selected.

**Changes:**

1. **`src/components/mobile/QuickAddSheet.tsx`**
   - Add a 4th tab called "Route" with a Route/Play icon
   - The tab shows a list of the user's saved routes (fetched via `useRoutes`)
   - Tapping a route navigates to `/mileage?runRoute=ROUTE_ID` and closes the sheet

2. **`src/pages/MileageTracker.tsx`**
   - Read `runRoute` query parameter on mount
   - If present, find the matching route and automatically open the Route Run flow (set `routeRunRoute` and switch to the routes tab)
   - Clear the query param after consuming it

No database changes needed.
