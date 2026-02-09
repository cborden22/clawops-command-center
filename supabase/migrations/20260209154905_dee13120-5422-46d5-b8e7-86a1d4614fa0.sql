
-- Add qr_logo_url column to profiles
ALTER TABLE public.profiles ADD COLUMN qr_logo_url text;

-- Create qr-logos storage bucket (public so URLs work in print windows)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-logos', 'qr-logos', true);

-- RLS: anyone can view logos (public bucket)
CREATE POLICY "QR logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-logos');

-- RLS: users can upload their own logos (folder = their user id)
CREATE POLICY "Users can upload their own QR logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qr-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can update their own logos
CREATE POLICY "Users can update their own QR logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can delete their own logos
CREATE POLICY "Users can delete their own QR logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
