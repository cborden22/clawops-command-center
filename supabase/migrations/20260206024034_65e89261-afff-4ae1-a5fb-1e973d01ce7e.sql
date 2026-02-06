-- Add new columns for enhanced mileage tracking (GPS + in-progress trips)
ALTER TABLE mileage_entries
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS tracking_mode text DEFAULT 'odometer',
ADD COLUMN IF NOT EXISTS gps_distance_meters numeric,
ADD COLUMN IF NOT EXISTS gps_start_lat numeric,
ADD COLUMN IF NOT EXISTS gps_start_lng numeric,
ADD COLUMN IF NOT EXISTS gps_end_lat numeric,
ADD COLUMN IF NOT EXISTS gps_end_lng numeric,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add index for quickly finding in-progress trips
CREATE INDEX IF NOT EXISTS idx_mileage_entries_status ON mileage_entries(user_id, status) WHERE status = 'in_progress';