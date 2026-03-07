

## Clean Up Routes: Remove GPS, Simplify Mileage UX

### What changes

**1. Remove GPS tracking entirely** (desktop + mobile)
- Delete `TrackingModeSelector` component usage from all forms
- Delete `GpsTracker` component usage from all forms
- Remove GPS-related state, handlers, and imports from `MileageTracker.tsx` and `QuickMileageForm.tsx`
- Remove GPS mode from `RouteRunSetup.tsx` (the two-button tracking mode picker)
- Keep the `GpsTracker.tsx` and `TrackingModeSelector.tsx` files for now (dead code cleanup later), but remove all references

**2. Simplify "Log Trip" tab** (one-off trips only)
- Remove the Route Quick Selector from the Log Trip form -- routes belong in the Routes tab
- Streamline the form to: Vehicle, From, To, Start Odometer, Purpose, Notes, "Start Trip" button
- The form only prompts for start odometer; end odometer is entered when the trip completes (existing `ActiveTripCard` flow stays)
- Auto-fill start odometer from the vehicle's last recorded reading

**3. Simplify "Routes" tab** (route runs only)
- When no route run is active, show the route list with a clear "Run" button on each route
- Remove GPS option from `RouteRunSetup.tsx` -- always odometer mode
- Auto-fill starting odometer from selected vehicle's last recorded reading
- The route run flow stays: Setup → Stop-by-stop → Summary with end odometer

**4. Simplify mobile `QuickMileageForm`**
- Remove `TrackingModeSelector` and GPS tracking mode
- Remove `RouteQuickSelector` -- the mobile quick add for mileage is for one-off trips only (route runs are accessed from the Routes tab)
- Streamline to: Vehicle, From, To, Start Odometer, Purpose, Notes, Start Trip
- Auto-fill start odometer from vehicle's last reading

### Files to change

| File | Change |
|---|---|
| `src/pages/MileageTracker.tsx` | Remove GPS state/handlers, remove TrackingModeSelector, remove RouteQuickSelector from Log Trip tab, remove GPS tracker UI block, auto-fill odometer |
| `src/components/mileage/RouteRunSetup.tsx` | Remove tracking mode picker (always odometer), auto-fill odometer from vehicle |
| `src/components/mileage/RouteRunSummary.tsx` | Remove GPS mode conditional (always show odometer end) |
| `src/components/mileage/RouteRunPage.tsx` | Remove TrackingMode import, simplify onStartRun to always use odometer |
| `src/components/mobile/QuickMileageForm.tsx` | Remove TrackingModeSelector, GpsTracker, RouteQuickSelector, GPS handlers; streamline to odometer-only one-off trip form |
| `src/components/mileage/ActiveTripCard.tsx` | No major changes needed (already odometer-focused) |

### What stays the same
- Route management (create/edit/delete routes) in the Routes tab
- Stop-by-stop route run workflow with collections, commissions, GPS coordinate capture at stops
- Trip history tab with filtering and export
- Active trip persistence across sessions

