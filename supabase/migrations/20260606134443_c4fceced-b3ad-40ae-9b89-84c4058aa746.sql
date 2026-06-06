
-- Anyone can read images (listings need public-facing display)
CREATE POLICY "Public read listings bucket" ON storage.objects FOR SELECT USING (bucket_id = 'listings');
CREATE POLICY "Public read reviews bucket" ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Public read avatars bucket" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload (path enforces ownership: first segment must be user id)
CREATE POLICY "Auth upload to listings" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth upload to reviews" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reviews' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth upload to avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Owners can update/delete their own files
CREATE POLICY "Owners manage listings files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete listings files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners manage reviews files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'reviews' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete reviews files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reviews' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners manage avatars files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete avatars files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
