-- Add new columns for enhanced inventory item tracking
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS supplier_url text,
ADD COLUMN IF NOT EXISTS supplier_name text,
ADD COLUMN IF NOT EXISTS last_price decimal(10,2),
ADD COLUMN IF NOT EXISTS price_per_item decimal(10,4),
ADD COLUMN IF NOT EXISTS notes text;