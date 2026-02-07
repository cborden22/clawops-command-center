

## Fix Team Member Data Visibility - Database Policy Update

### Issue Summary
After investigating, the frontend code changes are correctly deployed and working. The RLS policies on the main tables (`locations`, `location_machines`, `maintenance_reports`, `inventory_items`, `revenue_entries`, `leads`) are correctly configured with team permission policies.

However, there are **two missing team RLS policies** that need to be added, and the user may need to refresh their browser and ensure they're logged in as the correct team member account (`cameron@sqftent.com`).

---

### Missing RLS Policies

The following child tables are missing team member SELECT policies:

| Table | Current Policy | Issue |
|-------|---------------|-------|
| `commission_summaries` | Only checks `locations.user_id = auth.uid()` | Team members can't see owner's commission summaries |
| `location_agreements` | Only checks `locations.user_id = auth.uid()` | Team members can't see owner's agreements |

---

### Database Migration Required

Add team member SELECT policies to both tables:

```sql
-- Add team permission policy for commission_summaries
CREATE POLICY "Team members can view owner commission summaries"
ON public.commission_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = commission_summaries.location_id
      AND has_team_permission(auth.uid(), l.user_id, 'locations')
  )
);

-- Add team permission policy for location_agreements  
CREATE POLICY "Team members can view owner location agreements"
ON public.location_agreements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_agreements.location_id
      AND has_team_permission(auth.uid(), l.user_id, 'locations')
  )
);
```

---

### Testing Instructions

After the fix is deployed:

1. **Log out** of the current account (if logged in as `admin@test.com`)
2. **Log in as `cameron@sqftent.com`** (the team member)
3. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Navigate to **Locations** - should see 15 locations from `chborden22@gmail.com`
5. Navigate to **Maintenance** - should see any maintenance reports from the owner
6. Navigate to **Inventory** - should see owner's inventory items

---

### Verification of Current State

I've verified the following are working correctly:

| Component | Status | Notes |
|-----------|--------|-------|
| `useLocationsDB.ts` | Correct | No `user_id` filter in SELECT query |
| `useMaintenanceReports.ts` | Correct | No `user_id` filter in SELECT query |
| `useInventoryDB.ts` | Correct | No `user_id` filter in SELECT query |
| `useRevenueEntriesDB.ts` | Correct | No `user_id` filter in SELECT query |
| `useLeadsDB.ts` | Correct | No `user_id` filter in SELECT query |
| `locations` RLS | Correct | Has team permission policy |
| `location_machines` RLS | Correct | Has team permission policy |
| `has_team_permission()` | Correct | Returns `true` for cameron viewing chborden22's data |
| Team member record | Correct | cameron@sqftent.com is active team member of chborden22@gmail.com |

---

### Important Note

The network logs show the current preview session is logged in as `admin@test.com`, not `cameron@sqftent.com`. When `cameron@sqftent.com` logs in and views the Locations page, they should see all 15 locations from `chborden22@gmail.com`.

