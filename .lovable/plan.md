

## Fix Location Names + Add Navigation + Rename Tab

### 1. Fix "Location Stop" name bug (Root Cause)

The `RouteRunSetup` component initializes `customStops` state in a `useState` callback, but `locations` from `useLocationsDB` loads asynchronously, so on first render `locations` is empty and all stops get fallback names like "Stop 1". The `useMemo` block that re-resolves names is **misused** (it calls `setCustomStops` as a side effect inside `useMemo`, which is unreliable). This must be changed to a proper `useEffect`.

Additionally, `RouteRunStopView` independently reads `stop.customLocationName` but never resolves `locationId` itself. Since the setup phase now writes resolved names into `customLocationName`, this works IF the setup resolution actually fires. The fix is:

**File: `src/components/mileage/RouteRunSetup.tsx`**
- Change the `useMemo` on lines 47-59 to a `useEffect` so it reliably re-resolves location names when `locations` loads
- Also re-initialize stops when `route` changes

### 2. Add Previous/Next stop navigation

Currently there is no way to go back to a previous stop or skip forward. The stop view only has a "Next Stop" button.

**File: `src/components/mileage/RouteRunStopView.tsx`**
- Add a "Previous Stop" button (left arrow) next to the progress bar
- Add an `onGoBack` callback prop so the parent can decrement the stop index

**File: `src/components/mileage/RouteRunPage.tsx`**
- Add a `handleGoBack` function that decrements `activeRun.currentStopIndex` (in both local state and the database)
- Pass it to `RouteRunStopView` as `onGoBack`

**File: `src/hooks/useRouteRun.ts`**
- Add a `goToStop(index)` function that updates `current_stop_index` in the database and local state (without adding/removing stop data)

### 3. Rename "Templates" tab to "Routes"

**File: `src/pages/MileageTracker.tsx`** (line 785)
- Change the tab label from "Templates" to "Routes"

### Summary of file changes

| File | Change |
|------|--------|
| `src/components/mileage/RouteRunSetup.tsx` | Fix `useMemo` to `useEffect` for reliable name resolution |
| `src/components/mileage/RouteRunStopView.tsx` | Add Previous Stop button, accept `onGoBack` prop |
| `src/components/mileage/RouteRunPage.tsx` | Wire up `handleGoBack` using new `goToStop` |
| `src/hooks/useRouteRun.ts` | Add `goToStop(index)` method |
| `src/pages/MileageTracker.tsx` | Rename "Templates" to "Routes" |

No database changes needed.
