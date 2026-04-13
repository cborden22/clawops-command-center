

## Fix Stacked Filters on Mobile

### Problem
On mobile, filter dropdowns (Priority, Source) and similar controls stack vertically one per row, wasting space when they could easily sit side-by-side. This affects the Leads page (visible in screenshot) and similar filter layouts elsewhere.

### Solution
Wrap the select dropdowns in a flex row so they sit next to each other on mobile, while the search bar stays full-width above. Apply the same pattern to any other pages with similar stacked filter controls.

### Files to Change

| File | Change |
|---|---|
| `src/components/leads/LeadFilters.tsx` | Keep search full-width; wrap Priority + Source selects in a `flex flex-row gap-2` container so they sit side-by-side on mobile; make selects `flex-1` instead of fixed widths; add Clear button inline |
| `src/pages/Leads.tsx` | Ensure the filters + view toggle row uses `flex-row flex-wrap` so filter bar and view toggle don't stack unnecessarily |
| `src/pages/Maintenance.tsx` | Check header layout for similar stacking; fix if needed |
| `src/pages/Calendar.tsx` | Same check and fix |

### Pattern
```
// Before: everything stacks on mobile
<div className="flex flex-col sm:flex-row gap-3">
  <Search />
  <Select /> <!-- stacks below -->
  <Select /> <!-- stacks below -->
</div>

// After: search full-width, selects side-by-side
<div className="space-y-3">
  <Search />  <!-- full width -->
  <div className="flex flex-row gap-2">
    <Select className="flex-1" />
    <Select className="flex-1" />
    {hasFilters && <ClearButton />}
  </div>
</div>
```

Small, targeted fix across 2-4 files.

