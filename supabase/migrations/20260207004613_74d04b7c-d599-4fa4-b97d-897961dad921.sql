-- Add team permission policy for commission_summaries
CREATE POLICY "Team members can view owner commission summaries"
ON public.commission_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = commission_summaries.location_id
      AND has_team_permission(auth.uid(), l.user_id, 'locations')
  )
);

-- Add team permission policy for location_agreements  
CREATE POLICY "Team members can view owner location agreements"
ON public.location_agreements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_agreements.location_id
      AND has_team_permission(auth.uid(), l.user_id, 'locations')
  )
);