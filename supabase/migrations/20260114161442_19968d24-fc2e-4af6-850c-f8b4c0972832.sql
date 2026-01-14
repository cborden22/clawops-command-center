-- Add win_probability column to location_machines table
-- Stored as "1 in X" format (e.g., 15 means 1 in 15 odds)
ALTER TABLE location_machines 
ADD COLUMN win_probability numeric DEFAULT NULL;

-- Create machine_collections table to track collection metrics
CREATE TABLE public.machine_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.location_machines(id) ON DELETE CASCADE,
  revenue_entry_id uuid REFERENCES public.revenue_entries(id) ON DELETE SET NULL,
  collection_date timestamp with time zone NOT NULL DEFAULT now(),
  coins_inserted integer NOT NULL DEFAULT 0,
  prizes_won integer NOT NULL DEFAULT 0,
  meter_reading_start integer,
  meter_reading_end integer,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on machine_collections
ALTER TABLE public.machine_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for machine_collections
-- Users can only see their own collection records
CREATE POLICY "Users can view their own machine collections"
ON public.machine_collections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own collection records
CREATE POLICY "Users can create their own machine collections"
ON public.machine_collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own collection records
CREATE POLICY "Users can update their own machine collections"
ON public.machine_collections
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own collection records
CREATE POLICY "Users can delete their own machine collections"
ON public.machine_collections
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_machine_collections_user_id ON public.machine_collections(user_id);
CREATE INDEX idx_machine_collections_machine_id ON public.machine_collections(machine_id);
CREATE INDEX idx_machine_collections_location_id ON public.machine_collections(location_id);