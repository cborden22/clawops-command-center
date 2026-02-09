
## Calendar Overhaul: UI Polish, Bug Fixes, and Proper Delete Warnings

### Problems Found

1. **Duplicate task bug** -- Custom tasks appear twice in Agenda view because they're passed both inside `scheduledTasks` (merged from `monthlyTasks`) AND as a separate `customTasks` prop. This causes the React "duplicate key" console warning.
2. **`confirm()` used for delete** -- The side panel and agenda view use the browser's ugly native `confirm()` dialog instead of the styled `AlertDialog` used elsewhere in the app (e.g., commission summary deletion).
3. **AddTaskDialog creates its own hook instance** -- `AddTaskDialog` internally calls `useCalendarTasks()`, creating a separate data fetch. It should receive `createTask` as a prop from the parent instead.
4. **No "Add Task" button in side panel when tasks exist** -- You can only add a task from the header button or the empty-day state; when a day already has tasks, there's no quick-add option.
5. **Calendar grid cells too small on mobile** -- 80px min-height doesn't show enough content.
6. **Legend takes up space at the bottom unnecessarily** -- The filter chips already serve as a legend.

---

### Changes

#### 1. Fix Duplicate Task Bug (AgendaView)

Stop passing `customTasks` separately to `AgendaView`. Since custom tasks are already included in `monthlyTasks` (which becomes `scheduledTasks`), the agenda view should identify custom tasks by checking for a `metadata.isCustom` flag instead of merging a second list. This eliminates the duplicate key error.

#### 2. Proper AlertDialog Delete Warnings Everywhere

Replace all `confirm()` calls and the inline trash buttons with a proper `AlertDialog` matching the commission summary delete pattern:
- AlertTriangle icon in the title
- Bold task name in the description
- Red "This action cannot be undone" text
- Styled destructive action button

This applies to:
- Side panel delete button (Calendar.tsx lines 557-568)
- Agenda view delete button (AgendaView.tsx lines 203-209)

#### 3. Refactor AddTaskDialog to Accept Props

Change `AddTaskDialog` to accept `createTask` and `onCreated` as props instead of internally instantiating `useCalendarTasks()`. This prevents duplicate hook instances and makes the calendar data refresh cleanly after adding a task.

#### 4. Add "Add Task" Button in Side Panel Header

When a day is selected and already has tasks, show a small "+" button in the side panel header so users can quickly add more tasks to that day.

#### 5. Visual Polish

- Remove the bottom legend card (filters already serve this purpose)
- Improve month grid cell sizing with better responsive breakpoints
- Add subtle hover states to task items in the side panel
- Make the "no tasks" empty state more inviting with an inline add button

#### 6. Side Panel Delete Uses AlertDialog State

Instead of inline `AlertDialog` per task (which nests poorly), manage a single `deletingTask` state at the Calendar page level, similar to how `editingTask` works. One `AlertDialog` renders at root level and opens when any delete button is clicked.

---

### User Flow After Changes

```text
Side Panel (selected day)
  |
  +-- Header shows date + small "+" add button
  +-- Task list with action icons per custom task:
  |     [checkmark] [edit] [delete]
  |     |
  |     +-- Delete: Opens styled AlertDialog with:
  |           "Delete Task?"
  |           AlertTriangle icon
  |           "Are you sure you want to delete 'Task Name'?"
  |           "This action cannot be undone."
  |           [Cancel] [Delete Task]
  |
  +-- Empty state: "No tasks scheduled" + [Add Task] button
```

---

### Technical Details

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Add `deletingTask` state; replace `confirm()` with root-level `AlertDialog`; add "+" button to side panel header; remove bottom legend card; pass `createTask` prop to `AddTaskDialog`; stop passing `customTasks` separately to `AgendaView`; pass `customTasks` reference for edit lookups only |
| `src/components/calendar/AgendaView.tsx` | Remove separate `customTasks` merging logic; identify custom tasks from the main task list using metadata; replace inline delete with `onDeleteTask` callback (parent handles confirmation); improve item layout and hover states |
| `src/components/calendar/AddTaskDialog.tsx` | Accept `createTask` and `onCreated` as props instead of using internal `useCalendarTasks()` hook; keep controlled open state |
| `src/components/calendar/EditTaskDialog.tsx` | Minor polish -- consistent styling with the app's AlertDialog pattern (AlertTriangle icon in delete confirmation title) |
