
-- Fix 1: Make storage policies for location-photos use 'authenticated' role only
-- Drop and recreate INSERT/DELETE/UPDATE policies scoped to authenticated

-- location-photos INSERT
DROP POLICY IF EXISTS "Users can upload location photos" ON storage.objects;
CREATE POLICY "Users can upload location photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- location-photos DELETE
DROP POLICY IF EXISTS "Users can delete own location photos" ON storage.objects;
CREATE POLICY "Users can delete own location photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'location-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- location-photos UPDATE
DROP POLICY IF EXISTS "Users can update own location photos" ON storage.objects;
CREATE POLICY "Users can update own location photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'location-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Also fix receipts bucket policies to use authenticated role
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Add deterministic ORDER BY to get_effective_owner_id
CREATE OR REPLACE FUNCTION public.get_effective_owner_id(current_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_user_id FROM public.team_members 
     WHERE member_user_id = current_user_id 
     AND status = 'active' 
     ORDER BY created_at ASC
     LIMIT 1),
    current_user_id
  )
$$;
