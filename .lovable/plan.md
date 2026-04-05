

## Inventory Overhaul: Warehouses and Storage Locations

### Concept

Introduce **Warehouses** as first-class database entities that replace the current localStorage-only warehouse address. Each warehouse can have **Storage Zones** (totes, shelves, bins) and inventory items get assigned to a specific warehouse + optional zone. This lets you answer "where is item X stored?" and "what's in Tote #3?"

```text
Warehouse (e.g. "Main Storage")
├── Zone: Tote A (Red)
│   ├── Plush Bears (qty: 50)
│   └── Bouncy Balls (qty: 200)
├── Zone: Shelf B-2
│   └── Capsule Toys (qty: 120)
└── Unassigned
    └── New Prizes (qty: 30)
```

### Database Changes (3 migrations)

**1. `warehouses` table**
- `id`, `user_id`, `name`, `address`, `city`, `state`, `zip`, `is_default` (boolean), `notes`, `created_at`
- RLS: owner + team permission (reuse `inventory` permission)
- The existing `warehouseAddress` from AppSettings gets migrated into a default warehouse record on first load

**2. `warehouse_zones` table**
- `id`, `warehouse_id`, `name` (e.g. "Tote A", "Shelf 3"), `zone_type` (enum: tote, shelf, bin, section, other), `notes`, `created_at`
- RLS: via parent warehouse ownership

**3. Update `inventory_items`**
- Add `warehouse_id` (uuid, nullable FK to warehouses)
- Add `zone_id` (uuid, nullable FK to warehouse_zones)
- Keep existing `location` text field for backward compatibility (deprecate over time)

### Frontend Changes

| Area | Change |
|---|---|
| **Settings page** | New "Warehouses" management section replacing the single warehouse address fields. CRUD for warehouses with a "Set as Default" toggle. Each warehouse expands to show/manage its zones. |
| **Inventory Tracker** | Add warehouse and zone selectors when adding/editing items. New filter/group-by-warehouse in the item list. |
| **Inventory Item Card** | Show warehouse name + zone badge (e.g. "Main Storage > Tote A") |
| **"Where is it?" view** | New tab or section on inventory page that groups items by warehouse > zone, answering "what's in each tote?" |
| **Mileage / Route system** | Replace localStorage warehouse address references with the default warehouse record from DB. The `LocationSelector` "Warehouse" option pulls from the default warehouse. |
| **Bulk Add dialog** | Add optional warehouse + zone selector |
| **Stock Run mode** | Show zone info on items so you know which tote to pull from |

### Hooks

| Hook | Purpose |
|---|---|
| `useWarehousesDB` | CRUD for warehouses and their zones. Fetches default warehouse for use across the app. |
| Updated `useInventoryDB` | Accept `warehouseId` and `zoneId` on add/update. Include them in queries. |

### Migration of Existing Data

On first load of the new warehouses hook, if zero warehouses exist and AppSettings has a `warehouseAddress`, auto-create a default warehouse from those settings. This ensures backward compatibility with mileage routes that reference "Warehouse."

### What This Does NOT Change

- No changes to revenue, collections, or machine tracking
- The `location` text field on inventory items stays (not removed) but the UI nudges toward warehouse + zone instead
- Route runs and mileage continue to work -- they just pull the default warehouse address from DB instead of localStorage

### Implementation Order

1. Database migrations (warehouses, zones, inventory_items columns)
2. `useWarehousesDB` hook
3. Settings page warehouse management UI
4. Update inventory add/edit forms with warehouse + zone pickers
5. Inventory list grouping and "Where is it?" view
6. Migrate mileage/route warehouse references to use DB default
7. Update reports to include warehouse data

