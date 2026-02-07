
## Enhancement Plan: Machine Install Date, Calendar Overhaul, and Permission Audit

This plan covers three improvements:
1. **Machine Install Date** - Add an "installed_at" field to track when machines were placed at locations
2. **Calendar Overhaul** - Redesign the calendar to be more functional with task creation, filtering, and better UX
3. **Permission Enforcement Audit** - Review and fix all permission-gated UI to ensure team members see only what they're allowed to

---

### Part 1: Machine Install Date

**Problem**: There's no way to track when a machine was installed at a location. This is useful for:
- Maintenance scheduling based on machine age
- Performance analysis over time
- Contract renewal reminders
- Asset tracking

**Database Change**

Add `installed_at` column to `location_machines` table:

```sql
ALTER TABLE location_machines 
ADD COLUMN installed_at date DEFAULT CURRENT_DATE;
```

**UI Changes**

| File | Change |
|------|--------|
| `src/components/MachinesManager.tsx` | Add date picker for "Install Date" in add/edit dialog |
| `src/components/LocationDetailDialog.tsx` | Display install date in machine details |
| `src/hooks/useLocationsDB.ts` | Include `installed_at` in machine type and CRUD operations |

**Form Addition** (MachinesManager.tsx)

Add a date picker field after the Cost Per Play section:
- Label: "Install Date"
- Default: Today's date
- Optional for existing machines (nullable for backwards compatibility)

**Display** (LocationDetailDialog.tsx)

In the machine accordion, show:
- "Installed: Feb 7, 2026" or "Installed: 6 months ago"

---

### Part 2: Calendar Overhaul

**Current Issues**
- Calendar feels static and view-only
- No way to add custom tasks/events
- Week view columns are cramped on mobile
- No quick filters to focus on specific task types
- Detail panel requires clicking each day individually

**Proposed Improvements**

| Feature | Description |
|---------|-------------|
| **Quick Filters** | Toggle buttons to show/hide Restocks, Routes, Maintenance, Follow-ups |
| **Add Task Button** | Create custom calendar events with date, title, type |
| **Agenda View** | New view mode showing a scrollable list of upcoming tasks |
| **Click-to-Navigate** | Clicking a task navigates to the relevant page (Locations, Maintenance, etc.) |
| **Mobile Optimization** | Better touch targets, swipe between weeks |
| **Today Badge** | More prominent "Today" indicator |
| **Task Count Summary** | Header showing "3 tasks today, 12 this week" |

**New Component: Custom Task Dialog**

Allow owners to create ad-hoc calendar events:
- Title (required)
- Date (required)
- Type: Custom/Reminder/Meeting/Other
- Notes (optional)
- Assign to team member (optional, future enhancement)

This requires a new `calendar_tasks` table:

```sql
CREATE TABLE calendar_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_type text DEFAULT 'reminder',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar tasks"
ON calendar_tasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Files to Create**

| File | Purpose |
|------|---------|
| `src/components/calendar/CalendarFilters.tsx` | Filter toggles for task types |
| `src/components/calendar/AddTaskDialog.tsx` | Dialog to create custom tasks |
| `src/components/calendar/AgendaView.tsx` | List-based agenda view component |
| `src/hooks/useCalendarTasks.ts` | CRUD hook for custom calendar tasks |

**Files to Modify**

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Add filters, agenda view toggle, task creation, improved layout |

**New Calendar Layout**

```text
+----------------------------------------------------------+
| Management Calendar              [Today] [Month][Week][Agenda] |
+----------------------------------------------------------+
| < February 2026 >                                         |
|                                                           |
| Filters: [Restocks] [Routes] [Maintenance] [Follow-ups] [+ Add] |
|                                                           |
|  Sun    Mon    Tue    Wed    Thu    Fri    Sat           |
| +------+------+------+------+------+------+------+       |
| |      | 2    | 3    | 4    | 5    | 6    | 7    |       |
| |      | [2]  |      |      | [1]  |      | [3]  |       |
| +------+------+------+------+------+------+------+       |
|                                                           |
| Summary: 2 tasks today | 8 this week | 1 overdue          |
+----------------------------------------------------------+
```

**Agenda View** (new toggle)

```text
+----------------------------------------------------------+
| Today - Friday, February 7                                |
| +------------------------------------------------------+ |
| | [Restock] Pizza Palace - Restock due         9:00 AM | |
| | [Route] Weekly Route A - 3 stops             2:00 PM | |
| +------------------------------------------------------+ |
|                                                           |
| Tomorrow - Saturday, February 8                           |
| +------------------------------------------------------+ |
| | [Follow-up] Joe's Arcade - Hot lead         All Day  | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

---

### Part 3: Permission Enforcement Audit

**Current State**

The app uses `useMyTeamPermissions` hook which returns these flags:
- `canViewRevenue`, `canViewDocuments`, `canViewLocations`, `canViewMaintenance`
- `canManageMaintenance`, `canViewInventory`, `canViewLeads`, `canViewReports`
- `can_view_mileage` (in DB, needs UI enforcement)
- `can_assign_tasks` (in DB, for supervisors)

**Issues Found**

| Location | Issue |
|----------|-------|
| `AppSidebar.tsx` line 67 | Routes/Mileage is always visible, should check `canViewMileage` |
| `MobileBottomNav.tsx` | Routes/Mileage always visible in More menu |
| `useMyTeamPermissions.ts` | Missing `canViewMileage` and `canAssignTasks` in return object |
| `Calendar.tsx` | No permission filtering - shows all tasks regardless of permissions |
| `Dashboard.tsx` | Weekly calendar widget may show restricted task types |
| `/calendar` route | Should be owner-only or respect task-type permissions |

**Fix Plan**

1. **Update `useMyTeamPermissions.ts`**
   - Add `canViewMileage: boolean` to the interface and return object
   - Add `canAssignTasks: boolean` to the interface and return object

2. **Update Navigation Filtering**
   - `AppSidebar.tsx`: Change line 67 from `return true` to check mileage permission
   - `MobileBottomNav.tsx`: Apply same mileage permission check

3. **Update Calendar Page**
   - Filter out task types the user doesn't have permission to view
   - Hide the calendar entirely if user has no permissions for any task type
   - Or: Show only tasks for modules they can access

4. **Update Dashboard Widgets**
   - `WeeklyCalendarWidget` should filter tasks by permission
   - `RestockDueWidget` should only show if user has locations permission
   - `LeadsWidget` should only show if user has leads permission
   - `MaintenanceWidget` should only show if user has maintenance permission

**Permission Matrix Reference**

| Permission | Affects |
|------------|---------|
| `canViewLocations` | Locations page, restock tasks in calendar |
| `canViewMaintenance` | Maintenance page, maintenance tasks in calendar |
| `canViewInventory` | Inventory page |
| `canViewRevenue` | Revenue page, Collections tab in Location Detail |
| `canViewLeads` | Leads page, follow-up tasks in calendar |
| `canViewReports` | Reports page |
| `canViewDocuments` | Documents page, Agreements/Commissions tabs |
| `canViewMileage` | Routes page, route tasks in calendar |
| `canAssignTasks` | Ability to assign tasks to team members (future) |

---

### Implementation Order

**Phase 1: Permission Fixes (Critical)**
1. Update `useMyTeamPermissions.ts` to include mileage and task assignment
2. Fix navigation filtering for mileage
3. Add permission filtering to Calendar page
4. Add permission filtering to Dashboard widgets

**Phase 2: Machine Install Date**
1. Database migration to add column
2. Update hooks and types
3. Update MachinesManager form
4. Update LocationDetailDialog display

**Phase 3: Calendar Overhaul**
1. Create custom tasks table and hook
2. Build filter component
3. Build add task dialog
4. Build agenda view
5. Update Calendar page with new features
6. Mobile optimization

---

### Files Summary

**New Files to Create**
- `src/components/calendar/CalendarFilters.tsx`
- `src/components/calendar/AddTaskDialog.tsx`
- `src/components/calendar/AgendaView.tsx`
- `src/hooks/useCalendarTasks.ts`

**Files to Modify**
- `src/hooks/useMyTeamPermissions.ts` - Add mileage and task permissions
- `src/components/layout/AppSidebar.tsx` - Fix mileage permission check
- `src/components/layout/MobileBottomNav.tsx` - Fix mileage permission check
- `src/pages/Calendar.tsx` - Add filters, views, task creation, permission filtering
- `src/pages/Dashboard.tsx` - Add permission filtering to widgets
- `src/components/MachinesManager.tsx` - Add install date field
- `src/components/LocationDetailDialog.tsx` - Display install date
- `src/hooks/useLocationsDB.ts` - Handle installed_at in machine operations

**Database Migrations**
1. Add `installed_at` column to `location_machines`
2. Create `calendar_tasks` table with RLS policies

---

### Expected Outcomes

| Feature | Benefit |
|---------|---------|
| Machine install date | Better asset tracking and maintenance scheduling |
| Calendar filters | Quickly focus on specific task types |
| Custom tasks | Add reminders and events not tied to automated schedules |
| Agenda view | Easier mobile experience, quick daily overview |
| Permission enforcement | Team members only see what they're authorized to access |
| Mileage permission | Route Drivers can be restricted to only mileage access |
