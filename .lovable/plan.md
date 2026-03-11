

## Add Cancel Route Run During Active Run

Currently, the "Discard" option only appears on the summary screen (after all stops are completed). There's no way to cancel mid-run while on a stop.

### Change

**`src/components/mileage/RouteRunPage.tsx`** -- Add a "Cancel Route" button with confirmation dialog during the `running` phase. Uses the existing `onDiscardRun` handler with an `AlertDialog` to prevent accidental cancellation.

The cancel button will appear as a subtle destructive-text button below the stop view (e.g., "Cancel Route Run"), triggering a confirmation dialog: "Are you sure? This will discard all progress and collected data for this run."

Single file change, reuses existing `discardRouteRun` logic from `useRouteRun`.

