

## Fix Team Data Sharing - Complete Solution

### Problem Summary

When a team member adds data (leads, revenue, inventory, mileage), the owner cannot see it. This is because:

1. **Hook issue**: All data hooks insert with `user_id: user.id` (team member's ID) instead of the owner's ID
2. **RLS INSERT policy issue**: Current policies check `auth.uid() = user_id`, which would reject inserts where `user_id` is the owner's ID but `auth.uid()` is the team member's ID
3. **Attribution missing**: The `created_by_user_id` column exists but is never populated

---

### Current Database State (Evidence)

Looking at the `leads` table:
- Team member `4f28bd1d-602f-49e3-ade0-0ac174d79f82` works for owner `4770ed25-863f-40bb-96d4-9dbe0855e349`
- Team member's leads have `user_id: 4f28bd1d-602f-49e3-ade0-0ac174d79f82`
- Owner can't see them because RLS checks `auth.uid() = user_id` (owner's ID doesn't match)

---

### Solution Overview

**Two-Part Fix:**

1. **Database**: Update RLS INSERT policies to allow team members to insert on behalf of their owner using `get_effective_owner_id(auth.uid())`

2. **Frontend**: Update all data hooks to:
   - Use `useTeamContext` to get the effective owner ID
   - Set `user_id` to the owner's ID (for RLS visibility)
   - Set `created_by_user_id` to the actual user's ID (for attribution)

---

### Part 1: Database Migration

Update INSERT policies for all affected tables to check that the user_id matches the effective owner ID:

```sql
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can create own leads" ON leads;
DROP POLICY IF EXISTS "Users can create own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can create own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can create their own mileage entries" ON mileage_entries;
DROP POLICY IF EXISTS "Users can create own locations" ON locations;

-- Create new INSERT policies that allow team members to insert for their owner
CREATE POLICY "Users and team members can create leads"
ON leads FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can create revenue entries"
ON revenue_entries FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can create inventory"
ON inventory_items FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can create mileage entries"
ON mileage_entries FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can create locations"
ON locations FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));
```

Also update the UPDATE and DELETE policies for consistency (team members should be able to modify data they can see).

---

### Part 2: Hook Updates

**Files to modify:**

| Hook | Changes |
|------|---------|
| `useLeadsDB.ts` | Use `useTeamContext`, set `user_id` to `effectiveUserId`, add `created_by_user_id` |
| `useRevenueEntriesDB.ts` | Use `useTeamContext`, set `user_id` to `effectiveUserId`, add `created_by_user_id` |
| `useInventoryDB.ts` | Use `useTeamContext`, set `user_id` to `effectiveUserId`, add `created_by_user_id` |
| `useMileageDB.ts` | Use `useTeamContext`, set `user_id` to `effectiveUserId`, add `created_by_user_id` |
| `useLocationsDB.ts` | Use `useTeamContext`, set `user_id` to `effectiveUserId` |

**Example change for `useLeadsDB.ts`:**

```typescript
// Before
const createLead = async (input: CreateLeadInput) => {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      user_id: user.id,  // ❌ Team member's ID
    })
}

// After
const createLead = async (input: CreateLeadInput) => {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      user_id: effectiveUserId,  // ✅ Owner's ID (for RLS)
      created_by_user_id: user.id,  // ✅ Team member's ID (for attribution)
    })
}
```

---

### Part 3: Data Migration (Optional)

Fix existing data that was inserted with wrong user_id:

```sql
-- Update leads created by team members to use owner's user_id
UPDATE leads
SET 
  user_id = tm.owner_user_id,
  created_by_user_id = leads.user_id
FROM team_members tm
WHERE leads.user_id = tm.member_user_id
  AND tm.status = 'active'
  AND leads.created_by_user_id IS NULL;
```

This migrates existing records so owners can see team member data retroactively.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| New migration SQL | Create - RLS policy updates |
| `src/hooks/useLeadsDB.ts` | Modify - Add useTeamContext integration |
| `src/hooks/useRevenueEntriesDB.ts` | Modify - Add useTeamContext integration |
| `src/hooks/useInventoryDB.ts` | Modify - Add useTeamContext integration |
| `src/hooks/useMileageDB.ts` | Modify - Add useTeamContext integration |
| `src/hooks/useLocationsDB.ts` | Modify - Add useTeamContext integration |

---

### Technical Details

#### useTeamContext Integration Pattern

Each hook will:
1. Import and use `useTeamContext`
2. Wait for context to load before allowing operations
3. Use `effectiveUserId` for `user_id` column
4. Use `user.id` for `created_by_user_id` column

```typescript
export function useLeadsDB() {
  const { user } = useAuth();
  const { effectiveUserId, isLoading: isTeamContextLoading } = useTeamContext();
  
  const createLead = async (input: CreateLeadInput) => {
    if (!user || !effectiveUserId) return null;
    
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...input,
        user_id: effectiveUserId,          // Owner's ID
        created_by_user_id: user.id,       // Actual creator
        status: input.status || 'new',
        priority: input.priority || 'warm',
      })
      // ...
  };
}
```

---

### Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Team member adds lead | Owner can't see it | Owner sees it immediately |
| Team member adds revenue | Owner can't see it | Owner sees it with attribution |
| Owner views lead | Missing team data | All team leads visible |
| Attribution badge | Empty | Shows "Added by [Team Member]" |

---

### Verification Steps

1. Log in as team member, add a lead
2. Log in as owner, verify lead appears in pipeline
3. Check lead shows "Added by [Team Member Name]" attribution
4. Repeat for revenue, inventory, mileage entries

