

## Fix Tablet Cutoff on Leads Pipeline

### Problem
At tablet viewport (768px), the desktop layout renders with a sidebar, leaving ~700px for content. The pipeline's 5 kanban columns are each `md:w-[260px]` (total 1300px), and while the pipeline has `overflow-x-auto`, the parent page container doesn't constrain its width, so the overflow bleeds out and cuts off stat cards and other content on the right edge.

### Root Cause
The Leads page wrapper (`space-y-6`) has no overflow constraint. The pipeline's flex container expands the page width beyond the viewport, making stat cards and badges clip on the right.

### Solution

| File | Change |
|---|---|
| `src/pages/Leads.tsx` | Add `overflow-hidden` to the outermost wrapper div so the pipeline scrolls within its bounds instead of expanding the page |
| `src/components/leads/LeadsPipeline.tsx` | Add `min-w-0` to the pipeline's parent flex container and ensure the desktop view wrapper has proper containment. Also consider making columns narrower at `md` breakpoint (`md:w-[220px]`) so more columns are visible on tablet |

### Technical Detail
```text
// Page wrapper gets overflow containment
<div className="space-y-6 overflow-hidden">

// Pipeline container gets min-w-0 for flex containment  
<div className="flex gap-4 overflow-x-auto pb-4 min-w-0 ...">

// Columns slightly narrower at md to show more on tablet
'flex-shrink-0 w-[280px] md:w-[220px] lg:flex-1 lg:min-w-[200px] ...'
```

Two files, minimal changes. The stat cards and pipeline will stay within bounds at every viewport width.

