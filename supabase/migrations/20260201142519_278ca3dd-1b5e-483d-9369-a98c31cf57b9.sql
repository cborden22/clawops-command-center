-- Add restock day of week column to locations table
ALTER TABLE public.locations 
ADD COLUMN restock_day_of_week integer;