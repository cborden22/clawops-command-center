
-- Create zone_type enum
CREATE TYPE public.zone_type AS ENUM ('tote', 'shelf', 'bin', 'section', 'other');

-- Create warehouses table
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip text,
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and team members can view warehouses"
  ON public.warehouses FOR SELECT
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can create warehouses"
  ON public.warehouses FOR INSERT
  WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can update warehouses"
  ON public.warehouses FOR UPDATE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can delete warehouses"
  ON public.warehouses FOR DELETE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

-- Create warehouse_zones table
CREATE TABLE public.warehouse_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name text NOT NULL,
  zone_type public.zone_type NOT NULL DEFAULT 'tote',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and team members can view warehouse zones"
  ON public.warehouse_zones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = warehouse_zones.warehouse_id
    AND (w.user_id = auth.uid() OR has_team_permission(auth.uid(), w.user_id, 'inventory'))
  ));

CREATE POLICY "Users and team members can create warehouse zones"
  ON public.warehouse_zones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = warehouse_zones.warehouse_id
    AND (w.user_id = auth.uid() OR has_team_permission(auth.uid(), w.user_id, 'inventory'))
  ));

CREATE POLICY "Users and team members can update warehouse zones"
  ON public.warehouse_zones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = warehouse_zones.warehouse_id
    AND (w.user_id = auth.uid() OR has_team_permission(auth.uid(), w.user_id, 'inventory'))
  ));

CREATE POLICY "Users and team members can delete warehouse zones"
  ON public.warehouse_zones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = warehouse_zones.warehouse_id
    AND (w.user_id = auth.uid() OR has_team_permission(auth.uid(), w.user_id, 'inventory'))
  ));

-- Add warehouse_id and zone_id to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN zone_id uuid REFERENCES public.warehouse_zones(id) ON DELETE SET NULL;
