

## Smart Business Assistant: Collection Reminders, Route Scheduling & Weekly Calendar

This plan adds intelligent scheduling features to help operators manage their business with automated reminders, route scheduling, and a visual weekly calendar on the dashboard.

---

## What You'll Get

### 1. Collection Reminder System (Per Location)
- **Per-location collection schedules** - Set how often each location needs to be collected (Weekly, Every 2 Weeks, Every 3 Weeks, Monthly, Custom days)
- **Smart due date tracking** - Automatically calculates when each location is due based on last collection
- **Visual status indicators** - Overdue (red), Due Today (yellow), Upcoming (green)
- **Dashboard alerts** - Shows locations needing attention at the top

### 2. Route Scheduling
- **Schedule when to run routes** - "Run Route A every Tuesday" or "Run Route B weekly on Fridays"
- **Frequency options**: Weekly, Every 2 Weeks, Every 3 Weeks, Monthly, Custom
- **Day-of-week selection** - Pick which day(s) of the week to run each route
- **Next run date display** - Shows when each route is next scheduled

### 3. Restock Schedule
- **Set a restock timeframe** - Configure how often you do supply runs
- **Frequency presets**: Weekly, Every 2 Weeks, Every 3 Weeks, Monthly, Custom
- **Next restock date** - Calculates and displays when your next restock is due
- **Dashboard reminder** - Shows upcoming restock on the calendar

### 4. Weekly Calendar Widget (Dashboard)
- **Visual 7-day view** - Shows the current week with scheduled tasks
- **Task types displayed**:
  - Collection due dates (based on location schedules)
  - Scheduled route runs
  - Restock days
  - Maintenance follow-ups (open/in-progress issues)
- **Quick navigation** - Click any task to go to the relevant page
- **Color-coded by type** - Easy visual distinction

---

## Database Changes

### New Columns on `locations` Table

| Column | Type | Purpose |
|--------|------|---------|
| `collection_frequency_days` | integer | Days between collections (7, 14, 21, 30, or custom) |
| `last_collection_date` | timestamp | When this location was last collected |

### New Columns on `mileage_routes` Table

| Column | Type | Purpose |
|--------|------|---------|
| `schedule_frequency_days` | integer | Days between runs (7, 14, 21, 30, or null) |
| `schedule_day_of_week` | integer | Day of week to run (0=Sunday, 1=Monday, etc.) |
| `next_scheduled_date` | date | Next calculated run date |

### New Table: `user_schedules`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `schedule_type` | text | Type of schedule ('restock') |
| `frequency_days` | integer | Days between events |
| `day_of_week` | integer | Preferred day (0-6) |
| `last_completed_date` | timestamp | When last done |
| `next_scheduled_date` | date | Next occurrence |

---

## Implementation Details

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| Migration | Create | Add columns to locations, mileage_routes, and create user_schedules table |
| `src/hooks/useSmartScheduler.ts` | Create | Central hook for all smart scheduling logic |
| `src/components/dashboard/WeeklyCalendarWidget.tsx` | Create | Visual weekly calendar widget |
| `src/components/dashboard/CollectionDueWidget.tsx` | Create | Collection reminders alert widget |
| `src/pages/Dashboard.tsx` | Modify | Add new widgets to widget system |
| `src/components/LocationTrackerComponent.tsx` | Modify | Add collection frequency field to location form |
| `src/components/LocationDetailDialog.tsx` | Modify | Show collection schedule and status |
| `src/components/mileage/RouteManager.tsx` | Modify | Add schedule settings to routes |
| `src/components/mileage/RouteEditor.tsx` | Modify | Add schedule frequency and day picker |
| `src/hooks/useLocationsDB.ts` | Modify | Handle new collection schedule fields |
| `src/hooks/useRoutesDB.ts` | Modify | Handle new route schedule fields |
| `src/hooks/useUserSchedules.ts` | Create | Hook for managing restock schedule |
| `src/pages/Settings.tsx` | Modify | Add restock schedule configuration |

---

### Collection Schedule UI (Location Form)

Added to the location add/edit form:

```text
Collection Schedule
+----------------------------------+
| Frequency: [Weekly           v]  |
|                                  |
| Options:                         |
|   - Weekly (7 days)              |
|   - Every 2 Weeks (14 days)      |
|   - Every 3 Weeks (21 days)      |
|   - Monthly (30 days)            |
|   - Custom: [___] days           |
+----------------------------------+
```

### Route Schedule UI (Route Editor)

Added to the route create/edit dialog:

```text
Run Schedule (Optional)
+----------------------------------+
| Frequency: [Weekly           v]  |
| Run On:    [Tuesday          v]  |
|                                  |
| Next Run: Tuesday, Feb 4         |
+----------------------------------+
```

### Restock Schedule (Settings Page)

New section in Settings:

```text
Restock Schedule
+----------------------------------+
| How often do you restock?        |
|                                  |
| Frequency: [Every 2 Weeks    v]  |
| Preferred Day: [Saturday     v]  |
|                                  |
| Next Restock: Saturday, Feb 8    |
+----------------------------------+
```

### Weekly Calendar Widget Design

```text
+----------------------------------------------------------+
|  This Week                                    [Calendar]  |
+----------------------------------------------------------+
|  Mon 3   |  Tue 4    |  Wed 5   |  Thu 6   |  Fri 7  ... |
| -------- | --------- | -------- | -------- | ----------- |
|          | [R] Route |          |          | [C] Pizza   |
|          |    A Run  |          |          |    Palace   |
|          |           |          |          |             |
|          |           |          |          | [S] Restock |
+----------------------------------------------------------+

Legend: [C] = Collection  [R] = Route  [S] = Restock  [M] = Maintenance
```

---

## Scheduling Logic

### Collection Due Status

```text
lastCollection = most recent machine_collections entry for location
daysSinceCollection = today - lastCollection
scheduleFrequency = location.collection_frequency_days

Status:
- If no frequency set → No schedule (skip)
- If daysSinceCollection > scheduleFrequency → OVERDUE (red)
- If daysSinceCollection === scheduleFrequency → DUE TODAY (yellow)
- If daysSinceCollection === scheduleFrequency - 1 → DUE SOON (orange)
- Otherwise → ON TRACK (green)

Next Due Date = lastCollection + scheduleFrequency days
```

### Route Next Run Date

```text
If route has schedule_frequency_days and schedule_day_of_week:
  - Find the next occurrence of schedule_day_of_week
  - If that day is today and route was run today, add frequency_days
  - Otherwise return that date

Display on route card: "Next run: Tuesday, Feb 4"
```

### Restock Next Date

```text
If user has restock schedule configured:
  - Start from last_completed_date (or today if never done)
  - Add frequency_days
  - Adjust to the preferred day_of_week if set
  
Display in Settings and Calendar: "Next restock: Saturday, Feb 8"
```

---

## User Experience Flow

1. **Initial Setup**:
   - User sets collection frequency when creating/editing locations
   - User optionally adds run schedules to their saved routes
   - User sets restock schedule in Settings

2. **Daily View**:
   - Dashboard shows Weekly Calendar widget with all scheduled tasks
   - Collection Due widget highlights overdue/due-today locations
   - Route cards show "Next run" date if scheduled

3. **Taking Action**:
   - Click calendar task to navigate to relevant page
   - Logging a collection updates last_collection_date
   - Completing a restock updates the schedule

4. **Ongoing**:
   - Calendar auto-updates based on schedules
   - Overdue items become more prominent
   - Helps users stay on top of their business

---

## Frequency Options (Used Everywhere)

| Label | Days |
|-------|------|
| Weekly | 7 |
| Every 2 Weeks | 14 |
| Every 3 Weeks | 21 |
| Monthly | 30 |
| Custom | User-defined |

This consistent set of options is used for:
- Location collection schedules
- Route run schedules
- Restock schedules

