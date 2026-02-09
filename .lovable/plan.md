

## Fix: Show Custom Calendar Tasks in Dashboard "This Week" Widget

### The Problem

The dashboard's "This Week" widget only shows system-generated tasks (restocks, routes, maintenance, follow-ups) from `useSmartScheduler`. Custom tasks created in the Management Calendar are stored in the `calendar_tasks` table but are never fetched or displayed on the dashboard.

### The Fix

Import `useCalendarTasks` in the Dashboard page, filter tasks to the current week, convert them into the `ScheduledTask` format, and merge them into `tasksByDate` before passing to `WeeklyCalendarWidget`.

---

### Technical Details

**Modified file: `src/pages/Dashboard.tsx`**

1. Import `useCalendarTasks` hook
2. Call the hook to get all custom tasks
3. Filter tasks to the current 7-day window
4. Convert each matching `CalendarTask` into a `ScheduledTask` (type: `"custom"` or mapped from `taskType`)
5. Merge them into the `tasksByDate` Map alongside the smart scheduler tasks

**Modified file: `src/hooks/useSmartScheduler.ts`**

- Extend `TaskType` to include `"custom"` so the type system allows custom tasks in the weekly view

**Modified file: `src/components/dashboard/WeeklyCalendarWidget.tsx`**

- Add a "custom" entry to `TASK_ICONS` and `TASK_COLORS` (purple styling, matching the calendar page)
- Add a "Custom" legend dot

This is a minimal, targeted fix -- no structural changes needed.

| File | Changes |
|------|---------|
| `src/hooks/useSmartScheduler.ts` | Add `"custom"` to `TaskType` union |
| `src/pages/Dashboard.tsx` | Import `useCalendarTasks`, merge custom tasks into `tasksByDate` |
| `src/components/dashboard/WeeklyCalendarWidget.tsx` | Add purple "custom" task styling and legend entry |

