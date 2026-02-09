
CREATE TABLE public.complimentary_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by text,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.complimentary_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own complimentary access"
ON public.complimentary_access
FOR SELECT
USING (auth.uid() = user_id);
