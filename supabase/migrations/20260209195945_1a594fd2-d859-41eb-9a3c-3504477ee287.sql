CREATE TABLE public.custom_machine_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type_key text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type_key)
);

ALTER TABLE public.custom_machine_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own machine types"
  ON public.custom_machine_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);