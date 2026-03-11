-- Fix location-photos storage policies: scope to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

CREATE POLICY "Users can upload their own location photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'location-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own location photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'location-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]);