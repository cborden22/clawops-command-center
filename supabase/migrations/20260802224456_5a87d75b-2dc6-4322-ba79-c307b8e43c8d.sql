DROP POLICY "Users and team members can create warehouses" ON public.warehouses;
CREATE POLICY "Users and team members can create warehouses"
ON public.warehouses FOR INSERT TO authenticated
WITH CHECK (
  user_id = get_effective_owner_id(auth.uid())
  AND (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'::text))
);