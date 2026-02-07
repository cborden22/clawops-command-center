-- Consolidate SELECT RLS policies to use explicit OR logic
-- This fixes team member visibility by combining owner + team checks in single policies

-- =====================
-- 1. LOCATIONS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own locations" ON public.locations;
DROP POLICY IF EXISTS "Team members can view owner locations" ON public.locations;

CREATE POLICY "Users and team members can view locations"
ON public.locations FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_team_permission(auth.uid(), user_id, 'locations')
);

-- =====================
-- 2. INVENTORY_ITEMS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Team members can view owner inventory" ON public.inventory_items;

CREATE POLICY "Users and team members can view inventory"
ON public.inventory_items FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_team_permission(auth.uid(), user_id, 'inventory')
);

-- =====================
-- 3. REVENUE_ENTRIES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own revenue entries" ON public.revenue_entries;
DROP POLICY IF EXISTS "Team members can view owner revenue entries" ON public.revenue_entries;

CREATE POLICY "Users and team members can view revenue entries"
ON public.revenue_entries FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_team_permission(auth.uid(), user_id, 'revenue')
);

-- =====================
-- 4. LEADS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Team members can view owner leads" ON public.leads;

CREATE POLICY "Users and team members can view leads"
ON public.leads FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_team_permission(auth.uid(), user_id, 'leads')
);

-- =====================
-- 5. MAINTENANCE_REPORTS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own reports" ON public.maintenance_reports;
DROP POLICY IF EXISTS "Team members can view owner maintenance reports" ON public.maintenance_reports;

CREATE POLICY "Users and team members can view maintenance reports"
ON public.maintenance_reports FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_team_permission(auth.uid(), user_id, 'maintenance')
);

-- =====================
-- 6. LOCATION_MACHINES TABLE (child of locations)
-- =====================
DROP POLICY IF EXISTS "Users can view own location machines" ON public.location_machines;
DROP POLICY IF EXISTS "Team members can view owner location machines" ON public.location_machines;

CREATE POLICY "Users and team members can view location machines"
ON public.location_machines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_machines.location_id
      AND (l.user_id = auth.uid() OR has_team_permission(auth.uid(), l.user_id, 'locations'))
  )
);

-- =====================
-- 7. COMMISSION_SUMMARIES TABLE (child of locations)
-- =====================
DROP POLICY IF EXISTS "Users can view own commission summaries" ON public.commission_summaries;
DROP POLICY IF EXISTS "Team members can view owner commission summaries" ON public.commission_summaries;

CREATE POLICY "Users and team members can view commission summaries"
ON public.commission_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = commission_summaries.location_id
      AND (l.user_id = auth.uid() OR has_team_permission(auth.uid(), l.user_id, 'locations'))
  )
);

-- =====================
-- 8. LOCATION_AGREEMENTS TABLE (child of locations)
-- =====================
DROP POLICY IF EXISTS "Users can view own location agreements" ON public.location_agreements;
DROP POLICY IF EXISTS "Team members can view owner location agreements" ON public.location_agreements;

CREATE POLICY "Users and team members can view location agreements"
ON public.location_agreements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_agreements.location_id
      AND (l.user_id = auth.uid() OR has_team_permission(auth.uid(), l.user_id, 'locations'))
  )
);