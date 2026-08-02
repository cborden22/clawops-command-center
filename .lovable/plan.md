# Install Date per Machine in the Location Form

Add an install date field to each machine row when creating or editing a location, matching the date picker already used in the machine manager.

## What changes

- Each machine row in the Add/Edit Location dialog gets an **Installed** date picker, sitting next to the Win Probability field.
- Defaults to today's date when a new machine row is added, and can be cleared or changed.
- Existing machines keep and show their saved install date when editing a location.
- The date saves with the location, so newly created machines no longer show up as "never installed" in reminders.

## Technical notes

- `src/components/LocationTrackerComponent.tsx`:
  - `handleAddMachineType` seeds `installedAt` with today (`yyyy-MM-dd`).
  - `handleMachineTypeChange` accepts `installedAt` string values.
  - Machine row UI: shadcn Popover + Calendar button (same pattern as `MachinesManager.tsx`), with `pointer-events-auto` on the calendar and timezone-safe parsing via `new Date(value + 'T00:00:00')`.
- No schema or hook changes needed — `MachineType.installedAt` and the `location_machines.installed_at` write path already exist in `useLocationsDB`.
