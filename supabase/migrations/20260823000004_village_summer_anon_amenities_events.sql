-- ============================================================
-- Guests (anon) could not read amenities or events — same gap already
-- fixed for weather_cache in 20260823000003. Both were granted to
-- `authenticated` only, so guest sessions see an empty Pools/Amenities
-- list on /village and "No events match this filter" on /events.
-- EventsScroll's STATIC_EVENTS fallback masked the events half of this
-- on the Home screen by silently substituting fake data — see the
-- companion frontend fix removing that fallback.
-- ============================================================

DROP POLICY IF EXISTS "amenities: authenticated read" ON village_summer.amenities;
CREATE POLICY "amenities: anyone can read"
  ON village_summer.amenities FOR SELECT
  USING (true);
GRANT SELECT ON village_summer.amenities TO anon;

DROP POLICY IF EXISTS "events: authenticated read active" ON village_summer.events;
CREATE POLICY "events: anyone can read active"
  ON village_summer.events FOR SELECT
  USING (is_active = true);
GRANT SELECT ON village_summer.events TO anon;
