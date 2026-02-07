-- =============================================
-- FIX TEAM DATA SHARING - RLS POLICY UPDATES
-- =============================================

-- PART 1: UPDATE INSERT POLICIES
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

-- PART 2: UPDATE UPDATE POLICIES (team members can update data they can see)
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update their own mileage entries" ON mileage_entries;
DROP POLICY IF EXISTS "Users can update own locations" ON locations;

CREATE POLICY "Users and team members can update leads"
ON leads FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'leads'));

CREATE POLICY "Users and team members can update revenue entries"
ON revenue_entries FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'revenue'));

CREATE POLICY "Users and team members can update inventory"
ON inventory_items FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can update mileage entries"
ON mileage_entries FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'mileage'));

CREATE POLICY "Users and team members can update locations"
ON locations FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'));

-- PART 3: UPDATE DELETE POLICIES (team members can delete data they can see)
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own revenue entries" ON revenue_entries;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete their own mileage entries" ON mileage_entries;
DROP POLICY IF EXISTS "Users can delete own locations" ON locations;

CREATE POLICY "Users and team members can delete leads"
ON leads FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'leads'));

CREATE POLICY "Users and team members can delete revenue entries"
ON revenue_entries FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'revenue'));

CREATE POLICY "Users and team members can delete inventory"
ON inventory_items FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can delete mileage entries"
ON mileage_entries FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'mileage'));

CREATE POLICY "Users and team members can delete locations"
ON locations FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'));

-- PART 4: UPDATE SELECT POLICIES for mileage_entries (currently missing team support)
DROP POLICY IF EXISTS "Users can view their own mileage entries" ON mileage_entries;

CREATE POLICY "Users and team members can view mileage entries"
ON mileage_entries FOR SELECT
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'mileage'));

-- PART 5: MIGRATE EXISTING DATA
-- Update leads created by team members to use owner's user_id
UPDATE leads
SET 
  user_id = tm.owner_user_id,
  created_by_user_id = COALESCE(leads.created_by_user_id, leads.user_id)
FROM team_members tm
WHERE leads.user_id = tm.member_user_id
  AND tm.status = 'active';

-- Update revenue_entries created by team members
UPDATE revenue_entries
SET 
  user_id = tm.owner_user_id,
  created_by_user_id = COALESCE(revenue_entries.created_by_user_id, revenue_entries.user_id)
FROM team_members tm
WHERE revenue_entries.user_id = tm.member_user_id
  AND tm.status = 'active';

-- Update inventory_items created by team members
UPDATE inventory_items
SET 
  user_id = tm.owner_user_id,
  created_by_user_id = COALESCE(inventory_items.created_by_user_id, inventory_items.user_id)
FROM team_members tm
WHERE inventory_items.user_id = tm.member_user_id
  AND tm.status = 'active';

-- Update mileage_entries created by team members
UPDATE mileage_entries
SET 
  user_id = tm.owner_user_id,
  created_by_user_id = COALESCE(mileage_entries.created_by_user_id, mileage_entries.user_id)
FROM team_members tm
WHERE mileage_entries.user_id = tm.member_user_id
  AND tm.status = 'active';

-- Update locations created by team members
UPDATE locations
SET 
  user_id = tm.owner_user_id
FROM team_members tm
WHERE locations.user_id = tm.member_user_id
  AND tm.status = 'active';