-- Add packaging configuration columns to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN package_type text DEFAULT 'Case',
ADD COLUMN package_quantity integer DEFAULT 24;