

## Add Row-Based Layout Preview to Dashboard Customizer

### Problem
The customizer currently shows a flat list of widgets with no sense of how they arrange into rows on the grid. Users can't tell that three "⅓ width" widgets share a row, or that a "½ width" widget leaves room for another "½ width" beside it.

### Solution
Add a **visual row layout preview** at the top of the customizer drawer that shows how visible widgets flow into rows based on their sizes. Each row displays miniature blocks proportional to their grid width (out of 12 columns), with widget labels inside. This gives users an immediate spatial understanding of their layout.

```text
┌─────────────────────────────────┐
│  Customize Dashboard        [X] │
│─────────────────────────────────│
│  Layout Preview                 │
│  ┌─────────────────────────────┐│
│  │ Row 1: Primary Stats (full) ││
│  ├──────────────┬──────────────┤│
│  │ Row 2: Biz   │ Row 2: Budg  ││
│  │ Health (½)   │ Track (½)    ││
│  ├────────┬─────────┬──────────┤│
│  │ All-   │ Top     │ Low      ││
│  │ Time ⅓ │ Locs ⅓  │ Stock ⅓  ││
│  └────────┴─────────┴──────────┘│
│─────────────────────────────────│
│  Widget List (existing rows)    │
│  ...                            │
└─────────────────────────────────┘
```

### How It Works
- Compute rows by iterating visible widgets, accumulating column spans (sm=4, md=6, lg=8, full=12). When a widget would exceed 12, start a new row.
- Render each row as a flex container with blocks sized proportionally (e.g., `width: ${(cols/12)*100}%`).
- Each block shows the widget label (truncated) and a row number.
- Hovering/tapping a block in the preview highlights that widget in both the list below and on the dashboard grid (reuses existing `onHighlight`).
- The highlighted block gets a primary ring, matching the dashboard highlight.

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/DashboardCustomizer.tsx` | Add a `LayoutPreview` component above the widget list. It computes rows from visible widgets using the size-to-cols mapping (sm=4, md=6, lg=8, full=12), renders proportional blocks per row, and wires into the existing `onHighlight` system. Each block shows truncated label + size badge. |

### Technical Detail
- Size mapping: `{ sm: 4, md: 6, lg: 8, full: 12 }` (matches `SIZE_TO_COLS` in Dashboard.tsx)
- Row computation: iterate visible widgets, track `currentRowCols`. If adding a widget exceeds 12, push current row and start new one.
- Block styling: `style={{ width: \`${(cols/12)*100}%\` }}` inside a `flex flex-wrap` container
- Each block is a small rounded rectangle with `bg-muted` (or `bg-primary/20` when highlighted), showing the widget label in `text-[10px]`
- Tapping a block fires `onHighlight(id)` just like the list rows
- No new files or dependencies -- just a new sub-component within `DashboardCustomizer.tsx`

