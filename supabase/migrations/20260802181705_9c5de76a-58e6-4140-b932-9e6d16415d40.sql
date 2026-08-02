ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS geofence_radius_m integer NOT NULL DEFAULT 150;

ALTER TABLE public.team_member_permissions
  ADD COLUMN IF NOT EXISTS photo_verification text NOT NULL DEFAULT 'none';

ALTER TABLE public.team_member_permissions
  ADD CONSTRAINT team_member_permissions_photo_verification_check
  CHECK (photo_verification IN ('none', 'per_stop', 'per_machine'));

CREATE TABLE public.collection_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  machine_id uuid REFERENCES public.location_machines(id) ON DELETE SET NULL,
  route_run_id uuid REFERENCES public.route_runs(id) ON DELETE SET NULL,
  stop_index integer,
  storage_path text NOT NULL,
  taken_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_photos TO authenticated;
GRANT ALL ON public.collection_photos TO service_role;

ALTER TABLE public.collection_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their collection photos"
ON public.collection_photos FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team members can view collection photos"
ON public.collection_photos FOR SELECT TO authenticated
USING (user_id = public.get_effective_owner_id(auth.uid()));

CREATE POLICY "Team members can add collection photos"
ON public.collection_photos FOR INSERT TO authenticated
WITH CHECK (
  user_id = public.get_effective_owner_id(auth.uid())
  AND taken_by_user_id = auth.uid()
  AND public.has_team_permission(auth.uid(), user_id, 'revenue')
);

CREATE INDEX idx_collection_photos_location ON public.collection_photos(location_id);
CREATE INDEX idx_collection_photos_run ON public.collection_photos(route_run_id);