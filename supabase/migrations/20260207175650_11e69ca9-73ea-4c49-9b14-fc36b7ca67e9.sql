-- Phase 2: Add commission paid tracking columns
ALTER TABLE public.commission_summaries 
ADD COLUMN IF NOT EXISTS commission_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz;

-- Phase 3: Add created_by_user_id for attribution tracking on key tables
ALTER TABLE public.revenue_entries 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.lead_activities 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.mileage_entries 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.maintenance_reports 
ADD COLUMN IF NOT EXISTS resolved_by_user_id uuid REFERENCES auth.users(id);

-- Create get_effective_owner_id function for team data sharing
CREATE OR REPLACE FUNCTION public.get_effective_owner_id(current_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_user_id FROM public.team_members 
     WHERE member_user_id = current_user_id 
     AND status = 'active' 
     LIMIT 1),
    current_user_id
  )
$$;

-- Phase 4: Add new team roles to the enum
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'route_driver';
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'inventory_clerk';
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'sales_manager';

-- Add can_view_mileage permission for Route Driver role
ALTER TABLE public.team_member_permissions 
ADD COLUMN IF NOT EXISTS can_view_mileage boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_assign_tasks boolean DEFAULT false;