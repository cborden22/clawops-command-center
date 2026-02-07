

## Integrate Calendar Components - Complete the Overhaul

The calendar components were created but never connected to the main Calendar page. This plan integrates all the new functionality to make task creation, filtering, and the agenda view available.

---

### Problem

The following components exist but are not used in `Calendar.tsx`:
- `AddTaskDialog` - Allows creating custom tasks
- `CalendarFilters` - Toggle buttons for filtering by task type
- `AgendaView` - List-based view of upcoming tasks
- `useCalendarTasks` - Hook for managing custom calendar tasks

The Calendar page currently only shows auto-generated tasks (restocks, routes, maintenance, follow-ups) with no way to add custom events.

---

### Solution

Update `Calendar.tsx` to:
1. Import and use all created calendar components
2. Add the "Add Task" button in the header
3. Add filter toggles below the header
4. Add "Agenda" as a third view mode alongside Month/Week
5. Load and display custom tasks from the database
6. Include a "custom" task type in the task configuration
7. Allow marking custom tasks as complete

---

### Changes to Calendar.tsx

**New Imports**
```typescript
import { AddTaskDialog } from "@/components/calendar/AddTaskDialog";
import { CalendarFilters, TaskTypeFilter } from "@/components/calendar/CalendarFilters";
import { AgendaView } from "@/components/calendar/AgendaView";
import { useCalendarTasks, CalendarTask } from "@/hooks/useCalendarTasks";
import { CheckSquare } from "lucide-react";
```

**New State**
```typescript
const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");
const [activeFilters, setActiveFilters] = useState<TaskTypeFilter[]>([
  "restock", "route", "maintenance", "followup", "custom"
]);
```

**New Hook Usage**
```typescript
const { tasks: customTasks, toggleCompleted } = useCalendarTasks();
```

**Add "custom" to taskTypeConfig**
```typescript
custom: { icon: CheckSquare, color: "bg-purple-500/20 text-purple-600 border-purple-500/30", label: "Task" },
```

**Updated Header Layout**
```text
+----------------------------------------------------------+
| Calendar                                                  |
| View and manage your scheduled tasks                      |
|                                                           |
| [Today] [Month][Week][Agenda]              [+ Add Task]   |
+----------------------------------------------------------+
| Filters: [Restocks] [Routes] [Maintenance] [Follow-ups] [Tasks] |
+----------------------------------------------------------+
```

**Merge Custom Tasks into Calendar**
- Convert custom tasks to the same format as scheduled tasks
- Apply filters to show/hide task types
- In Agenda view, use the AgendaView component directly
- In Month/Week views, combine filtered tasks with custom tasks

**Filter Logic**
```typescript
const filteredTasks = useMemo(() => {
  return allTasks.filter(task => activeFilters.includes(task.type));
}, [allTasks, activeFilters]);
```

---

### Updated View Modes

| Mode | Description |
|------|-------------|
| Month | Grid calendar showing task dots, click day for details |
| Week | 7-column detailed view with scrollable task lists per day |
| Agenda | Scrollable list grouped by date (Today, Tomorrow, etc.) |

---

### File to Modify

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Full integration of new components |

---

### UI Flow After Changes

1. User sees Calendar with Month view by default
2. Filter toggles let them show/hide specific task types
3. "Add Task" button opens dialog to create custom events
4. Switching to Agenda view shows a clean list format
5. Custom tasks appear with purple styling and can be marked complete
6. Clicking a day shows both scheduled and custom tasks in the detail panel

---

### Technical Implementation Details

**Combining Tasks**

Custom tasks need to be converted to match the ScheduledTask interface:

```typescript
const allTasks = useMemo(() => {
  const combined: ScheduledTask[] = [...monthlyTasks];
  
  customTasks.forEach((ct) => {
    const taskDate = new Date(ct.taskDate + "T00:00:00");
    if (taskDate >= monthStart && taskDate <= monthEnd) {
      combined.push({
        id: ct.id,
        type: "custom" as TaskType,
        title: ct.title,
        subtitle: ct.description || undefined,
        dueDate: taskDate,
        status: ct.completed ? "completed" : "upcoming",
        priority: "medium",
        link: "/calendar",
        metadata: { isCustom: true, completed: ct.completed },
      });
    }
  });
  
  return combined;
}, [monthlyTasks, customTasks, currentDate]);
```

**Filter Toggle Handler**

```typescript
const handleToggleFilter = (filter: TaskTypeFilter) => {
  setActiveFilters(prev => 
    prev.includes(filter) 
      ? prev.filter(f => f !== filter)
      : [...prev, filter]
  );
};
```

**Agenda View Integration**

When viewMode is "agenda", render the AgendaView component instead of the calendar grid:

```typescript
{viewMode === "agenda" ? (
  <AgendaView
    scheduledTasks={filteredMonthlyTasks}
    customTasks={customTasks.filter(t => activeFilters.includes("custom"))}
    onToggleCustomTask={toggleCompleted}
  />
) : (
  // Existing month/week grid code
)}
```

---

### Expected Outcome

| Feature | Status |
|---------|--------|
| Add Task button visible in header | Will work |
| Filter toggles functional | Will work |
| Agenda view available | Will work |
| Custom tasks appear on calendar | Will work |
| Custom tasks can be marked complete | Will work |
| Task type filtering works | Will work |

