

## Fix Calendar Logic, Restock Scheduling & Route Links

This plan addresses the navigation issues and implements your refined calendar logic where locations appear either:
1. On their scheduled restock day (if they have a schedule and are NOT part of a route)
2. As part of a route run (if they're stops on a scheduled route)

---

## Summary of Changes

| Issue | Fix |
|-------|-----|
| Route links go to 404 `/routes` | Change to `/mileage` (correct page) |
| "Collection" terminology | Rename to "Restock" throughout |
| Calendar shows locations incorrectly | Only show standalone restocks for locations NOT in any route |
| Need day-of-week for restocks | Add `restock_day_of_week` field to locations |
| Route run tasks need location context | Show which locations are included in each route run |

---

## Database Changes

### Add Column to `locations` Table

| Column | Type | Purpose |
|--------|------|---------|
| `restock_day_of_week` | integer (nullable) | Preferred restock day (0=Sunday, 6=Saturday) |

This allows users to set "Restock every 2 weeks on Wednesday" for a location.

---

## New Calendar Logic

```text
For each location:
  - Check if location is a stop on ANY route with a schedule
  - If YES: Location is "route-bound" → Don't create standalone restock task
  - If NO and has restock schedule: Create standalone "Restock" task on its scheduled day

For each route with schedule:
  - Create "Route Run" task
  - Include subtitle listing the locations on that route (e.g., "Pizza Palace, Mall Arcade")
```

### Visual Example

```text
+----------------------------------------------------------+
|  This Week                                                |
+----------------------------------------------------------+
|  Mon 3   |  Tue 4    |  Wed 5     |  Thu 6   |  Fri 7    |
| -------- | --------- | ---------- | -------- | --------- |
|          | [R] West  | [P] Gym    |          |           |
|          |    Route  |  (Restock) |          |           |
|          |  (Joe's,  |            |          |           |
|          |   Mall)   |            |          |           |
+----------------------------------------------------------+

[R] = Route Run (includes locations: Joe's Pizza, Mall Arcade)
[P] = Standalone Restock (Gym location has its own schedule, not on any route)
```

---

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| Migration | Create | Add `restock_day_of_week` to `locations` table |
| `src/hooks/useSmartScheduler.ts` | Modify | Fix route link, implement new logic for route-bound locations |
| `src/hooks/useLocationsDB.ts` | Modify | Add `restockDayOfWeek` field handling |
| `src/components/LocationTrackerComponent.tsx` | Modify | Rename to "Restock Schedule", add day picker, update form |
| `src/components/dashboard/WeeklyCalendarWidget.tsx` | Modify | Update legend: "Collection" → "Restock" |
| `src/components/dashboard/CollectionDueWidget.tsx` | Modify | Rename to "Restock Due" widget, update all text |
| `src/pages/Dashboard.tsx` | Modify | Update widget names/props |

---

## Implementation Details

### 1. Update `useSmartScheduler.ts`

**Fix Route Link:**
```typescript
// Line 246 - Change from:
link: "/routes",
// To:
link: "/mileage",
```

**New Logic - Determine Route-Bound Locations:**
```typescript
// Build a Set of location IDs that are stops on any scheduled route
const routeBoundLocationIds = useMemo(() => {
  const ids = new Set<string>();
  routes.forEach((route) => {
    // Only include routes that have a schedule
    if (route.scheduleFrequencyDays && route.scheduleDayOfWeek !== undefined) {
      route.stops.forEach((stop) => {
        if (stop.locationId) {
          ids.add(stop.locationId);
        }
      });
    }
  });
  return ids;
}, [routes]);
```

**Filter Restock Tasks:**
```typescript
// Only create standalone restock tasks for locations NOT in any scheduled route
const restockStatuses = locations
  .filter((loc) => loc.isActive)
  .filter((loc) => !routeBoundLocationIds.has(loc.id)) // NEW: Skip route-bound locations
  .map((loc) => {
    // ... existing logic to calculate restock due date
  });
```

**Enhance Route Tasks with Location Names:**
```typescript
// Get location names for route stops
const routeLocationNames = route.stops
  .filter(s => s.locationId)
  .map(s => locations.find(l => l.id === s.locationId)?.name)
  .filter(Boolean)
  .join(", ");

tasks.push({
  id: `route-${status.routeId}`,
  type: "route",
  title: status.routeName,
  subtitle: routeLocationNames || "Scheduled run", // Show location names
  // ...
});
```

### 2. Update Location Form

**Add Day-of-Week Picker (shown when frequency is selected):**
```tsx
const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// In the form, show day picker when frequency is selected:
{formData.collectionFrequencyDays && (
  <div className="space-y-2">
    <Label>Preferred Day</Label>
    <Select
      value={formData.restockDayOfWeek !== undefined ? String(formData.restockDayOfWeek) : "none"}
      onValueChange={(v) => setFormData(prev => ({
        ...prev,
        restockDayOfWeek: v === "none" ? undefined : parseInt(v)
      }))}
    >
      {/* Day options */}
    </Select>
  </div>
)}
```

**Rename Labels:**
- "Collection Schedule" → "Restock Schedule"
- "Collection Frequency" → "Restock Frequency"  
- "Get reminders when this location is due for collection" → "Get reminders when this location needs restocking"

### 3. Update Widget Terminology

**WeeklyCalendarWidget.tsx:**
- Change "Collection" to "Restock" in the legend

**CollectionDueWidget.tsx:**
- Rename file/component to RestockDueWidget
- "Collection Reminders" → "Restock Reminders"
- "All collections are up to date" → "All restocks are up to date"
- "days overdue" → "days overdue"
- "Collection due" → "Restock due"
- "Last collected:" → "Last restocked:"

---

## Updated User Experience

1. **Creating a location:**
   - Set Restock Schedule → Frequency + Preferred Day
   - Helper text: "Leave empty if this location is part of a route"

2. **Calendar View:**
   - Route runs show the route name + which locations are included
   - Standalone restocks only show for locations NOT on any scheduled route
   - Clicking route → navigates to `/mileage` (fixed!)

3. **Visual Distinction:**
   - Purple = Route runs (grouped locations)
   - Blue = Standalone restocks (locations with their own schedule, not on routes)

---

## Terminology Changes Summary

| Old Term | New Term |
|----------|----------|
| Collection | Restock |
| Collection Schedule | Restock Schedule |
| Collection Frequency | Restock Frequency |
| Last collected | Last restocked |
| CollectionDueWidget | RestockDueWidget |
| collectionStatuses | restockStatuses |

