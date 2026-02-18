
-- Create route_runs table for persisting in-progress route runs
CREATE TABLE public.route_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  route_id uuid NOT NULL REFERENCES public.mileage_routes(id) ON DELETE CASCADE,
  mileage_entry_id uuid REFERENCES public.mileage_entries(id) ON DELETE SET NULL,
  current_stop_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  stop_data jsonb DEFAULT '[]'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.route_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only CRUD their own rows
CREATE POLICY "Users can view their own route runs"
  ON public.route_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own route runs"
  ON public.route_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own route runs"
  ON public.route_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own route runs"
  ON public.route_runs FOR DELETE
  USING (auth.uid() = user_id);
