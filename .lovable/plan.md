

## Fix Tablet Leads Page: Tabbed Pipeline + Visible Stats

### Problem
At 768px (tablet with sidebar), the Kanban columns overflow and clip. The stat cards in the top row (Conversion Rate, Hot Leads) are also cut off because `overflow-hidden` hides them along with the pipeline overflow.

### Solution

**1. Use tabbed stages on tablet (not just mobile)**

In `src/components/leads/LeadsPipeline.tsx`, introduce a `useIsTablet` check (viewport < 1024px) alongside the existing `useIsMobile`. When tablet OR mobile, render the tabbed stage view instead of the Kanban columns. This completely eliminates the overflow problem.

**2. Fix stat cards visibility**

In `src/pages/Leads.tsx`, the stat cards use `grid-cols-2 lg:grid-cols-4`. At 768px they render as 2 columns which should fit, but `overflow-hidden` on the page wrapper clips them. Move `overflow-hidden` from the page wrapper to only wrap the pipeline section, so stats, header, and filters are never clipped.

### Files to Change

| File | Change |
|---|---|
| `src/components/leads/LeadsPipeline.tsx` | Add a tablet breakpoint check (`window.innerWidth < 1024`). Show tabbed view for both mobile and tablet. Keep Kanban only for `lg` and above. |
| `src/pages/Leads.tsx` | Remove `overflow-hidden` from outer wrapper. Wrap only the pipeline content section in an `overflow-hidden` container so stats/filters remain fully visible. |

### Technical Detail

```text
// LeadsPipeline.tsx
// New hook or inline check:
const isTabletOrMobile = window.innerWidth < 1024;
// Use media query listener like useIsMobile but with 1024 threshold

// Show tabbed view when isTabletOrMobile is true
// Show kanban columns only when >= 1024px (lg)

// Leads.tsx  
// Before:
<div className="space-y-6 overflow-hidden">
  {stats}
  {filters}
  {pipeline}

// After:
<div className="space-y-6">
  {stats}
  {filters}
  <div className="overflow-hidden">
    {pipeline}
  </div>
```

