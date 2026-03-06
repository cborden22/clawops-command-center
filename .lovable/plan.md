

## Redesign: Inline Dashboard Customization (Nayax-style)

### Problem
The current customizer opens a side panel where you can't see the dashboard while making changes. You're editing blind -- toggling visibility, changing sizes, and reordering without seeing the result.

### Solution: Edit-in-Place Mode
Replace the side-panel approach with an **inline edit mode** that overlays controls directly on each widget, so you see changes live as you make them.

### How It Works

**1. Toggle Edit Mode**
- A floating action button (FAB) in the bottom-right corner (like Nayax) toggles edit mode on/off
- On desktop: circular button with a gear/pencil icon, always visible in the corner
- On mobile: same FAB position, sized for touch (56px)
- When edit mode is active, the FAB changes to a checkmark ("Done") button

**2. Widget Overlays in Edit Mode**
When edit mode is active, each widget gets:
- A **drag handle** bar at the top (grab to reorder)
- A **resize handle** in the bottom-right corner (drag to cycle through sm/md/lg/full sizes)
- A **hide button** (X icon) in the top-right corner to toggle visibility off
- A subtle colored border/outline to indicate the widget is editable
- The widget content remains fully visible underneath (slightly dimmed)

**3. Hidden Widgets Tray**
- When widgets are hidden, a collapsible "Hidden Widgets" bar appears at the bottom of the dashboard
- Shows chips/badges for each hidden widget with a "+" button to restore them
- Only visible during edit mode

**4. Resize Behavior**
- **Desktop**: Drag the bottom-right corner handle to resize. Snaps to grid columns (sm=4, md=6, lg=8, full=12). Shows a ghost outline of the new size while dragging.
- **Mobile**: Tap the resize handle to cycle through sizes (sm -> md -> lg -> full -> sm). Simpler than dragging on touch.
- Size label tooltip appears briefly when size changes (e.g., "Half width")

**5. Reorder Behavior**
- **Desktop**: Drag widgets by their top handle bar to reorder within the grid
- **Mobile**: Long-press the drag handle, then drag to reorder (with haptic feedback)

### Files to Change

- **`src/components/dashboard/DashboardCustomizer.tsx`** -- Complete rewrite: replace Sheet-based panel with an inline edit mode overlay system. New subcomponents: `WidgetEditOverlay` (per-widget controls), `HiddenWidgetsTray`, `EditModeFAB`
- **`src/pages/Dashboard.tsx`** -- Replace the "Customize" button + Sheet with the FAB. Pass `isEditMode` state to the widget grid. Wrap each widget in the edit overlay when active. Remove the old `DashboardCustomizer` Sheet usage.
- **`src/index.css`** -- Add resize handle cursor styles and edit-mode animations

### Technical Approach

```text
Normal Mode:                    Edit Mode:
+------------------+            +------------------+
|   Widget Card    |            | ≡ DRAG      [X]  |
|                  |            |   Widget Card     |
|                  |            |              ⟋   |  <-- resize handle
+------------------+            +------------------+

                                [+ Calendar] [+ Leads]  <-- hidden widgets tray

                          [✓]   <-- FAB (bottom-right)
```

- Edit mode is a boolean state in Dashboard.tsx
- Each widget gets wrapped in a `<WidgetEditOverlay>` component that renders the drag handle, hide button, and resize handle
- Reordering uses the existing drag-and-drop logic but applied inline
- Resize handle on desktop uses `onMouseDown` + `mousemove` to calculate new column span based on cursor position relative to the grid
- On mobile, resize handle is a tap-to-cycle button
- Hidden widgets tray is a simple flex row of badge buttons

