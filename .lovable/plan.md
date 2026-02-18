

## Route Run Mode: Guided Stop-by-Stop Workflow

### Overview

This feature transforms the existing "Use This Route" button into a full guided workflow that walks the operator through each stop on their route, one at a time. It handles mileage tracking, machine collections, notes, and commission payments -- all in a single streamlined flow optimized for both mobile and desktop.

### How It Works (User Flow)

1. **Start Route Run** -- User taps "Run Route" on a saved route. A setup screen asks:
   - Select vehicle
   - Choose tracking mode (GPS or Odometer)
   - If odometer: enter starting odometer reading
   - Tap "Start Route"

2. **Stop-by-Stop Workflow** -- For each stop in the route:
   - Show the current stop name, address, and stop number (e.g., "Stop 2 of 5")
   - **Machine Collection**: List all machines at that location (fetched from `location_machines`). For each machine, the user can enter coins inserted and prizes won (same fields as existing `machine_collections`)
   - **Location Notes**: A text field to add notes about this stop
   - **Commission Prompt**: If the location has unpaid commission summaries, show a prompt: "This location has a pending commission of $X. Mark as paid?" with a checkbox
   - **Mark Complete**: Button to finalize the stop and advance to the next one

3. **Route Complete** -- After the last stop:
   - If odometer mode: prompt for ending odometer reading
   - If GPS mode: automatically stop tracking
   - Show a summary: total stops completed, total collections, miles traveled
   - Save the mileage entry and all collection data
   - Return to the mileage tracker

### New Database Table

A new table `route_runs` to persist the state of an in-progress route run, so it survives page refreshes and app restarts:

```
route_runs
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- route_id (uuid, NOT NULL, FK to mileage_routes)
- mileage_entry_id (uuid, FK to mileage_entries) -- the associated trip
- current_stop_index (integer, default 0)
- status (text, default 'in_progress') -- in_progress, completed, discarded
- stop_data (jsonb) -- array of per-stop results (collections, notes, commission actions)
- started_at (timestamptz, default now())
- completed_at (timestamptz)
- created_at (timestamptz, default now())
```

RLS: Users can only CRUD their own rows (`auth.uid() = user_id`).

### New Files

1. **`src/hooks/useRouteRun.ts`** -- Hook to manage route run state:
   - `startRouteRun(routeId, vehicleId, trackingMode, odometerStart?)` -- creates route_run row + mileage_entry
   - `getCurrentStop()` -- returns current stop info
   - `completeStop(stopData)` -- saves collection data, notes, commission actions; advances index
   - `completeRouteRun(odometerEnd?)` -- finalizes the mileage entry and route run
   - `discardRouteRun()` -- deletes both records
   - `activeRouteRun` -- current in-progress run (fetched on mount)

2. **`src/components/mileage/RouteRunSetup.tsx`** -- The initial setup dialog/sheet:
   - Vehicle selector, tracking mode toggle, odometer input
   - "Start Route" button

3. **`src/components/mileage/RouteRunStopView.tsx`** -- The per-stop view:
   - Stop header with progress indicator
   - Machine collection cards (coins, prizes per machine)
   - Notes textarea
   - Commission prompt (if applicable)
   - "Mark Complete" / "Next Stop" button

4. **`src/components/mileage/RouteRunSummary.tsx`** -- End-of-route summary:
   - Final odometer input (if odometer mode)
   - Stats: stops visited, total coins collected, miles driven
   - "Finish Route" button

5. **`src/components/mileage/RouteRunPage.tsx`** -- Container component that orchestrates the three phases (setup, stops, summary) and renders the correct view based on state

### Modified Files

1. **`src/pages/MileageTracker.tsx`** -- Add route run state; when a route run is active, show `RouteRunPage` instead of the normal log form
2. **`src/components/mileage/RouteManager.tsx`** -- Change "Use This Route" / "Log Trip" to "Run Route" with a play icon; wire up to start the route run flow
3. **`src/hooks/useActiveTrip.ts`** -- Minor: ensure route runs create trips with `route_id` set so they link properly

### Mobile Optimization

- All new views use full-width card layouts with large touch targets (min 48px)
- Machine collection inputs use `inputMode="numeric"` with large font sizes
- Progress indicator is a horizontal stepper bar showing current stop
- "Mark Complete" button is sticky at the bottom of the viewport on mobile
- The stop view is scrollable with the action button always visible
- Commission prompt uses a bottom sheet on mobile, dialog on desktop

### Data Flow

```text
User taps "Run Route"
  --> RouteRunSetup (select vehicle, tracking mode)
  --> Creates route_run + mileage_entry (in_progress)
  --> RouteRunStopView (stop 1)
    --> User collects machines, adds notes
    --> Saves to machine_collections + updates stop_data jsonb
    --> Optionally marks commission as paid
    --> Advances to stop 2... repeat
  --> RouteRunSummary (after last stop)
    --> Enter end odometer (if applicable)
    --> Completes mileage_entry + route_run
    --> Refetch mileage entries
```

### Edge Cases Handled

- **App refresh mid-run**: `useRouteRun` fetches any `in_progress` route_run on mount, restoring the exact stop
- **Location with no machines**: Skip the collection section, show only notes
- **Location not in system** (custom stop name): Show notes only, no machine/commission features
- **Already has active trip**: Prevent starting a route run if there's already a standalone active trip
- **Empty route** (< 2 stops): Disable the "Run Route" button

