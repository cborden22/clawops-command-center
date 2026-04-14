
-- Fix: Restrict listing on qr-logos bucket to authenticated users' own folder
-- Public read of individual files is still allowed by the bucket being public,
-- but the SELECT policy on storage.objects controls listing.

-- Drop any existing broad SELECT policy for qr-logos
DROP POLICY IF EXISTS "QR logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view qr logos" ON storage.objects;

-- Create scoped SELECT policy: authenticated users can only list their own folder
CREATE POLICY "Users can list own qr logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'qr-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
