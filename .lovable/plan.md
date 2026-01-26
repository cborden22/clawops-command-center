

## Add Edit Feature for Revenue Tracker Log Entries

### Overview
Add the ability to edit existing revenue entries (income and expenses) from the Entry History table. Users will be able to modify all fields of an entry including date, amount, location, category, notes, and machine type (for income entries). This mirrors the existing "add entry" form but pre-populated with the entry's current data.

---

### Database Changes
No database schema changes required. The existing RLS policy already allows users to update their own revenue entries:
```
Users can update own revenue entries - USING (auth.uid() = user_id)
```

---

### Hook Changes (`src/hooks/useRevenueEntriesDB.ts`)

Add a new `updateEntry` function to the hook:

| Function | Parameters | Description |
|----------|------------|-------------|
| `updateEntry` | `id: string`, `updates: Partial<RevenueEntry>` | Updates an existing entry in Supabase and local state |

The function will:
- Call Supabase to update the `revenue_entries` row
- Update the local `entries` state to reflect changes
- Return the updated entry or null on error

---

### Component Changes (`src/components/RevenueTrackerComponent.tsx`)

#### 1. Add Edit State
New state variables:
- `editingEntry: RevenueEntry | null` - Tracks which entry is being edited
- `isEditDialogOpen: boolean` - Controls the edit dialog visibility

#### 2. Create Edit Entry Dialog
A new `Dialog` component that opens when editing an entry, containing:
- Entry type display (income/expense - read-only, cannot change type)
- Date picker (pre-filled)
- Amount input (pre-filled)
- Location dropdown (pre-filled)
- Machine type dropdown (for income entries, pre-filled)
- Category dropdown (for expense entries, pre-filled)
- Notes textarea (pre-filled)
- Save and Cancel buttons

The dialog will reuse the same UI patterns as the "Add Entry" form for consistency.

#### 3. Add Edit Button to Table Rows
In the Entry History table, add an edit button (Pencil icon) next to the existing delete button:
- Appears on hover alongside delete button
- Clicking opens the edit dialog with entry data pre-loaded

#### 4. Handle Edit Submission
`handleEditEntry` function that:
- Validates the edited data
- Calls `updateEntry` from the hook
- Closes the dialog
- Shows success/error toast

---

### UI Design

**Edit Dialog Structure:**
```
┌─────────────────────────────────────────┐
│ Edit [Income/Expense] Entry             │
├─────────────────────────────────────────┤
│ Date                                    │
│ ┌─────────────────────────────────────┐ │
│ │  📅  January 26, 2026               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Amount                                  │
│ ┌─────────────────────────────────────┐ │
│ │  $ 125.00                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Location                                │
│ ┌─────────────────────────────────────┐ │
│ │  Main Street Arcade            ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Category dropdown - expenses only]     │
│ [Machine type dropdown - income only]   │
│                                         │
│ Notes                                   │
│ ┌─────────────────────────────────────┐ │
│ │  Weekly collection                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────┐  ┌──────────────────┐  │
│ │   Cancel    │  │   Save Changes   │  │
│ └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
```

**Table Row Actions:**
```
│ Details                                 │ Actions    │
│ [Prize Restock] [📎] Monthly restock... │ ✏️ 🗑️     │
```

---

### Technical Details

#### Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useRevenueEntriesDB.ts` | Add `updateEntry` function |
| `src/components/RevenueTrackerComponent.tsx` | Add edit dialog, edit state, edit button in table, handle edit submission |

#### New Imports Needed
In `RevenueTrackerComponent.tsx`:
- `Pencil` icon from lucide-react (or `Edit2`)

#### Edit Dialog Form State
The edit dialog will use local state to manage the form:
- `editDate: Date`
- `editAmount: string`
- `editLocation: string`
- `editCategory: string`
- `editMachineType: string`
- `editNotes: string`

These are initialized from `editingEntry` when the dialog opens.

---

### User Flow

1. User views Entry History table
2. User hovers over an entry row
3. Edit button (pencil icon) appears alongside delete button
4. User clicks edit button
5. Edit dialog opens with all fields pre-populated
6. User modifies desired fields
7. User clicks "Save Changes"
8. Entry updates in database and table refreshes
9. Success toast confirms the update

---

### Edge Cases Handled

- **Entry type preserved**: Income entries stay income, expense entries stay expense (type field is display-only in edit mode)
- **Validation**: Same validation rules as adding entries (amount required, location required for income, category required for expenses)
- **Optimistic updates**: Local state updates immediately, rolls back on error
- **Receipt handling**: Receipt URL is preserved during edit (editing receipt attachment is a separate feature)
- **Machine metrics**: For income entries with machine collections, only the revenue entry is updated (associated machine_collections record remains unchanged to preserve metrics history)

