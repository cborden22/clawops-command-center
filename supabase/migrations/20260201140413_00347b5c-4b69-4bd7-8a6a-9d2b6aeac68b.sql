-- Add collection schedule columns to locations table
ALTER TABLE public.locations
ADD COLUMN collection_frequency_days integer,
ADD COLUMN last_collection_date timestamp with time zone;

-- Add route schedule columns to mileage_routes table
ALTER TABLE public.mileage_routes
ADD COLUMN schedule_frequency_days integer,
ADD COLUMN schedule_day_of_week integer,
ADD COLUMN next_scheduled_date date;

-- Create user_schedules table for restock and other user-defined schedules
CREATE TABLE public.user_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  schedule_type text NOT NULL,
  frequency_days integer,
  day_of_week integer,
  last_completed_date timestamp with time zone,
  next_scheduled_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_schedules
ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_schedules
CREATE POLICY "Users can view own schedules"
ON public.user_schedules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedules"
ON public.user_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
ON public.user_schedules
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
ON public.user_schedules
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on user_schedules
CREATE TRIGGER update_user_schedules_updated_at
BEFORE UPDATE ON public.user_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();