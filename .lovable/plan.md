

## Fix Commission Checkbox + Add Management Calendar Page

This plan addresses two issues:
1. **Commission Paid Checkbox Not Updating**: When you click the checkbox to mark a commission as paid, the visual state doesn't update immediately in the dialog
2. **Missing Calendar Page**: The full month/week calendar view under Management section was discussed but not implemented

---

### Issue 1: Commission Checkbox Not Updating

**Root Cause Analysis**

The `LocationDetailDialog` receives a `location` prop that is a snapshot from when the dialog was opened. When `toggleCommissionPaid` is called, it:
1. Updates the database
2. Calls `fetchLocations()` to refresh the locations array

However, the dialog continues to display the **stale** `location` object that was passed to it. The parent component's state updates, but the dialog doesn't see the new data because:
- The `location` prop is passed by value (a copy)
- React doesn't re-render the dialog with the new location unless the parent explicitly passes the updated object

**Solution**

Add local state in `LocationDetailDialog` to track commission summaries and update it after successful toggle. When `toggleCommissionPaid` succeeds, update the local state to reflect the change immediately.

**Files to Modify**
- `src/components/LocationDetailDialog.tsx`

**Changes**
1. Add local state for commission summaries that syncs from props
2. After successful toggle, update local state immediately for instant UI feedback
3. Add `useEffect` to sync local state when the `location` prop changes

---

### Issue 2: Management Calendar Page

**Requested Feature**

A dedicated Calendar page under the Management section with:
- Month view to see the entire month at a glance
- Week view with detailed time slots
- Task creation - add custom tasks/events directly on calendar
- Team assignment - assign scheduled tasks to specific team members (future enhancement)

This is **separate** from the existing dashboard "This Week" widget which should remain unchanged.

**Implementation Plan**

1. **Create new Calendar page**: `src/pages/Calendar.tsx`
   - Month view showing all scheduled tasks
   - Week view with more detailed daily breakdown
   - Toggle between views
   - Click on a day to see details or add tasks
   
2. **Add route**: Update `src/App.tsx` with `/calendar` route

3. **Add navigation**: Update `src/components/layout/AppSidebar.tsx` to include Calendar under Management section

**Calendar Page Design**

```text
+--------------------------------------------------+
| Management Calendar                    [Month][Week] |
+--------------------------------------------------+
|                                                  |
|  < February 2026 >                              |
|                                                  |
|  Sun    Mon    Tue    Wed    Thu    Fri    Sat  |
| +------+------+------+------+------+------+------+
| |  1   |  2   |  3   |  4   |  5   |  6   |  7   |
| |      | [R]  |      |      | [M]  |      |      |
| |------+------+------+------+------+------+------|
| |  8   |  9   |  10  |  11  |  12  |  13  |  14  |
| |      | [R]  |      |      |      | [FU] |      |
| +------+------+------+------+------+------+------+
|                                                  |
| Legend: [R]=Restock [M]=Maintenance [FU]=Follow-up |
+--------------------------------------------------+
```

**Data Sources (already available)**
- Restock schedules from `useSmartScheduler`
- Route schedules from `useSmartScheduler`
- Maintenance reports from `useMaintenanceReports`
- Lead follow-ups from `useLeadsDB`

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Calendar.tsx` | Management calendar with month/week views |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/LocationDetailDialog.tsx` | Fix commission checkbox state sync |
| `src/App.tsx` | Add `/calendar` route |
| `src/components/layout/AppSidebar.tsx` | Add Calendar to Management section |

---

### Technical Details

#### Commission Checkbox Fix

```typescript
// Add local state for commission summaries
const [localCommissionSummaries, setLocalCommissionSummaries] = useState<CommissionSummaryRecord[]>(
  location?.commissionSummaries || []
);

// Sync when location changes
useEffect(() => {
  if (location) {
    setLocalCommissionSummaries(location.commissionSummaries);
  }
}, [location?.id, location?.commissionSummaries]);

// Update handler to update local state immediately
const handleToggleCommissionPaid = async (summaryId: string, currentPaid: boolean) => {
  setTogglingPaidId(summaryId);
  const success = await toggleCommissionPaid(summaryId, !currentPaid);
  setTogglingPaidId(null);
  
  if (success) {
    // Update local state immediately for UI feedback
    setLocalCommissionSummaries(prev => prev.map(s => 
      s.id === summaryId 
        ? { ...s, commissionPaid: !currentPaid, commissionPaidAt: !currentPaid ? new Date().toISOString() : null }
        : s
    ));
    // Toast notification...
  }
};

// Use localCommissionSummaries instead of location.commissionSummaries in the render
```

#### Calendar Page Structure

```typescript
// src/pages/Calendar.tsx
export default function Calendar() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Use existing hooks for data
  const { locations } = useLocations();
  const { routes } = useRoutesDB();
  const { leads } = useLeadsDB();
  const { reports } = useMaintenanceReports();
  
  // Smart scheduler provides task data
  const { weeklyTasks, tasksByDate, restockStatuses, routeScheduleStatuses } = useSmartScheduler({
    locations,
    routes,
    userSchedules: [],
    maintenanceReports: reports,
    leads: leads.map(l => ({...})),
  });
  
  // Render month or week view based on viewMode
}
```

---

### Navigation Update

Add to `managementItems` in `AppSidebar.tsx`:

```typescript
const managementItems = [
  { title: "Team", url: "/team", icon: UsersRound },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];
```

---

### Expected Behavior After Implementation

| Action | Result |
|--------|--------|
| Click commission "Unpaid" checkbox | Immediately shows "Paid" with green border |
| Navigate to /calendar | Shows month view of all scheduled tasks |
| Toggle to Week view | Shows detailed weekly breakdown |
| Click on a day | Highlights day, shows task details |
| Tasks from dashboard | Same data sources, different presentation |

