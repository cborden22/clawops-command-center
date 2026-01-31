-- Create maintenance_reports table
CREATE TABLE public.maintenance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES public.location_machines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  issue_type TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;

-- Function to get machine owner (for public insert)
CREATE OR REPLACE FUNCTION public.get_machine_owner(machine_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.user_id
  FROM public.locations l
  INNER JOIN public.location_machines lm ON lm.location_id = l.id
  WHERE lm.id = machine_uuid
  LIMIT 1
$$;

-- Function to get minimal machine info for public display
CREATE OR REPLACE FUNCTION public.get_machine_public_info(machine_uuid UUID)
RETURNS TABLE(machine_type TEXT, custom_label TEXT, location_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lm.machine_type, lm.custom_label, l.name as location_name
  FROM public.location_machines lm
  INNER JOIN public.locations l ON lm.location_id = l.id
  WHERE lm.id = machine_uuid
  LIMIT 1
$$;

-- Public can insert (for customer reports) - user_id must match machine owner
CREATE POLICY "Anyone can create reports for valid machines"
  ON public.maintenance_reports FOR INSERT
  WITH CHECK (user_id = public.get_machine_owner(machine_id));

-- Only owner can view their reports
CREATE POLICY "Users can view own reports"
  ON public.maintenance_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Only owner can update their reports
CREATE POLICY "Users can update own reports"
  ON public.maintenance_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owner can delete their reports
CREATE POLICY "Users can delete own reports"
  ON public.maintenance_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_maintenance_reports_user_status ON public.maintenance_reports(user_id, status);
CREATE INDEX idx_maintenance_reports_machine ON public.maintenance_reports(machine_id);