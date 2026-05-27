
-- 1) Remove the public/anon INSERT policy on maintenance_reports.
-- Public submissions still work via the submit-maintenance-report edge function,
-- which uses the service role key and bypasses RLS.
DROP POLICY IF EXISTS "Anyone can create reports for valid machines" ON public.maintenance_reports;

-- 2) Tighten INSERT policies that rely on get_effective_owner_id so team members
-- must also have the corresponding has_team_permission flag.

-- revenue_entries
DROP POLICY IF EXISTS "Users and team members can create revenue entries" ON public.revenue_entries;
CREATE POLICY "Users and team members can create revenue entries"
ON public.revenue_entries FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'revenue'))
);

-- locations
DROP POLICY IF EXISTS "Users and team members can create locations" ON public.locations;
CREATE POLICY "Users and team members can create locations"
ON public.locations FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'locations'))
);

-- mileage_entries
DROP POLICY IF EXISTS "Users and team members can create mileage entries" ON public.mileage_entries;
CREATE POLICY "Users and team members can create mileage entries"
ON public.mileage_entries FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'mileage'))
);

-- calendar_tasks (treat as locations permission, matching existing UPDATE/DELETE policies)
DROP POLICY IF EXISTS "Users and team members can create calendar tasks" ON public.calendar_tasks;
CREATE POLICY "Users and team members can create calendar tasks"
ON public.calendar_tasks FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'locations'))
);

-- inventory_items
DROP POLICY IF EXISTS "Users and team members can create inventory" ON public.inventory_items;
CREATE POLICY "Users and team members can create inventory"
ON public.inventory_items FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'inventory'))
);

-- inventory_balances
DROP POLICY IF EXISTS "Users and team members can create inventory balances" ON public.inventory_balances;
CREATE POLICY "Users and team members can create inventory balances"
ON public.inventory_balances FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'inventory'))
);

-- inventory_locations
DROP POLICY IF EXISTS "Users and team members can create inventory locations" ON public.inventory_locations;
CREATE POLICY "Users and team members can create inventory locations"
ON public.inventory_locations FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'inventory'))
);

-- leads
DROP POLICY IF EXISTS "Users and team members can create leads" ON public.leads;
CREATE POLICY "Users and team members can create leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id = get_effective_owner_id(auth.uid()) AND has_team_permission(auth.uid(), user_id, 'leads'))
);
