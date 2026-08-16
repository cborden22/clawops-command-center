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
    AND length(portal_token_input) >= 16
  LIMIT 1
$$;