# ClawOps: Cockpit, Owner Portal, and UI Polish

A three-phase build. Each phase ships standalone value.

## Phase 1 — Route Day Cockpit + Offline

A single "Today" surface that replaces guesswork on the road.

- **Today screen** (new home for mobile, card on desktop dashboard): today's route, next stop, distance to it, cash expected, restock items to bring, and one big primary action.
- **One-tap stop flow**: arrive (geofence auto-detect already exists) → enter collection totals → capture required photos → commission auto-computed → next stop. Minimal taps, big targets, numeric keypads.
- **Bring list**: before departure, aggregate the restock items needed across all stops on the route so nothing is forgotten at the warehouse.
- **Offline queue**: collections, photos, mileage, and stop completions write to a local queue when the network is down, with a visible "3 pending" chip and automatic sync on reconnect. Photos are held as blobs and uploaded on reconnect.
- **Run recap**: end-of-run summary with total collected, miles, commission owed per location, and a share/export action.

## Phase 2 — Location Owner Portal

A public, read-only page per location so venue owners can self-serve.

- Public link per location (reuses the existing slug scheme, no login required).
- Shows: recent commission statements, amount and paid/unpaid status, machines on site, a "report an issue" button (wired to the existing maintenance reporting), and the referral promo block.
- Owner controls per location: enable/disable the portal, choose what is visible, copy link, and print a QR card for the venue counter.
- Access is via an unguessable token, revocable at any time. No revenue detail beyond what the owner opts to share.

## Phase 3 — UI Polish Layer

Systemwide quality-of-life work applied across trackers and lists.

- **Bulk actions**: multi-select on revenue, inventory, leads, and locations with a sticky action bar (delete, export, change status, assign).
- **Undo toasts**: destructive actions show "Deleted — Undo" instead of a confirm dialog where safe.
- **Inline edit**: click-to-edit on key table cells (quantity, amount, status) without opening a dialog.
- **Saved views/filters**: name and pin filter combinations per list.
- **Command palette upgrade**: recents, in-app actions ("start route", "add expense"), and fuzzy jump-to-location/machine.
- **Density + consistency pass**: unified table/card components, tabular numbers everywhere money appears, consistent loading skeletons and empty states.

## Technical notes

- Offline: `idb-keyval` for a durable mutation queue plus a blob store for photos; a small sync manager drains it on `online` and on app focus. Existing hooks (`useRouteRun`, `useRevenueEntriesDB`, `useMileageDB`) get a queued-write path so UI stays optimistic.
- Today screen composes existing pieces: `useRoutesDB`, `useRouteRun`, `useGeofence`, `useSmartScheduler`, `useInventoryDB`.
- Portal: new `location_portal_tokens` table (token, location_id, enabled, visibility flags) with a `security definer` function returning only whitelisted fields; public route added alongside `/report/:locationSlug/:unitCode`, wrapped like the existing public routes. Grants for `anon` limited to the function, not the tables.
- Bulk actions and inline edit land as shared components (`BulkActionBar`, `InlineEditCell`) so each list adopts them with a small diff.
- All new UI uses existing semantic tokens; no new palette.

## Order

Phase 1 → Phase 2 → Phase 3, each verified in the preview before moving on.
