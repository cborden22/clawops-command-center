

## Add Visual Widget Highlighting to Dashboard Customizer

### Problem
When the customizer drawer is open and the user hovers/focuses a widget row, there's no indication of which widget on the dashboard it corresponds to. Users can't tell "which line is which" on the actual grid.

### Solution
Add a **highlight state** that connects the customizer rows to the dashboard widgets. When the user taps or hovers a row in the customizer, the corresponding widget on the dashboard gets a visible highlight ring/pulse, and a small floating label appears on it.

**How it works:**
- Add `highlightedWidgetId` state to Dashboard, passed into both the grid rendering and the customizer drawer
- Each `WidgetRow` in the customizer fires `onHighlight(id)` on pointer enter / touch start, and `onHighlight(null)` on pointer leave
- Each widget wrapper in the grid checks if it's the highlighted one -- if so, it gets a `ring-2 ring-primary` outline and a small absolute-positioned badge showing its position number (e.g., "1", "2", "3")
- When the customizer is open, each widget row also shows a row number badge (e.g., "#1", "#2") so the user can visually map drawer rows to dashboard positions
- When customizer closes, highlight clears automatically

### Visual Result
```text
Customizer Drawer:           Dashboard Grid:
┌──────────────────────┐     ┌─────────────────────────┐
│ #1 Primary Stats [✓] │ --> │ ╔═══════════════════════╗│ <-- ring highlight
│ #2 Weekly Cal    [✓] │     │ ║ 1  Primary Stats      ║│ <-- position badge
│ #3 Business H    [✓]◄│     │ ╚═══════════════════════╝│
└──────────────────────┘     └─────────────────────────┘
```

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/DashboardCustomizer.tsx` | Add `highlightedWidgetId` and `onHighlight` props. Show row number badges (#1, #2...) next to each widget label. Fire `onHighlight` on pointer enter/leave for each `WidgetRow`. |
| `src/pages/Dashboard.tsx` | Add `highlightedWidgetId` state. Pass it + setter to the customizer. In the grid, when a widget is highlighted and customizer is open, apply `ring-2 ring-primary rounded-lg` and render a small position number badge overlay. Clear highlight when customizer closes. |

### Technical Detail
- Row numbers are computed from visible widget index (skip hidden ones)
- Highlight uses `ring-2 ring-primary` with a subtle scale transform for emphasis
- Position badge is a small absolute-positioned circle in the top-left corner of the widget
- On mobile (drawer), touch-based: tapping a row highlights it (toggle behavior since no hover)
- No new dependencies

