
-- Create inventory_location_type enum
CREATE TYPE public.inventory_location_type AS ENUM ('warehouse', 'business_location');

-- Create inventory_locations table
CREATE TABLE public.inventory_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  location_type inventory_location_type NOT NULL DEFAULT 'warehouse',
  code TEXT,
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on user_id + code where code is not null
CREATE UNIQUE INDEX idx_inventory_locations_user_code ON public.inventory_locations (user_id, code) WHERE code IS NOT NULL;

-- Enable RLS
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users and team members can view inventory locations"
  ON public.inventory_locations FOR SELECT
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can create inventory locations"
  ON public.inventory_locations FOR INSERT
  WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can update inventory locations"
  ON public.inventory_locations FOR UPDATE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can delete inventory locations"
  ON public.inventory_locations FOR DELETE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

-- Updated_at trigger
CREATE TRIGGER update_inventory_locations_updated_at
  BEFORE UPDATE ON public.inventory_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
