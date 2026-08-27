CREATE POLICY "artifacts read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'isabella-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "artifacts insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'isabella-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "artifacts delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'isabella-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);