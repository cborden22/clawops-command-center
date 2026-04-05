

## Fix: Spaces Not Working in Custom Label Input

### Problem
When adding machines via the dialog in the Machines Manager, pressing the space bar in the "Custom Label" input doesn't type a space. This is a known Radix UI Dialog issue where the space key event bubbles up from the input to the dialog's internal keyboard handler, which intercepts it (space key typically activates buttons/triggers in accessibility contexts).

### Fix
Add `onKeyDown={(e) => e.stopPropagation()}` to all text `Input` fields inside Radix Dialog/Sheet components where users need to type spaces. This prevents the space key event from bubbling up to the dialog's keyboard handler.

### Files to Change

**`src/components/MachinesManager.tsx`**
- Add `onKeyDown={(e) => e.stopPropagation()}` to the Custom Label `Input` (line ~328)

**`src/components/leads/ConvertToLocationDialog.tsx`**
- Same fix on the custom label `Input` inside the convert dialog (line ~433)

These are the two dialog-based forms where custom labels are entered. The `LocationTrackerComponent.tsx` form is inline (no dialog), so it shouldn't have this issue.

