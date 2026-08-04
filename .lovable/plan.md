# Per-Machine Commission Rates

Right now a commission rate lives only on the location, so the Split Rate generator makes you retype each machine's percentage every time. This makes the rate a property of the machine itself, set once during setup and reused everywhere.

## What changes

### Location setup (Add/Edit Location)
Each machine row gets a **Commission %** field next to Win Probability and Installed date. It pre-fills from the location's overall commission rate, and you can override it per machine (e.g. 40% boxing, 25% claw).

### Location details / Machines manager
The machine add/edit form gets the same **Commission %** field, so rates can be adjusted later without rebuilding the location. Machine cards show the rate as a small badge when it differs from the location default.

### Split Rate commission generator
Machine rows seed their rate from each machine's saved commission rate instead of the location-wide rate. Rates stay editable per report, so a one-off adjustment doesn't change the saved setup. Machines with no saved rate fall back to the location rate as they do today.

### Standard generator
Unchanged.

## Technical notes

- Migration: add `commission_rate numeric` (nullable) to `public.location_machines`. Nullable means "inherit the location rate" — no backfill needed and existing behavior is preserved.
- `src/hooks/useLocationsDB.ts`: add `commissionRate?: number` to the `MachineType` interface; map it in the fetch mapper and include `commission_rate: m.commissionRate ?? null` in both the add and update machine-insert paths.
- `src/components/LocationTrackerComponent.tsx`: new numeric input in the machine row grid, wired through `handleMachineTypeChange` (`commissionRate` → `Number(value)` or undefined); `handleAddMachineType` seeds it from `formData.commissionRate`.
- `src/components/MachinesManager.tsx`: add `commissionRate` to `formData`, the add/edit dialog, `handleSubmit`, `handleEdit`, and the reset helper; show a rate badge on the machine card.
- `src/components/SplitRateCommissionGenerator.tsx`: seeding loop uses `machine.commissionRate ?? location.commissionRate ?? 0` per expanded row.
- Numeric inputs follow the existing auto-select-on-focus convention.
