-- Add missing UPDATE policy for commission_summaries table
-- This allows users to update commission summaries for locations they own

CREATE POLICY "Users can update own commission summaries" ON public.commission_summaries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = commission_summaries.location_id AND locations.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = commission_summaries.location_id AND locations.user_id = auth.uid())
  );