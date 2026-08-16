CREATE OR REPLACE FUNCTION public.get_location_portal(portal_token_input text)
RETURNS TABLE(location_id uuid, location_name text, address text, machines jsonb)
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
          'id', lm.id,
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
    AND length(portal_token_input) >= 12
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_location_portal_statements(portal_token_input text)
RETURNS TABLE(id uuid, start_date date, end_date date, total_revenue numeric, commission_percentage numeric, commission_amount numeric, machine_count integer, commission_paid boolean, commission_paid_at timestamp with time zone, created_at timestamp with time zone)
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
    AND length(portal_token_input) >= 12
  ORDER BY cs.end_date DESC
  LIMIT 24
$$;