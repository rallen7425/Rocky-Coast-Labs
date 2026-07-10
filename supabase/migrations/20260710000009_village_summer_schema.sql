-- ============================================================
-- village_summer schema — Summer Village Life (Rocky Coast Guide family)
-- Matches Rocky Coast Guide/supabase/migrations/001_schema.sql + 002_rls.sql,
-- schema-qualified, moved from its standalone project.
-- Mixed access model: alerts are guest-readable (anon), everything else
-- needs real auth, writes need role=admin in JWT user_metadata.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS village_summer;

CREATE TABLE IF NOT EXISTS village_summer.alerts (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  severity    text not null default 'warning' check (severity in ('info', 'warning', 'emergency')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz
);

CREATE TABLE IF NOT EXISTS village_summer.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  date            date not null,
  time_start      time,
  time_end        time,
  is_onsite       boolean not null default true,
  venue           text,
  distance_miles  numeric(4,1),
  city            text,
  category        text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS village_summer.amenities (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text not null check (category in ('pool', 'amenity')),
  status           text not null default 'open' check (status in ('open', 'closed', 'maintenance')),
  hours_open       time,
  hours_close      time,
  location         text,
  notes            text,
  age_restriction  text,
  sort_order       int not null default 0
);

CREATE TABLE IF NOT EXISTS village_summer.content_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  body        text,
  updated_at  timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS village_summer.weather_cache (
  id              uuid primary key default gen_random_uuid(),
  fetched_at      timestamptz not null default now(),
  temp_f          numeric(4,1),
  feels_like_f    numeric(4,1),
  wind_mph        numeric(4,1),
  beach_status    text check (beach_status in ('Ideal', 'Fair', 'Poor')),
  next_tide_at    timestamptz,
  next_tide_type  text check (next_tide_type in ('Low', 'High'))
);

CREATE INDEX IF NOT EXISTS alerts_active_idx      ON village_summer.alerts  (is_active, expires_at);
CREATE INDEX IF NOT EXISTS events_date_idx        ON village_summer.events  (date, time_start) WHERE is_active;
CREATE INDEX IF NOT EXISTS amenities_category_idx ON village_summer.amenities (category, sort_order);
CREATE INDEX IF NOT EXISTS weather_fetched_idx    ON village_summer.weather_cache (fetched_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE village_summer.alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_summer.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_summer.amenities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_summer.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_summer.weather_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts: anyone can read active" ON village_summer.alerts;
CREATE POLICY "alerts: anyone can read active"
  ON village_summer.alerts FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "alerts: admin full access" ON village_summer.alerts;
CREATE POLICY "alerts: admin full access"
  ON village_summer.alerts FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "events: authenticated read active" ON village_summer.events;
CREATE POLICY "events: authenticated read active"
  ON village_summer.events FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "events: admin full access" ON village_summer.events;
CREATE POLICY "events: admin full access"
  ON village_summer.events FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "amenities: authenticated read" ON village_summer.amenities;
CREATE POLICY "amenities: authenticated read"
  ON village_summer.amenities FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "amenities: admin full access" ON village_summer.amenities;
CREATE POLICY "amenities: admin full access"
  ON village_summer.amenities FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "content_pages: authenticated read" ON village_summer.content_pages;
CREATE POLICY "content_pages: authenticated read"
  ON village_summer.content_pages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "content_pages: admin full access" ON village_summer.content_pages;
CREATE POLICY "content_pages: admin full access"
  ON village_summer.content_pages FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

DROP POLICY IF EXISTS "weather_cache: authenticated read" ON village_summer.weather_cache;
CREATE POLICY "weather_cache: authenticated read"
  ON village_summer.weather_cache FOR SELECT
  TO authenticated
  USING (true);
-- weather_cache is written only by an edge function via service_role, same as before

-- ── Grants ────────────────────────────────────────────────────────────────────
-- anon only needs alerts (guest mode); authenticated gets read on everything,
-- write is further restricted to admin by RLS above.

GRANT USAGE ON SCHEMA village_summer TO anon, authenticated, service_role;
GRANT SELECT ON village_summer.alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA village_summer TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA village_summer TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA village_summer GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA village_summer GRANT ALL ON TABLES TO service_role;
