
## Fix Team Member Data Visibility

### Problem
When a team member logs in, they cannot see any data (locations, maintenance reports, etc.) even though they have the correct permissions assigned. The data exists in the owner's account but the team member sees empty screens.

### Root Cause
The frontend hooks explicitly filter queries by the logged-in user's ID:
```javascript
.eq("user_id", user.id)
```

This bypasses the RLS policies that allow team members to access their owner's data. The RLS policies are correctly configured using `has_team_permission()`, but the frontend code adds an explicit filter that prevents team members from seeing owner data.

### Solution
Remove the explicit `user_id` filter from SELECT queries on tables that have team permission RLS policies. The RLS policies will automatically:
1. Allow owners to see their own data
2. Allow team members to see their owner's data based on their permissions

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useLocationsDB.ts` | Remove `.eq("user_id", user.id)` from fetchLocations query |
| `src/hooks/useMaintenanceReports.ts` | Remove `.eq("user_id", user.id)` from fetchReports query |
| `src/hooks/useInventoryDB.ts` | Remove `.eq("user_id", user.id)` from fetch query |
| `src/hooks/useRevenueEntriesDB.ts` | Remove `.eq("user_id", user.id)` from fetchEntries query |
| `src/hooks/useLeadsDB.ts` | Remove `.eq("user_id", user.id)` from fetchLeads query |
| `src/hooks/useReportsData.ts` | Remove filters from queries for locations, revenue, inventory |
| `src/components/maintenance/AddMaintenanceReportDialog.tsx` | Remove filter from locations query |

---

### Technical Details

**Before (locations query):**
```typescript
const { data: locationsData } = await supabase
  .from("locations")
  .select("*")
  .eq("user_id", user.id)  // ❌ Blocks team member access
  .order("created_at", { ascending: false });
```

**After (locations query):**
```typescript
const { data: locationsData } = await supabase
  .from("locations")
  .select("*")
  // RLS handles access control:
  // - Owners see their own data (user_id = auth.uid())
  // - Team members see owner data via has_team_permission()
  .order("created_at", { ascending: false });
```

---

### Why This Works
The RLS policies on these tables already have two SELECT policies:
1. **Owner policy**: `USING (auth.uid() = user_id)` - owners see their own data
2. **Team policy**: `USING (has_team_permission(auth.uid(), user_id, 'permission_name'))` - team members see owner data

When a query is made without an explicit user_id filter, RLS evaluates both policies and returns all rows the user is authorized to see.

---

### Tables NOT Changed
These tables should keep their `user_id` filter because they are user-specific settings without team RLS policies:
- `user_preferences` - Personal dashboard settings
- `user_schedules` - Personal schedules
- `profiles` - Personal profile data
- `vehicles` - Personal vehicle data
- `mileage_entries` - Personal mileage tracking
- `mileage_routes` - Personal routes

---

### Testing After Implementation
1. Log in as the team member (`cbordensales@gmail.com`)
2. Navigate to Locations - should see owner's "test" location
3. Navigate to Maintenance - should see any maintenance reports
4. Navigate to Inventory - should see owner's inventory (if permissions allow)
