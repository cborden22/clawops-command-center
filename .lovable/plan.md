

## Calendar Overhaul: Full Task Management

### Problems

1. **No delete** -- Once a task is added, there's no way to remove it
2. **No edit** -- Can't change the title, description, date, or type of an existing task
3. **No move/reschedule** -- Can't drag or reassign a task to a different date
4. **Side panel is passive** -- The selected-day detail panel only shows tasks with a checkmark; no contextual actions
5. **Agenda view has no actions** -- Same issue: checkmark only, no edit/delete

---

### What Changes

#### 1. New "Edit Task" Dialog

A reusable `EditTaskDialog` component (similar to `AddTaskDialog`) that:

- Pre-fills title, description, date, and type from the existing task
- Has "Save Changes" and "Delete Task" buttons
- Delete shows a confirmation before removing
- On save, calls `updateTask()` from the hook
- On delete, calls `deleteTask()` from the hook

#### 2. Task Action Menu on Every Custom Task

In both the **selected-day side panel** and **agenda view**, each custom task gets a small actions area:

- **Edit** (pencil icon) -- opens the EditTaskDialog
- **Delete** (trash icon) -- confirms then deletes
- **Toggle complete** (checkmark) -- existing behavior, kept

System-generated tasks (restocks, routes, maintenance, follow-ups) remain read-only since they're driven by schedules, not manual entries.

#### 3. Quick Reschedule

In the EditTaskDialog, changing the date effectively "moves" the task. This is simpler and more reliable than drag-and-drop for a calendar that mixes read-only system tasks with editable custom tasks.

#### 4. Click-to-Add on Empty Days

When clicking an empty day in the month/week grid, automatically open the Add Task dialog with that date pre-selected (currently it shows a static "Add Task" button in the side panel).

#### 5. Agenda View Gets Full Actions

The `AgendaView` component will receive `onEditTask` and `onDeleteTask` callbacks so custom tasks in agenda mode also have edit and delete.

---

### User Flow

```text
Calendar Page
  |
  +-- Click a day cell
  |     |
  |     +-- If day has no tasks: AddTaskDialog opens with that date pre-filled
  |     +-- If day has tasks: Side panel shows task list
  |           |
  |           +-- Each custom task shows:
  |                 [checkmark] [edit pencil] [trash]
  |                 |
  |                 +-- Edit: Opens EditTaskDialog (change title/date/type/notes)
  |                 +-- Delete: Confirm dialog -> removes task
  |                 +-- Checkmark: Toggles completed (existing)
  |
  +-- Agenda View
        |
        +-- Each custom task shows same [checkmark] [edit] [delete] controls
```

---

### Technical Details

**New file: `src/components/calendar/EditTaskDialog.tsx`**

- Controlled dialog (open/onOpenChange props) receiving a `CalendarTask` object
- Form fields: title (input), date (date picker), type (select), description (textarea)
- "Save" button calls `updateTask(task.id, { title, taskDate, taskType, description })`
- "Delete" button with `AlertDialog` confirmation calls `deleteTask(task.id)`
- Closes on success

**Modified file: `src/pages/Calendar.tsx`**

- Import `EditTaskDialog` and track `editingTask` state
- In the selected-day side panel (lines 497-543), add edit and delete icon buttons next to each custom task
- Wire edit button to open `EditTaskDialog` with the task data
- Wire delete button to call `deleteTask` with confirmation
- On day cell click: if the day has no tasks, open AddTaskDialog with that date (currently just selects the day)
- Add state: `const [editingTask, setEditingTask] = useState<CalendarTask | null>(null)`
- Render `<EditTaskDialog task={editingTask} ... />` at root level

**Modified file: `src/components/calendar/AgendaView.tsx`**

- Add `onEditTask` and `onDeleteTask` props
- For custom task items, render edit (pencil) and delete (trash) icon buttons alongside the existing checkmark
- Wire to parent callbacks

**No database changes needed** -- the `calendar_tasks` table already supports all CRUD operations, and the `useCalendarTasks` hook already has `updateTask` and `deleteTask` functions that are just not being used in the UI.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/calendar/EditTaskDialog.tsx` | **Create** -- edit/delete dialog for custom tasks |
| `src/pages/Calendar.tsx` | **Modify** -- add edit/delete actions to side panel, wire up EditTaskDialog, improve empty-day click behavior |
| `src/components/calendar/AgendaView.tsx` | **Modify** -- add edit/delete action buttons for custom tasks |

