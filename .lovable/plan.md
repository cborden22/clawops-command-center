

## Overhaul Dashboard Customization

### Current Problems
1. **Clunky edit overlay** -- ring outlines, floating resize handles, and dimmed content make the dashboard look broken in edit mode
2. **Drag-to-resize is unintuitive** -- dragging a corner handle horizontally to set widget width is confusing and unreliable on mobile
3. **Touch reorder is fake** -- tapping the grip handle just swaps with the previous item (no actual drag), so you can only move things up one spot at a time
4. **No size preview** -- users can't visualize what "1/3 width" vs "1/2 width" means before committing
5. **Hidden widgets tray is easy to miss** at the bottom of the page

### New Design: Drawer-Based Customizer

Replace the inline overlay system with a **settings drawer** that opens from the FAB. Clean, familiar pattern (like iOS widget editing).

**How it works:**
- FAB button opens a **Drawer** (mobile) or **Sheet** (desktop) panel
- Panel shows a **sortable list** of all widgets with toggle switches (visible/hidden) and a size selector dropdown
- Reordering via **up/down arrow buttons** (simple, reliable, works on all devices)
- Live preview: dashboard updates in real-time as you toggle/reorder/resize
- "Reset to Default" button at the bottom
- No more inline overlays, rings, resize handles, or dimmed content cluttering the dashboard

### UI Layout of the Drawer

```text
┌─────────────────────────────┐
│  Customize Dashboard    [X] │
│─────────────────────────────│
│  ☰  Primary Stats      [✓] │
│      Size: [Full width ▼]   │
│     [↑] [↓]                 │
│─────────────────────────────│
│  ☰  Weekly Calendar    [✓]  │
│      Size: [Full width ▼]   │
│     [↑] [↓]                 │
│─────────────────────────────│
│  ☰  Business Health    [✓]  │
│      Size: [Half ▼]         │
│     [↑] [↓]                 │
│─────────────────────────────│
│  ...                        │
│                             │
│  [Reset to Default]         │
└─────────────────────────────┘
```

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/DashboardCustomizer.tsx` | **Rewrite entirely.** Remove `WidgetEditOverlay`, resize logic, drag handlers. Replace with a `DashboardCustomizerDrawer` component containing a sortable widget list with toggles, size selects, and move buttons. Keep `EditModeFAB` but change it to open the drawer instead of toggling edit mode. |
| `src/pages/Dashboard.tsx` | **Simplify significantly.** Remove all drag/drop state (`draggedId`, `dragOverId`, `touchDragId`), drag handler functions, and the `WidgetEditOverlay` wrapper around each widget. Widgets render directly in the grid. The customizer drawer handles all configuration. Remove `isEditMode` -- replace with `isCustomizerOpen` boolean. |

### What Gets Removed
- All inline edit overlays (rings, dimmed content, floating handles)
- Drag-to-resize logic (mouse/touch event listeners, percentage calculations)
- Desktop HTML5 drag-and-drop for reordering
- Touch "swap with previous" hack
- `WidgetEditOverlay` component entirely
- ~150 lines of drag/resize state management from Dashboard.tsx

### What Gets Added
- `DashboardCustomizerDrawer` -- a Drawer (uses existing `vaul` drawer component) with:
  - List of widgets with Switch toggles for visibility
  - Select dropdown for size (Small / Half / Large / Full)
  - Up/Down buttons for reordering
  - Reset button
- Clean, predictable UX that works identically on mobile and desktop
- ~120 lines total for the new drawer component

### Technical Notes
- Uses existing `Drawer` component from `src/components/ui/drawer.tsx`
- Uses existing `Switch`, `Select` components
- Layout state management stays the same (localStorage persistence, same `WidgetConfig` type)
- Grid rendering stays the same (`grid-cols-12` with `SIZE_TO_COLS` mapping)
- No new dependencies needed

