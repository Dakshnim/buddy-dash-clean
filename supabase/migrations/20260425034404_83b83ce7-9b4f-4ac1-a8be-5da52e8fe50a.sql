
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Make bucket private; we'll use signed/public URLs explicitly via getPublicUrl
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Allow read only for owner (listing). Public read by URL still works because bucket is public.
CREATE POLICY "Owners can list own avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
