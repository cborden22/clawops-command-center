-- Add slug column to locations
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS slug text;

-- Add unit_code column to location_machines
ALTER TABLE public.location_machines
ADD COLUMN IF NOT EXISTS unit_code text;

-- Generate slugs for existing locations
UPDATE public.locations
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Generate unit codes for existing machines
WITH numbered AS (
  SELECT 
    id,
    lower(machine_type) || '-' || ROW_NUMBER() OVER (
      PARTITION BY location_id, machine_type 
      ORDER BY id
    ) as generated_code
  FROM public.location_machines
)
UPDATE public.location_machines lm
SET unit_code = n.generated_code
FROM numbered n
WHERE lm.id = n.id AND lm.unit_code IS NULL;

-- Create function to get machine by slug (public, no auth required)
CREATE OR REPLACE FUNCTION public.get_machine_by_slug(
  location_slug text,
  machine_unit_code text
)
RETURNS TABLE(
  machine_id uuid,
  machine_type text,
  custom_label text,
  location_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lm.id, lm.machine_type, lm.custom_label, l.name
  FROM public.location_machines lm
  INNER JOIN public.locations l ON lm.location_id = l.id
  WHERE l.slug = location_slug
    AND lm.unit_code = machine_unit_code
  LIMIT 1
$$;