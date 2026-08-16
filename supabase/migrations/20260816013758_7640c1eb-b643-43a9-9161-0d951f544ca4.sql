ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS portal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_token text;

CREATE UNIQUE INDEX IF NOT EXISTS locations_portal_token_key
  ON public.locations (portal_token) WHERE portal_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_location_portal(portal_token_input text)
RETURNS TABLE(
  location_id uuid,
  location_name text,
  address text,
  machines jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    l.id,
    l.name,
    l.address,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'machine_type', lm.machine_type,
          'custom_label', lm.custom_label,
          'count', lm.count,
          'unit_code', lm.unit_code
        ) ORDER BY lm.machine_type)
       FROM public.location_machines lm
       WHERE lm.location_id = l.id),
      '[]'::jsonb
    )
  FROM public.locations l
  WHERE l.portal_token = portal_token_input
    AND l.portal_enabled = true
    AND portal_token_input IS NOT NULL
    AND length(portal_token_input) >= 16
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_location_portal_statements(portal_token_input text)
RETURNS TABLE(
  id uuid,
  start_date date,
  end_date date,
  total_revenue numeric,
  commission_percentage numeric,
  commission_amount numeric,
  machine_count integer,
  commission_paid boolean,
  commission_paid_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cs.id,
    cs.start_date,
    cs.end_date,
    cs.total_revenue,
    cs.commission_percentage,
    cs.commission_amount,
    cs.machine_count,
    cs.commission_paid,
    cs.commission_paid_at,
    cs.created_at
  FROM public.commission_summaries cs
  INNER JOIN public.locations l ON l.id = cs.location_id
  WHERE l.portal_token = portal_token_input
    AND l.portal_enabled = true
    AND portal_token_input IS NOT NULL
    AND length(portal_token_input) >= 16
  ORDER BY cs.end_date DESC
  LIMIT 24
$$;

GRANT EXECUTE ON FUNCTION public.get_location_portal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_portal_statements(text) TO anon, authenticated;