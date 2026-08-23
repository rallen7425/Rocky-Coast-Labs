-- ============================================================
-- Security fix: admin role was stored in user_metadata, which any
-- signed-in user can self-edit via supabase.auth.updateUser(). RLS
-- policies trusted that same field, letting any renter self-promote
-- to admin. Move the role check to app_metadata, which only a
-- service-role/server-side call (or, as here, a migration with
-- direct DB access) can write.
-- ============================================================

-- Backfill: carry over role='admin' for whichever account(s) currently
-- hold it in user_metadata, so admin access isn't lost by this change.
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
WHERE raw_user_meta_data ->> 'role' = 'admin';

DROP POLICY IF EXISTS "alerts: admin full access" ON village_summer.alerts;
CREATE POLICY "alerts: admin full access"
  ON village_summer.alerts FOR ALL
  USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "events: admin full access" ON village_summer.events;
CREATE POLICY "events: admin full access"
  ON village_summer.events FOR ALL
  USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "amenities: admin full access" ON village_summer.amenities;
CREATE POLICY "amenities: admin full access"
  ON village_summer.amenities FOR ALL
  USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "content_pages: admin full access" ON village_summer.content_pages;
CREATE POLICY "content_pages: admin full access"
  ON village_summer.content_pages FOR ALL
  USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');
