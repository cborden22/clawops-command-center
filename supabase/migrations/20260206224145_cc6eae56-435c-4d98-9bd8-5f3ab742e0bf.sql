-- Phase 1: Add email notification preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Phase 2: Create team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'manager', 'technician');

-- Phase 2: Create team_members table (stores relationships between owners and their team)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  member_user_id uuid,
  role team_role NOT NULL DEFAULT 'technician',
  status text NOT NULL DEFAULT 'pending',
  invited_email text NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(owner_user_id, invited_email)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Owners can view their team members"
ON public.team_members FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their membership"
ON public.team_members FOR SELECT
USING (auth.uid() = member_user_id);

CREATE POLICY "Owners can create team members"
ON public.team_members FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their team members"
ON public.team_members FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their team members"
ON public.team_members FOR DELETE
USING (auth.uid() = owner_user_id);

-- Phase 2: Create team_member_permissions table
CREATE TABLE public.team_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  can_view_revenue boolean DEFAULT false,
  can_view_inventory boolean DEFAULT true,
  can_view_locations boolean DEFAULT true,
  can_view_maintenance boolean DEFAULT true,
  can_manage_maintenance boolean DEFAULT true,
  can_view_leads boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_view_documents boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on team_member_permissions
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_member_permissions (owners can manage, members can view their own)
CREATE POLICY "Owners can view team member permissions"
ON public.team_member_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own permissions"
ON public.team_member_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.member_user_id = auth.uid()
  )
);

CREATE POLICY "Owners can create team member permissions"
ON public.team_member_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update team member permissions"
ON public.team_member_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete team member permissions"
ON public.team_member_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.owner_user_id = auth.uid()
  )
);

-- Phase 2: Create task_assignments table
CREATE TABLE public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  assignee_user_id uuid NOT NULL,
  maintenance_report_id uuid REFERENCES public.maintenance_reports(id) ON DELETE CASCADE,
  title text,
  description text,
  priority text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_assignments
CREATE POLICY "Owners can view their task assignments"
ON public.task_assignments FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Assignees can view their tasks"
ON public.task_assignments FOR SELECT
USING (auth.uid() = assignee_user_id);

CREATE POLICY "Owners can create task assignments"
ON public.task_assignments FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their task assignments"
ON public.task_assignments FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Assignees can update their assigned tasks"
ON public.task_assignments FOR UPDATE
USING (auth.uid() = assignee_user_id);

CREATE POLICY "Owners can delete their task assignments"
ON public.task_assignments FOR DELETE
USING (auth.uid() = owner_user_id);

-- Phase 2: Security definer functions for role and permission checking
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
        (permission_name = 'documents' AND p.can_view_documents = true)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.get_team_role(checking_user_id uuid, owner_id uuid)
RETURNS team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE member_user_id = checking_user_id
    AND owner_user_id = owner_id
    AND status = 'active'
  LIMIT 1
$$;

-- Phase 2: Add RLS policies for team members to access owner's data

-- Locations: Team members can view if they have permission
CREATE POLICY "Team members can view owner locations"
ON public.locations FOR SELECT
USING (
  public.has_team_permission(auth.uid(), user_id, 'locations')
);

-- Maintenance reports: Team members can view/manage if they have permission
CREATE POLICY "Team members can view owner maintenance reports"
ON public.maintenance_reports FOR SELECT
USING (
  public.has_team_permission(auth.uid(), user_id, 'maintenance')
);

CREATE POLICY "Team members can update owner maintenance reports"
ON public.maintenance_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    INNER JOIN public.team_member_permissions p ON p.team_member_id = tm.id
    WHERE tm.member_user_id = auth.uid()
      AND tm.owner_user_id = maintenance_reports.user_id
      AND tm.status = 'active'
      AND p.can_manage_maintenance = true
  )
);

-- Location machines: Team members can view if they can view locations
CREATE POLICY "Team members can view owner location machines"
ON public.location_machines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_machines.location_id
    AND public.has_team_permission(auth.uid(), l.user_id, 'locations')
  )
);

-- Revenue entries: Team members can view if they have permission
CREATE POLICY "Team members can view owner revenue entries"
ON public.revenue_entries FOR SELECT
USING (
  public.has_team_permission(auth.uid(), user_id, 'revenue')
);

-- Inventory items: Team members can view if they have permission
CREATE POLICY "Team members can view owner inventory"
ON public.inventory_items FOR SELECT
USING (
  public.has_team_permission(auth.uid(), user_id, 'inventory')
);

-- Leads: Team members can view if they have permission
CREATE POLICY "Team members can view owner leads"
ON public.leads FOR SELECT
USING (
  public.has_team_permission(auth.uid(), user_id, 'leads')
);

-- Function to activate team member when they sign up with matching email
CREATE OR REPLACE FUNCTION public.activate_team_member_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.team_members
  SET member_user_id = NEW.id,
      status = 'active',
      accepted_at = now(),
      updated_at = now()
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND member_user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger to auto-activate team members on signup
CREATE TRIGGER on_auth_user_created_activate_team
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_team_member_on_signup();