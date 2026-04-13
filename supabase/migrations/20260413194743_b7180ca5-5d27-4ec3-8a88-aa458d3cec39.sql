-- Fix 1: Update lead_activities RLS policies to support team members with leads permission

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view activities for own leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can create activities for own leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can update activities for own leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can delete activities for own leads" ON public.lead_activities;

-- Recreate with team member support
CREATE POLICY "Users and team members can view lead activities"
ON public.lead_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR has_team_permission(auth.uid(), leads.user_id, 'leads'))
  )
);

CREATE POLICY "Users and team members can create lead activities"
ON public.lead_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR has_team_permission(auth.uid(), leads.user_id, 'leads'))
  )
);

CREATE POLICY "Users and team members can update lead activities"
ON public.lead_activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR has_team_permission(auth.uid(), leads.user_id, 'leads'))
  )
);

CREATE POLICY "Users and team members can delete lead activities"
ON public.lead_activities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR has_team_permission(auth.uid(), leads.user_id, 'leads'))
  )
);

-- Fix 2: Make location-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'location-photos';

-- Drop the old public SELECT policy
DROP POLICY IF EXISTS "Anyone can view location photos" ON storage.objects;

-- Create authenticated SELECT policy scoped to owner
CREATE POLICY "Authenticated users can view own location photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'location-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);