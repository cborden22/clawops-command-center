

## Improved Inventory Add System: Bulk Add + Simplified Fields

---

### Problems Being Fixed

1. **No bulk add** -- Adding 10+ new items means repeating the same form 10 times. There's no way to queue up multiple new items and save them all at once.

2. **"Last Price" is confusing** -- The current add form asks for "Last price" alongside "Packaging: Case of 24". Users have to mentally figure out whether this is the price per item or per case. The label doesn't clarify.

3. **"Total Quantity" is ambiguous** -- The quantity field says "10" but it's unclear if that means 10 individual items or 10 cases (which would be 240 items). There's no visual feedback connecting quantity to packaging.

---

### What Changes

#### 1. Simplified "Add Item" Form (Single Add)

The current Quick Add section gets clearer labels and live feedback:

- **Quantity field**: Relabel to "Total Individual Items" with helper text like "How many individual pieces you have in total"
- **Price field**: Relabel from "Last price" to "Cost per [Case/Bag/Box]" -- the label dynamically updates based on the selected package type. Below it, auto-display the calculated "= $X.XX per item" so users can verify
- **Add a visual summary line** below the form: "Adding 10 Plush Bears | Case of 24 | $15.00/case ($0.63/ea)"

#### 2. New "Bulk Add" Mode

A new button next to the existing Quick Add form opens a spreadsheet-style entry mode:

- **Bulk Add Sheet** (bottom sheet on mobile, dialog on desktop) with a table where each row is a new item
- Each row has: Name, Qty (individual items), Package Type (dropdown), Items per Package, Cost per Package
- Start with 3 empty rows, "Add Row" button at the bottom
- Delete row button (X) on each row
- "Add All Items" button at the bottom saves all rows at once
- Price per item auto-calculates in a read-only column
- Min stock defaults to 10 for all (can be edited later via the existing edit dialog)

#### 3. Clarify Existing Item Display

In the item list, change the subtitle from:

`Case of 24 | $15.00 ($0.63/ea)`

to:

`Buys in: Case of 24 | Last cost: $15.00/case ($0.63/ea)`

This makes it immediately clear what the numbers mean.

---

### User Flow

```text
Inventory Page (not in Stock Run or Return mode)
  |
  +-- Quick Add (existing, simplified labels)
  |     Name [____] Qty [__] [Add]
  |     Packaging: [Case v] of [24]
  |     Cost per Case: [$____]  = $0.63/ea
  |
  +-- [Bulk Add Items] button
        |
        +-- Sheet/Dialog opens with table rows
        |     | Name        | Qty | Pkg Type | Per Pkg | Cost/Pkg | /ea    |
        |     |-------------|-----|----------|---------|----------|--------|
        |     | Plush Bears | 48  | Case     | 24     | $15.00   | $0.63  |
        |     | Rubber Duck | 100 | Bag      | 50     | $8.00    | $0.16  |
        |     | [empty row] |     |          |        |          |        |
        |     [+ Add Row]
        |
        +-- [Add All X Items] button
              saves all rows to inventory at once
```

---

### Technical Details

**Modified file: `src/components/InventoryTrackerComponent.tsx`**

1. Update Quick Add section (lines 480-547):
   - Change "Last price:" label to "Cost per [PackageType]:"
   - Add calculated "= $X.XX/ea" display next to the price input
   - Change quantity label context to be clearer

2. Update item subtitle display (lines 658-671):
   - Change from `Case of 24 | $15.00 ($0.63/ea)` 
   - To `Buys in: Case of 24 | $15.00/case ($0.63/ea)`

3. Add "Bulk Add Items" button next to the Quick Add card
   - Opens the new `BulkAddInventoryDialog`
   - Only visible when not in Stock Run or Return mode

**New file: `src/components/inventory/BulkAddInventoryDialog.tsx`**

- Dialog/Sheet component with a multi-row entry table
- Each row: name (text input), quantity (number), package type (select), package qty (number), cost per package (number), calculated price per item (read-only)
- State: array of `BulkAddRow` objects
- Starts with 3 empty rows
- "Add Row" appends a new empty row
- "Remove Row" (X button) removes a row (minimum 1 row)
- Validation: skip empty rows, require name + quantity for non-empty rows
- On submit: calls `addItem()` for each valid row in sequence, shows toast with count
- Auto-closes on success

**Modified file: `src/components/mobile/QuickInventoryForm.tsx`**

- Update the "New Item" mode to match the same clearer labels
- Add package type and cost fields (currently missing from mobile form)

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/inventory/BulkAddInventoryDialog.tsx` | Create -- multi-row bulk add dialog |
| `src/components/InventoryTrackerComponent.tsx` | Modify -- clearer labels, add Bulk Add button, fix item display |
| `src/components/mobile/QuickInventoryForm.tsx` | Modify -- add package/cost fields, clearer labels |

