-- Add custom_label column to location_machines table
ALTER TABLE public.location_machines 
ADD COLUMN custom_label text;