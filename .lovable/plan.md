

## Simplify ClawOps: Complete UX Overhaul

### Phase 1: Navigation Consolidation

**Sidebar & Mobile Nav cleanup** — reduce from 14 nav items to ~8:

| Current Item | Action |
|---|---|
| Location Map | Merge into Locations page as a tab |
| AR Preview | Remove from main nav; add contextual button on Leads page |
| Commission Summary | Move into Locations page as a "Commissions" tab |
| Agreement Generator | Move into Locations page as an "Agreements" tab |

**Files**: `AppSidebar.tsx`, `MobileBottomNav.tsx`, `App.tsx` (remove 4 routes), delete `Documents.tsx` and `CommissionSummary.tsx` standalone pages

### Phase 2: Locations Page — 5-Tab Layout

Tabs: **Locations** | **Machines** | **Map** | **Commissions** | **Agreements**

- Embed `LocationMap` component directly as a tab (remove lazy-load route)
- Import existing `CommissionSummaryGenerator` component
- Extract agreement form from `Documents.tsx` into new `AgreementGenerator.tsx` component
- Horizontal scroll on mobile for tab overflow

**Files**: `Locations.tsx`, new `src/components/AgreementGenerator.tsx`

### Phase 3: Quick-Add Form Simplification

**Revenue form** — progressive disclosure:
- Default: Location + Amount + Submit only
- "Add Details" expander reveals machine breakdown, receipt upload, bag labels, accrual options
- Auto-select location from active route stop if running
- Move recurring revenue setup out of quick-add

**Mileage form** — streamlined:
- Default: Vehicle + Starting Odometer (pre-filled) + Start Trip
- "Add Details" expander for purpose, notes
- Remove location From/To selectors (handled in Route Runs)
- Active trip card takes priority when trip is running

**Files**: `QuickRevenueForm.tsx`, `QuickMileageForm.tsx`

### Phase 4: Page Density Reduction

**Revenue page**: Default to simple transaction list; charts/comparisons behind "Analytics" tab; collapse filters to date range only with "Advanced Filters" expander

**Inventory page**: Compact list view default (name, qty, category badge); stock run history and bulk-add into secondary tab/action menu

**Locations page**: Compact card view — name, machine count, last collection date; detailed stats stay in location detail dialog

**Files**: `RevenueTrackerComponent.tsx`, `InventoryTrackerComponent.tsx`

### Phase 5: Mobile "More" Menu Cleanup

- With fewer items, reorganize into clean 2x2 grid sections
- Group Settings + Report Issue into an "Account" row at bottom

**Files**: `MobileBottomNav.tsx`

---

### Implementation Order
1. Navigation consolidation + Locations tab merge (biggest impact)
2. Quick-add form simplification (daily workflow)
3. Page density reduction (polish)

### All Files Changed

| File | Change |
|---|---|
| `src/pages/Locations.tsx` | Add Map, Commissions, Agreements tabs |
| `src/components/AgreementGenerator.tsx` | **New** — extracted from Documents page |
| `src/pages/Documents.tsx` | **Delete** |
| `src/pages/CommissionSummary.tsx` | **Delete** |
| `src/App.tsx` | Remove `/documents`, `/commission-summary` routes; remove standalone `/map` route |
| `src/components/layout/AppSidebar.tsx` | Remove 4 nav items from sidebar groups |
| `src/components/layout/MobileBottomNav.tsx` | Remove items + reorganize More menu grid |
| `src/components/mobile/QuickRevenueForm.tsx` | Progressive disclosure refactor |
| `src/components/mobile/QuickMileageForm.tsx` | Streamline to Start Trip default |
| `src/components/RevenueTrackerComponent.tsx` | Add Analytics tab, collapse filters |
| `src/components/InventoryTrackerComponent.tsx` | Compact list default, secondary tabs |

