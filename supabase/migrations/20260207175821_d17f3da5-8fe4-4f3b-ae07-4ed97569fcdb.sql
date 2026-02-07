-- Update has_team_permission function to include mileage permission
CREATE OR REPLACE FUNCTION public.has_team_permission(checking_user_id uuid, owner_id uuid, permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.team_members tm
    INNER JOIN public.team_member_permissions p ON p.team_member_id = tm.id
    WHERE tm.member_user_id = checking_user_id
      AND tm.owner_user_id = owner_id
      AND tm.status = 'active'
      AND (
        (permission_name = 'locations' AND p.can_view_locations = true) OR
        (permission_name = 'maintenance' AND p.can_view_maintenance = true) OR
        (permission_name = 'revenue' AND p.can_view_revenue = true) OR
        (permission_name = 'inventory' AND p.can_view_inventory = true) OR
        (permission_name = 'leads' AND p.can_view_leads = true) OR
        (permission_name = 'reports' AND p.can_view_reports = true) OR
        (permission_name = 'documents' AND p.can_view_documents = true) OR
        (permission_name = 'mileage' AND p.can_view_mileage = true)
      )
  )
$$;