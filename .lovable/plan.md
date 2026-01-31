

## Add View and Edit Functionality to Routes History Tab

### Overview
Enhance the Routes (Mileage Tracker) History tab to allow users to view entry details and edit their trip records. This follows the same pattern established in the Revenue Tracker for consistency.

---

### Current State
The History tab currently shows a compact table with:
- Date, From, To, Miles, Purpose
- Only a delete button for each entry

Users cannot see full details (odometer readings, vehicle info, notes) or edit mistakes.

---

### Changes Summary

| Feature | Description |
|---------|-------------|
| **View Details** | Click any row to expand and see full trip details |
| **Edit Button** | Pencil icon to open an edit dialog for any entry |
| **Edit Dialog** | Modal form to modify date, From/To, odometer readings, purpose, notes |
| **Update Function** | New `updateEntry` function in `useMileageDB` hook |

---

### Implementation Details

#### 1. Add `updateEntry` to `useMileageDB.ts`

Add a new function to update mileage entries, following the pattern from `useRevenueEntriesDB`:

```typescript
const updateEntry = async (id: string, updates: Partial<Omit<MileageEntry, "id" | "createdAt">>) => {
  // Update Supabase record
  // Update local state
  // Also update vehicle's last_recorded_odometer if odometer changed
}
```

Fields that can be updated:
- `date`
- `startLocation`
- `endLocation`
- `locationId`
- `miles` (auto-calculated from odometer)
- `purpose`
- `notes`
- `vehicleId`
- `odometerStart`
- `odometerEnd`

---

#### 2. Update History Tab UI in `MileageTracker.tsx`

**Enhanced Table Columns:**
- Add Vehicle column
- Add Odometer column (showing start -> end)
- Add Edit button next to Delete button

**Row Expansion or Dialog:**
Clicking a row (or an "Eye" icon) shows full details including:
- Vehicle name
- Complete addresses (From / To)
- Odometer readings (Start / End)
- Notes

**Edit Dialog State:**
```typescript
const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [editDate, setEditDate] = useState<Date>(new Date());
const [editVehicleId, setEditVehicleId] = useState("");
const [editFromSelection, setEditFromSelection] = useState<LocationSelection>({ type: "warehouse" });
const [editToSelection, setEditToSelection] = useState<LocationSelection>({ type: "location" });
const [editOdometerStart, setEditOdometerStart] = useState("");
const [editOdometerEnd, setEditOdometerEnd] = useState("");
const [editPurpose, setEditPurpose] = useState("");
const [editNotes, setEditNotes] = useState("");
const [isEditSaving, setIsEditSaving] = useState(false);
```

---

#### 3. Edit Dialog Design

The dialog will include:
- Date picker
- Vehicle selector
- From location (LocationSelector component)
- To location (LocationSelector component)
- Odometer Start input
- Odometer End input
- Calculated miles display (auto-computed)
- Purpose dropdown
- Notes textarea
- Cancel / Save buttons

Validation:
- Vehicle required
- From required
- To required
- Odometer end > start
- Both odometer fields required

---

#### 4. View Details Enhancement

Two options (implementing the expandable row):

**Option A: Expandable Row**
Click row to expand and show additional details inline:
- Vehicle name
- Full addresses
- Odometer readings (12,345 -> 12,392)
- Notes

**Option B: Details Dialog (Simpler)**
Add an "Eye" icon that opens a read-only dialog with all entry details.

For consistency and mobile-friendliness, we will implement **Option A** (expandable rows) with an edit button that opens the edit dialog.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMileageDB.ts` | Add `updateEntry` function, export it |
| `src/pages/MileageTracker.tsx` | Add edit dialog, expandable row details, edit/view functionality |

---

### Visual Layout - History Table (Enhanced)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Date    │ Vehicle  │ From         │ To           │ Miles │ Purpose│Actions│
├──────────────────────────────────────────────────────────────────────────┤
│ 01/31   │ Work Van │ Warehouse    │ Pizza Palace │  23.5 │ Collect│ ✏️ 🗑️ │
│ ▼ Odometer: 45,230 → 45,253.5 | Notes: Weekly pickup              │     │
├──────────────────────────────────────────────────────────────────────────┤
│ 01/30   │ Work Van │ Pizza Palace │ Game Zone    │  12.0 │ Collect│ ✏️ 🗑️ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Edit Dialog Layout

```
┌─────────────────────────────────────────┐
│         ✏️ Edit Trip Entry              │
├─────────────────────────────────────────┤
│ Date                                    │
│ [January 31, 2026              📅]      │
├─────────────────────────────────────────┤
│ Vehicle                                 │
│ [Work Van                       ▼]      │
├─────────────────────────────────────────┤
│ From                                    │
│ [Warehouse                      ▼]      │
├─────────────────────────────────────────┤
│ To                                      │
│ [Pizza Palace                   ▼]      │
├─────────────────────────────────────────┤
│ ┌────────────────┐ ┌─────────────────┐  │
│ │ Start Odometer │ │ End Odometer    │  │
│ │ [  45230     ] │ │ [  45253.5   ]  │  │
│ └────────────────┘ └─────────────────┘  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Calculated Miles:    23.5 mi        │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Purpose                                 │
│ [Collection Run                 ▼]      │
├─────────────────────────────────────────┤
│ Notes                                   │
│ [Weekly pickup                     ]    │
├─────────────────────────────────────────┤
│         [ Cancel ]   [ Save Changes ]   │
└─────────────────────────────────────────┘
```

---

### Logic for Handling Edits

When saving an edit:
1. Validate all required fields
2. Calculate miles from odometer readings
3. Get location display strings from selections
4. Call `updateEntry` with the new values
5. If odometer end changed and is higher than vehicle's last recorded, update the vehicle's `last_recorded_odometer`
6. Show success toast
7. Close dialog

---

### Mobile Considerations

The edit dialog will use `sm:max-w-[500px]` to ensure it displays properly on mobile devices. The LocationSelector components already handle mobile layout well.

