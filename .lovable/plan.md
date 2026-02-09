

## Add Page Navigation to All Lists

Right now, when you pick "Show 20", it just shows the first 20 items and hides the rest. This update adds proper "Page 1, Page 2, Page 3..." controls so you can navigate through all your data.

---

### What Changes

**Current behavior**: Select "Show 20" --> see first 20 items, no way to see items 21-40.

**New behavior**: Select "Show 20" --> see first 20 items + page controls at the bottom (Previous, 1, 2, 3, Next) to flip through all items.

When "All" is selected, no pagination controls appear (everything shows at once, same as today).

---

### Affected Pages

| Page | List |
|------|------|
| Locations | Locations table |
| Machines | Machines table |
| Revenue | Entry history table |
| Inventory | Inventory items list |

---

### Technical Details

**Upgrade `src/components/shared/ListSizeSelector.tsx`**:
- Add a `usePaginatedList` hook that combines `useListSize` with page state
- Returns: `{ pageSize, setPageSize, currentPage, setCurrentPage, totalPages, paginatedItems }`
- Resets to page 1 whenever page size changes or filtered data changes
- Replace `applyListLimit` usage with the new hook's `paginatedItems`

**Create `src/components/shared/PaginationControls.tsx`**:
- A reusable component that renders Previous/Next buttons and page number buttons
- Uses the existing `src/components/ui/pagination.tsx` primitives
- Shows ellipsis for large page counts (e.g., 1, 2, ... 8, 9, 10)
- Hidden when only 1 page exists or when "All" is selected
- Shows "Showing X-Y of Z" text

**Modify each consumer component** (Locations, Machines, Revenue, Inventory):
- Replace `useListSize` + `applyListLimit` with `usePaginatedList`
- Add `PaginationControls` below each table/list
- Reset page to 1 when search/filter changes

### Files

| File | Action |
|------|--------|
| `src/components/shared/ListSizeSelector.tsx` | Add `usePaginatedList` hook |
| `src/components/shared/PaginationControls.tsx` | Create -- reusable page nav using existing UI primitives |
| `src/components/LocationTrackerComponent.tsx` | Add pagination below locations table |
| `src/components/MachinesManager.tsx` | Add pagination below machines table |
| `src/components/RevenueTrackerComponent.tsx` | Add pagination below entry history table |
| `src/components/InventoryTrackerComponent.tsx` | Add pagination below inventory list |
