# Premium Routes Overhaul with Arrival Detection

Rebuild the routes experience so that opening the app on a route feels like the app already knows where you are: it detects the location you've arrived at, surfaces everything you need for that stop (commission owed, machines, collection entry), and enforces photo verification for team members whose owner requires it.

Mileage stays strictly odometer-based. GPS is used only to detect arrival at a location, never to measure trip distance.

## 1. Location coordinates

- Add latitude/longitude plus a geofence radius (default 150 m) to each location.
- Coordinates are auto-geocoded from the saved address (same OpenStreetMap/Nominatim service the map already uses), on save and as a backfill pass for existing locations.
- If geocoding fails or looks wrong, the location edit form shows the resolved point and lets the owner correct the address or clear/re-run the lookup.

## 2. Arrival detection ("suggest, don't jump")

- A single background position read (with the user's permission) compares the current position to every location with coordinates.
- When inside a geofence, a prominent arrival banner appears: location name, distance, and a primary action.
  - Not in a run: "You're at Main Street Arcade — Start collection here" plus a secondary "Start the route this stop belongs to".
  - During an active run: "You're at stop 3 of 6 — Jump to this stop" so the driver can work stops out of order without losing the run.
- Nothing auto-navigates. A dismiss control hides the banner for that visit, and a "not here?" link opens location search.
- If permission is denied or unavailable, the routes screen behaves exactly as it does today with no errors or nags.

## 3. Premium stop screen

Reworked arrival/collection screen for a stop, replacing the current dense form layout:

- Header: location name, address, stop progress, arrival status (in-geofence vs. distance away), and last-collected date.
- Money card: commission owed for the pending period, the rate, and a pay/mark-paid toggle — pulled from existing commission summary logic, including split-rate locations.
- Machines: one card per machine with coins, prizes, and optional bag label, expected-vs-actual comparison inline, and large touch targets.
- Notes and service-period controls collapse under an "Advanced" disclosure so the default screen stays short.
- Sticky bottom action bar with running totals and Complete Stop.

## 4. Team member photo verification

- New per-member permission with three settings: not required, one photo per stop, one photo per machine.
- When required, the stop screen shows camera capture slots and blocks Complete Stop until each required photo is attached; the button explains what is missing.
- Photos upload to the existing private location-photos storage and are attached to the stop's collection record, visible to the owner from the run summary and the location history with who took them and when.
- Owners are never blocked by this requirement.

## 5. Run summary and history

- Post-run summary lists each stop with revenue collected, commission paid, mileage, and photo thumbnails where verification was required.
- Owners get a route-run history view with the same per-stop detail.

## Technical notes

- Migration: add `latitude`, `longitude`, `geofence_radius_m` to `locations`; add `photo_verification` (`none` | `per_stop` | `per_machine`) to `team_member_permissions`; add a `collection_photos` table (stop/collection reference, storage path, machine reference, taken-by user, timestamp) with grants and RLS scoped through the existing `get_effective_owner_id` / `has_team_permission` functions.
- New `useGeofence` hook: single `getCurrentPosition` read plus manual refresh, Haversine distance against cached location coordinates, no continuous `watchPosition` (avoids battery drain and keeps mileage odometer-only). Reuses the Haversine helpers from the existing GPS utility.
- New `useLocationGeocoding` helper wrapping Nominatim with request caching, reusing the pattern from the map page.
- `RouteRunStopView` is split into presentational subcomponents (arrival header, commission card, machine collection card, photo verification block, sticky action bar) to keep files small.
- Existing route-run state machine in `useRouteRun` is extended with an out-of-order "go to stop" path and photo attachment on stop completion; run/stop data shape stays backward compatible with in-progress runs.
