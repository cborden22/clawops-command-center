

## Fix Stat Cards & Figures — Fluid Responsive Scaling

### Problem
Stat cards and metric figures across the app are bunched up at medium viewport sizes (~990px with sidebar). Text gets truncated ("Total Inco...", "Avg Collection...") because 4 columns are forced into too-narrow space. On mobile, the Revenue page wastes vertical space by stacking cards 1 per row when 2 would fit.

### Solution
Apply a consistent responsive grid pattern across all stat card grids so they scale fluidly:
- **Mobile**: 2 columns (compact but readable)
- **Medium (md)**: 2 columns (avoids cramming with sidebar)
- **Large (lg)**: 4 columns (full desktop width)

Also reduce font sizes on stat values so they don't overflow at smaller widths, and use `min-w-0` + `truncate` on labels to prevent overflow.

### Files to Change

| File | Change |
|---|---|
| `src/components/RevenueTrackerComponent.tsx` | Change `grid-cols-1 md:grid-cols-4` to `grid-cols-2 lg:grid-cols-4`; shrink icon size on mobile; add `min-w-0` to text containers; reduce `text-2xl` to `text-xl sm:text-2xl` |
| `src/components/reports/FinancialReports.tsx` | Change `grid-cols-2 md:grid-cols-4` to `grid-cols-2 lg:grid-cols-4` |
| `src/components/reports/LocationReports.tsx` | Same grid fix |
| `src/components/reports/RoutesReports.tsx` | Same grid fix |
| `src/components/reports/MachineReports.tsx` | Same grid fix |
| `src/components/reports/WinRateReports.tsx` | Same grid fix |
| `src/components/reports/InventoryReports.tsx` | Same grid fix |
| `src/components/reports/ReportCard.tsx` | Make metric text responsive (`text-xl sm:text-2xl`); add `min-w-0` and `truncate` to prevent overflow |
| `src/pages/Leads.tsx` | Change `grid-cols-2 md:grid-cols-4` to `grid-cols-2 lg:grid-cols-4`; responsive font sizes |
| `src/components/MachinesManager.tsx` | Fix grid breakpoints similarly |
| `src/components/LocationTrackerComponent.tsx` | Verify 3-col grid works; add responsive text sizing |

### Pattern Applied Everywhere
```
// Before (breaks at md with sidebar)
grid grid-cols-2 md:grid-cols-4

// After (scales properly)
grid grid-cols-2 lg:grid-cols-4

// Stat values become responsive
text-xl sm:text-2xl font-bold
```

This is a targeted find-and-fix across ~11 files, all applying the same pattern. No structural changes.

