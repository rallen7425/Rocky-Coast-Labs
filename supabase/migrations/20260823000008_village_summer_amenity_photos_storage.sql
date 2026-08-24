-- Storage bucket for amenity detail-page photos. Created via SQL migration
-- (not supabase/config.toml) since `supabase config push` pushes the ENTIRE
-- local config, not a diff, and this is a shared project (see ARCHITECTURE.md).
--
-- storage.buckets/storage.objects are project-global, not schema-scoped like
-- village_summer — this shared Supabase project hosts other apps' buckets in
-- the same flat namespace, so the bucket id stays app-prefixed to avoid a
-- future collision, and every policy below is scoped by bucket_id so it
-- can't leak into another app's bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('village-summer-amenity-photos', 'village-summer-amenity-photos', true,
        5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "village-summer-amenity-photos: public read" ON storage.objects;
CREATE POLICY "village-summer-amenity-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'village-summer-amenity-photos');

DROP POLICY IF EXISTS "village-summer-amenity-photos: admin insert" ON storage.objects;
CREATE POLICY "village-summer-amenity-photos: admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'village-summer-amenity-photos'
    AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "village-summer-amenity-photos: admin update" ON storage.objects;
CREATE POLICY "village-summer-amenity-photos: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'village-summer-amenity-photos'
    AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK (bucket_id = 'village-summer-amenity-photos'
    AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "village-summer-amenity-photos: admin delete" ON storage.objects;
CREATE POLICY "village-summer-amenity-photos: admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'village-summer-amenity-photos'
    AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');
