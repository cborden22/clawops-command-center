

## Plan: Improve Inventory UX — Warehouse Management in Inventory + Clearer Quantity Labels

### Problem
1. Warehouse/zone management is buried in Settings — users have to leave Inventory to create warehouses and zones.
2. When adding items, it's unclear what the quantity number represents (total individual items vs. number of packages).

### Changes

#### 1. Add a "Warehouses" tab to the Inventory Tracker page
**File: `src/pages/InventoryTracker.tsx`**
- Add a third tab alongside "Inventory" and "Where Is It?" called "Warehouses" (with the Warehouse icon).
- Render the existing `WarehouseManager` component inside that tab.
- This gives users direct access to create/edit warehouses and zones without leaving the Inventory page.

#### 2. Clarify quantity labels in Quick Add form
**File: `src/components/InventoryTrackerComponent.tsx`**
- Change the quantity input to have a clear label: **"Total Individual Items"** with helper text explaining what it means.
- Add a computed display showing: "= X cases of Y" so users see the relationship (e.g., entering 240 with Case of 24 shows "= 10 Cases").
- Update the summary line to be more explicit.

#### 3. Clarify quantity labels in Bulk Add dialog
**File: `src/components/inventory/BulkAddInventoryDialog.tsx`**
- Rename the "Qty" column header to **"Total Items"**.
- Add a computed "packages" display per row (e.g., "10 Cases") next to the quantity, so users know how many packages that total equates to.
- Update the header row to reflect the clearer naming.

#### 4. Add warehouse/zone selector to Quick Add form
**File: `src/components/InventoryTrackerComponent.tsx`**
- Below the packaging row, add optional warehouse and zone dropdowns so users can assign storage location at creation time (instead of only via the edit dialog).

### Technical Details
- No database changes needed — all tables and columns already exist.
- `WarehouseManager` component is already built; we just import it into the Inventory page.
- The quantity clarification is purely UI labeling — the underlying data model (`quantity` = total individual items) stays the same.

