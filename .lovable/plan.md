## Phase 1 Inventory Management Overhaul

This is a significant rebuild of the inventory module. The existing `inventory_items` table stores a single quantity per item. The new system introduces **inventory balances** so one item can exist at multiple locations with separate quantities.

### Key Design Decision

The existing `locations` table is used throughout the app for claw machine business locations (revenue, collections, leads, etc.). Rather than conflicting with that, we create a **separate `inventory_locations**` table that represents storage/assignment locations for inventory purposes. This keeps the existing app intact while building the new inventory module cleanly.

### Database Changes (3 migrations)

**Migration 1: `inventory_locations` table**

- `id`, `user_id`, `location_name` (required), `location_type` (enum: warehouse, business_location), `code`, `address`, `notes`, `active` (default true), `created_at`, `updated_at`
- RLS: owner + team `inventory` permission
- Unique constraint on `(user_id, code)` where code is not null

**Migration 2: `inventory_balances` table**

- `id`, `user_id`, `inventory_item_id` (FK to inventory_items), `location_id` (FK to inventory_locations), `quantity_on_hand` (default 0), `reorder_point`, `notes`, `created_at`, `updated_at`
- Unique constraint on `(inventory_item_id, location_id)` to prevent duplicates
- RLS: owner + team `inventory` permission

**Migration 3: Alter `inventory_items**`

- Add columns: `sku` (text), `subcategory` (text), `description` (text), `active` (boolean, default true)
- Existing columns map: `name` = item_name, `category` stays, `price_per_item` = unit_cost, `min_stock` = low_stock_threshold

### New Hooks


| Hook                    | Purpose                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `useInventoryLocations` | CRUD for `inventory_locations` table                                       |
| `useInventoryBalances`  | CRUD for `inventory_balances`, compute totals per item                     |
| Update `useInventoryDB` | Add `sku`, `subcategory`, `description`, `active` to interface and queries |


### Frontend: New Pages & Components

**1. Inventory Dashboard (replaces current inventory tab)**

- Summary cards: Total Items, Total Units, Active Locations, Total Est. Value
- Table: Item Name, SKU, Category, Total Qty (sum of balances), # Locations, Unit Cost, Low Stock status
- Filters: search, category, active/inactive
- Click row opens item detail

**2. Item Detail Page (dialog or inline expand)**

- Item info header (name, SKU, category, subcategory, description, unit cost, threshold, active)
- "Quantities by Location" table: Location Name, Type, Qty On Hand, Reorder Point, Notes, Edit button
- Button to assign item to new location
- Button to edit item details

**3. Add/Edit Item Form (dialog)**

- Fields: name, SKU, category (Plush/Parts/Machines/Bulk), subcategory, unit cost, description, low stock threshold, active toggle

**4. Locations tab (replaces Warehouses tab)**

- Table: Location Name, Code, Type, Address, Active, # Items
- Search + type filter
- Click row opens location detail

**5. Location Detail (dialog)**

- Location info header
- Table of assigned inventory: Item Name, Category, SKU, Qty, Unit Cost, Total Value
- Summary: Total Units, Total Est. Value

**6. Balance Management**

- From item detail: "Add to Location" button, set qty, reorder point
- Inline edit qty on hand from both item detail and location detail views

### Navigation Update

- Keep existing `/inventory` route
- Replace tab structure: **Dashboard** | **Locations** (replaces "Where Is It?" + "Warehouses")
- Item detail and location detail open as dialogs from their respective tabs

### Files to Create

- `src/hooks/useInventoryLocations.ts`
- `src/hooks/useInventoryBalances.ts`
- `src/components/inventory/InventoryDashboard.tsx`
- `src/components/inventory/InventoryItemDetail.tsx`
- `src/components/inventory/InventoryItemForm.tsx`
- `src/components/inventory/InventoryLocationsList.tsx`
- `src/components/inventory/InventoryLocationDetail.tsx`
- `src/components/inventory/InventoryLocationForm.tsx`
- `src/components/inventory/BalanceEditor.tsx`

### Files to Modify

- `src/hooks/useInventoryDB.ts` - Add new fields to interface/queries
- `src/pages/InventoryTracker.tsx` - New tab layout (Dashboard | Locations)
- `src/integrations/supabase/types.ts` - Auto-updated after migrations

### What Stays Unchanged

- Existing stock run functionality continues to work with the legacy `quantity` field on `inventory_items` (backward compatible)
- All other app modules (revenue, locations, mileage, etc.) untouched
- The existing `warehouses` and `warehouse_zones` tables remain for the legacy storage zone feature

### Implementation Order

1. Run 3 database migrations
2. Build hooks (locations, balances, update inventory)
3. Build UI components (dashboard, forms, detail views)
4. Update page layout with new tabs