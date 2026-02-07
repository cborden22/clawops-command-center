
## What’s actually happening

Your backend records show the team relationship is correctly set up:

- Owner profile: `chborden22@gmail.com` → user_id `4770ed25-863f-40bb-96d4-9dbe0855e349`
- Team member profile: `cameron@sqftent.com` → user_id `4f28bd1d-602f-49e3-ade0-0ac174d79f82`
- Team membership row exists and is **active**
- Permissions row exists and has **all view permissions = true**
- Owner has data: **15 locations**, **2 maintenance reports**

So this is not “the team member created their own business so nothing can be shared.” The share relationship exists and permissions are true.

Given that, the most likely cause is **Row Level Security policy evaluation** on the shared tables: the “owner can view” and “team member can view” SELECT policies are currently not combining the way we expect. If they’re being treated as restrictive (AND) instead of permissive (OR), a team member will see *zero rows* even though `has_team_permission()` returns true.

The frontend query filters were already removed, and code search confirms there are no remaining `.eq("user_id", user.id)` filters on locations SELECTs.

## Goal

Make shared tables return rows when either:
- the logged-in user is the owner of the row, OR
- the logged-in user has team permission to view the owner’s rows

…and do this in a way that is consistent across all shared modules (Locations, Maintenance, Inventory, Revenue, Leads, Reports).

---

## Plan: Fix by consolidating SELECT RLS policies (database migration)

### 1) Update SELECT policies for “shared business tables”
For each shared table below, we will:
1. **DROP** the existing two SELECT policies:
   - “Users can view own …”
   - “Team members can view owner …”
2. **CREATE a single SELECT policy** that explicitly uses `OR`:

#### Tables and policy logic
- **locations**
  - `USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'))`

- **inventory_items**
  - `USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'))`

- **revenue_entries**
  - `USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'revenue'))`

- **leads**
  - `USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'leads'))`

- **maintenance_reports**
  - `USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'maintenance'))`
  - (We will **not** change the existing UPDATE policy that allows team members with manage permission to update maintenance.)

### 2) Update SELECT policies for “child tables tied to locations”
These tables don’t have a direct `user_id`, so visibility must be derived through the related location:

- **location_machines**
- **commission_summaries**
- **location_agreements**

We will replace their separate owner/team SELECT policies with one policy:

```sql
USING (
  EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = <child>.location_id
      AND (
        l.user_id = auth.uid()
        OR has_team_permission(auth.uid(), l.user_id, 'locations')
      )
  )
)
```

This ensures the team member can see machines/summaries/agreements for the owner’s locations.

### 3) Safety checks (before/after)
We’ll validate in the backend (read-only checks):
- The team_members row is still active
- Owner still sees their own data
- Team member can now see owner rows in:
  - locations
  - maintenance_reports
  - location_machines
  - inventory_items (if any exist)
  - revenue_entries (if any exist)
  - leads (if any exist)

### 4) App-side verification steps (you will do in the UI)
After the migration:
1. Log out completely
2. Log in as **team member** `cameron@sqftent.com`
3. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. Visit:
   - **Locations**: should show the owner’s ~15 locations
   - **Maintenance**: should show the owner’s 2 reports
   - **Inventory/Revenue/Leads**: should show owner data if those tables have records

---

## Why this will fix it

Instead of relying on how multiple policies combine internally, we make the logic unambiguous by encoding the intended “owner OR team member” visibility into a single policy per table.

This eliminates the possibility that policy-combination behavior (permissive vs restrictive interaction) is what’s preventing team visibility.

---

## Technical notes (for completeness)

- No frontend changes are required for this specific fix (queries are already correctly not filtering by user_id).
- We will avoid changes to user-specific tables (profiles, vehicles, schedules, mileage) to prevent accidental privacy leaks.
- We will not alter INSERT/UPDATE/DELETE policies except where absolutely necessary; the main issue is SELECT visibility.

