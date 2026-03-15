

## Remove GPS/Current Location from Route Run Stop View

Since the app is odometer-only, remove the "Current Location GPS" card and all related GPS state/logic from `RouteRunStopView.tsx`.

### Changes to `src/components/mileage/RouteRunStopView.tsx`

1. **Remove GPS state variables** (lines 64-66): `gpsPosition`, `gpsLoading`, `gpsError`
2. **Remove GPS reset useEffect** (lines 78-83)
3. **Remove `captureCurrentLocation` function** (lines 85-110)
4. **Remove GPS data from `handleCompleteStop`** (lines 212-214): `gpsLat`, `gpsLng`, `gpsAccuracy`
5. **Remove the entire "Current Location GPS" card** (lines 301-358)
6. **Remove unused `Locate` icon import** if no longer referenced

No other files need changes -- the `StopResult` type in `useRouteRun.ts` can keep the optional GPS fields for backward compatibility with existing data.

