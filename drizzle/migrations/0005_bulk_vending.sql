CREATE TABLE public.bulk_racks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Rack',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bulk_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rack_id uuid NOT NULL REFERENCES public.bulk_racks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0
);
CREATE TABLE public.bulk_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier_id uuid NOT NULL REFERENCES public.bulk_tiers(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  machine_type text NOT NULL DEFAULT '1in_capsule' CHECK (machine_type IN ('2in_capsule','1in_capsule','loose_candy','bouncy_ball')),
  product_name text,
  vend_price numeric NOT NULL DEFAULT 0.50,
  fill_percent integer NOT NULL DEFAULT 100 CHECK (fill_percent BETWEEN 0 AND 100),
  capacity integer,
  last_restocked_at timestamptz,
  nayax_device_id text
);
CREATE INDEX ON public.bulk_racks(location_id);
CREATE INDEX ON public.bulk_tiers(rack_id);
CREATE INDEX ON public.bulk_machines(tier_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_racks, public.bulk_tiers, public.bulk_machines TO authenticated;
GRANT ALL ON public.bulk_racks, public.bulk_tiers, public.bulk_machines TO service_role;

ALTER TABLE public.bulk_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk racks access" ON public.bulk_racks FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
WITH CHECK ((auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
  AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = bulk_racks.user_id));
CREATE POLICY "bulk tiers access" ON public.bulk_tiers FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
WITH CHECK ((auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
  AND EXISTS (SELECT 1 FROM public.bulk_racks r WHERE r.id = rack_id AND r.user_id = bulk_tiers.user_id));
CREATE POLICY "bulk machines access" ON public.bulk_machines FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
WITH CHECK ((auth.uid() = user_id OR public.has_team_permission(auth.uid(), user_id, 'locations'))
  AND EXISTS (SELECT 1 FROM public.bulk_tiers t WHERE t.id = tier_id AND t.user_id = bulk_machines.user_id));