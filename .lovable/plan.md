

## Add Category System to Inventory (Standard + Custom)

### What Changes

Add a category system with preset standard categories plus the ability to create custom ones. Categories will be selectable when adding/editing items and usable for filtering and sorting.

### Standard Categories
Plush, Candy, Electronics, Figurines, Keychains, Balls, Capsules, Parts, Supplies, General

### Implementation

**1. Add a `custom_categories` table (database migration)**
- Stores user-created category labels: `id`, `user_id`, `name`, `created_at`
- RLS: users can only CRUD their own categories

**2. New hook: `src/hooks/useCustomCategories.ts`**
- Fetches user's custom categories from DB
- Provides `addCategory` and `deleteCategory` functions
- Merges standard categories with custom ones into a single list

**3. Update `src/components/InventoryTrackerComponent.tsx`**
- Add `newItemCategory` state for the quick-add form
- Add a category `Select` dropdown in the quick-add card (between item name and packaging rows)
- Options: standard categories + custom ones + "Add Custom..." option at the bottom
- When "Add Custom..." is selected, show an inline input to type and save a new category
- Add `sortBy` and `filterCategory` state
- Add sort and category filter `Select` dropdowns in the search/filter bar
- Update `filteredItems` to filter by category and sort by selected option
- In the edit dialog: add category `Select` so users can recategorize existing items
- Pass category to `addItem()` instead of hardcoded "General"

**4. Update `src/components/inventory/BulkAddInventoryDialog.tsx`**
- Add a category column to bulk-add rows

**5. Update `src/components/mobile/QuickInventoryForm.tsx`**
- Add category `Select` to the "New Item" form

### Sort Options
- Name A→Z, Name Z→A
- Quantity Low→High, Quantity High→Low
- Low Stock First
- Category A→Z

### Files Changed

| File | Change |
|---|---|
| Migration | Create `custom_categories` table with RLS |
| `src/hooks/useCustomCategories.ts` | New hook for category CRUD + merged list |
| `src/components/InventoryTrackerComponent.tsx` | Category picker in quick-add, sort/filter dropdowns, category in edit dialog, filtering/sorting logic |
| `src/components/inventory/BulkAddInventoryDialog.tsx` | Add category column to bulk rows |
| `src/components/mobile/QuickInventoryForm.tsx` | Add category picker to new item form |

