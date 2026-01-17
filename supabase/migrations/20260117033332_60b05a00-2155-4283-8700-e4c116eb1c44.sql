-- Add cost per play column to location_machines
ALTER TABLE location_machines 
ADD COLUMN cost_per_play numeric DEFAULT 0.50;