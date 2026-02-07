
## Comprehensive Feature Enhancement Plan

This plan addresses your top priority features with a focus on commission tracking, mobile UI fixes, team data sharing, and the supporting infrastructure needed.

---

### Phase 1: Mobile UI Fix (Top Cutoff Issue)

**Problem**: The mobile header overlaps with the device status bar, making the "Dashboard" title partially obscured by the system clock/battery indicator.

**Root Cause**: While `viewport-fit=cover` is set and `apple-mobile-web-app-status-bar-style` is `black-translucent`, the `MobileHeader` component doesn't account for the safe area inset at the top.

**Solution**:

1. **Update `MobileHeader.tsx`**:
   - Add `pt-[env(safe-area-inset-top)]` to the header to push content below the notch/status bar
   - Adjust the sticky positioning to account for safe area

2. **Update `MobileLayout.tsx`**:
   - Ensure the overall layout respects the top safe area inset

3. **Update `index.css`**:
   - Add CSS custom properties for safe area values to use consistently

**Files to modify**:
- `src/components/layout/MobileHeader.tsx`
- `src/components/layout/MobileLayout.tsx`
- `src/index.css`

---

### Phase 2: Commission Paid Tracking

**Problem**: No way to mark when commission has been paid to a location.

**Solution**: Add a `commission_paid` boolean field and `commission_paid_at` timestamp to the `commission_summaries` table.

**Database Changes**:
```sql
ALTER TABLE commission_summaries 
ADD COLUMN commission_paid boolean DEFAULT false,
ADD COLUMN commission_paid_at timestamptz;
```

**UI Changes**:
- Add a checkbox/toggle on each commission summary row showing "Paid" status
- When checked, record the timestamp
- Visual indicator (green checkmark badge) for paid commissions
- Filter option to show "Unpaid Only" commissions

**Files to modify**:
- Database migration for new columns
- `src/components/CommissionSummaryGenerator.tsx` (or location details commission tab)
- Update types in `src/integrations/supabase/types.ts` (auto-generated)

---

### Phase 3: Team Data Sharing (Two-Way Visibility)

**Problem**: When team members add data (revenue, leads, etc.), it uses their own `user_id`, so the owner cannot see it. Data flows one direction only.

**Root Cause**: 
- INSERT operations use `user_id = auth.uid()` (the team member's ID)
- RLS SELECT policies check `user_id = auth.uid() OR has_team_permission()` but team members insert with their own ID, not the owner's

**Solution**: When a team member is active, their data should be attributed to the **owner's account** they're working under.

**Implementation**:

1. **Create a helper function** `get_effective_owner_id()`:
   ```sql
   CREATE FUNCTION get_effective_owner_id(current_user_id uuid)
   RETURNS uuid AS $$
     SELECT COALESCE(
       (SELECT owner_user_id FROM team_members 
        WHERE member_user_id = current_user_id 
        AND status = 'active' LIMIT 1),
       current_user_id
     )
   $$ LANGUAGE sql STABLE SECURITY DEFINER;
   ```

2. **Add `created_by_user_id` column** to track who actually created the record:
   - Add to: `revenue_entries`, `leads`, `lead_activities`, `inventory_items`, `maintenance_reports` (resolution), `mileage_entries`
   - This provides the attribution you requested

3. **Update INSERT logic** in hooks:
   - When inserting, use the owner's ID for `user_id` column (for RLS)
   - Store the actual user's ID in `created_by_user_id` (for attribution display)

4. **UI Attribution Display**:
   - Show "Added by: [initials or name]" on data entries
   - Query the `profiles` table to get display name
   - Show in tables, cards, and detail views

**Files to modify**:
- Database migration (add columns + function)
- `src/hooks/useRevenueEntriesDB.ts`
- `src/hooks/useLeadsDB.ts`
- `src/hooks/useInventoryDB.ts`
- `src/hooks/useMileageDB.ts`
- Create `src/hooks/useTeamContext.ts` to provide owner context
- UI components to display attribution badges

---

### Phase 4: Enhanced Team Roles

**Current State**: Two roles (Manager, Technician) with custom permissions toggle.

**New Roles to Add**:
| Role | Description | Default Permissions |
|------|-------------|---------------------|
| **Supervisor** | Manages technicians, assigns tasks | All Manager permissions + task assignment |
| **Route Driver** | Handles routes and mileage only | Mileage, assigned routes, view-only locations |
| **Inventory Clerk** | Inventory management only | Inventory only, no locations/revenue/leads |
| **Sales Manager** | Leads and locations focus | Leads, locations, no revenue/inventory |

**Implementation**:

1. **Update database enum**:
   ```sql
   ALTER TYPE team_role ADD VALUE 'supervisor';
   ALTER TYPE team_role ADD VALUE 'route_driver';
   ALTER TYPE team_role ADD VALUE 'inventory_clerk';
   ALTER TYPE team_role ADD VALUE 'sales_manager';
   ```

2. **Add role presets in UI**:
   - When selecting a role, auto-populate the permission toggles
   - User can still customize after selection

3. **Update `InviteMemberDialog.tsx`**:
   - Add new role options with descriptions
   - Apply preset permissions per role

4. **Extend permissions table** (if needed for future capabilities):
   - `can_assign_tasks` for Supervisor role

**Files to modify**:
- Database migration for enum + optional permissions column
- `src/components/team/InviteMemberDialog.tsx`
- `src/hooks/useTeamMembers.ts`

---

### Phase 5: Attribution Display System

**Goal**: Show who submitted data across all modules.

**Implementation**:

1. **Create `AttributionBadge` component**:
   ```tsx
   // Shows "JD" initials or "John Doe" with tooltip
   interface Props {
     userId: string;
     showFullName?: boolean;
   }
   ```

2. **Create `useUserDisplay` hook**:
   - Caches user display info (name, initials) from profiles table
   - Provides helper to format attribution text

3. **Integrate into UI**:
   - Revenue entry rows: "Added by JD"
   - Lead cards: "Created by JD"
   - Maintenance reports: "Resolved by JD"
   - Inventory adjustments: "Updated by JD"

**Files to create/modify**:
- `src/components/shared/AttributionBadge.tsx` (new)
- `src/hooks/useUserDisplay.ts` (new)
- Various list/card components to show attribution

---

### Technical Summary

#### Database Migrations Required:
1. Add `commission_paid` and `commission_paid_at` to `commission_summaries`
2. Add `created_by_user_id` to revenue_entries, leads, lead_activities, inventory_items, mileage_entries
3. Create `get_effective_owner_id()` function
4. Add new role values to `team_role` enum

#### New Files:
- `src/hooks/useTeamContext.ts` - Provides owner context for data entry
- `src/hooks/useUserDisplay.ts` - User name/initials lookup
- `src/components/shared/AttributionBadge.tsx` - Displays who created data

#### Modified Files:
- `src/components/layout/MobileHeader.tsx` - Safe area fix
- `src/components/layout/MobileLayout.tsx` - Safe area fix
- `src/index.css` - Safe area CSS variables
- `src/hooks/useRevenueEntriesDB.ts` - Use owner context + created_by
- `src/hooks/useLeadsDB.ts` - Use owner context + created_by
- `src/hooks/useInventoryDB.ts` - Use owner context + created_by
- `src/hooks/useMileageDB.ts` - Use owner context + created_by
- `src/components/team/InviteMemberDialog.tsx` - New roles + presets
- `src/hooks/useTeamMembers.ts` - New role types
- Commission-related components for paid tracking

---

### Implementation Order

1. **Mobile UI Fix** - Quick win, improves UX immediately
2. **Commission Paid Tracking** - Simple feature, adds value
3. **Team Data Sharing + Attribution** - Core infrastructure (largest effort)
4. **Enhanced Team Roles** - Builds on team infrastructure

---

### Future Features (Not in This Plan)

The following features from your list require separate planning:
- Knowledge base / onboarding
- Pagination for lists
- Bulk QR code printing
- Calendar month/week views
- Push notifications for maintenance

I recommend tackling these after the team infrastructure is solid.
