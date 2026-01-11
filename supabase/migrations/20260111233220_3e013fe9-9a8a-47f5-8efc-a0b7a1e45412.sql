-- Fix missing RLS policies for warn-level security issues

-- 1. Add UPDATE policy for location_agreements table
CREATE POLICY "Users can update own location agreements" ON public.location_agreements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_agreements.location_id AND locations.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_agreements.location_id AND locations.user_id = auth.uid())
  );

-- 2. Add DELETE policy for user_preferences table
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Add DELETE policy for profiles table
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);