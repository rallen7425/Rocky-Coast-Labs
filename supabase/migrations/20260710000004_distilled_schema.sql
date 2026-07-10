-- ============================================================
-- Distilled schema — matches distilled/CLAUDE.md's table definitions,
-- moved from its standalone project into the shared platform.
-- Unlike sonicradar, this app requires auth for everything (no public
-- read) — see middleware.ts — so anon gets no grants at all here.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS distilled;

CREATE TABLE IF NOT EXISTS distilled.users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  zip_code     text,
  display_name text,
  industry     text,
  created_at   timestamptz default now()
);

CREATE TABLE IF NOT EXISTS distilled.zones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references distilled.users(id) on delete cascade,
  type        text not null,
  template_id text,
  config      jsonb default '{}',
  position    int default 0,
  enabled     boolean default true,
  created_at  timestamptz default now()
);

CREATE TABLE IF NOT EXISTS distilled.articles (
  id             uuid primary key default gen_random_uuid(),
  external_id    text unique not null,
  headline       text not null,
  summary        text,
  image_url      text,
  source_name    text,
  source_url     text,
  published_at   timestamptz,
  urgency_score  int default 1,
  zone_type      text,
  tags           jsonb default '[]',
  created_at     timestamptz default now()
);

CREATE TABLE IF NOT EXISTS distilled.user_saves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references distilled.users(id) on delete cascade,
  article_id uuid references distilled.articles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

CREATE TABLE IF NOT EXISTS distilled.user_tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references distilled.users(id) on delete cascade,
  topic       text not null,
  zone_id     uuid references distilled.zones(id) on delete set null,
  deadline_at timestamptz,
  created_at  timestamptz default now()
);

CREATE TABLE IF NOT EXISTS distilled.zone_quicklook (
  id         uuid primary key default gen_random_uuid(),
  zone_type  text not null,
  label      text not null,
  value      text not null,
  sub        text,
  position   int default 0,
  updated_at timestamptz default now(),
  unique(zone_type, label)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE distilled.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE distilled.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE distilled.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE distilled.user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE distilled.user_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE distilled.zone_quicklook ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own row only" ON distilled.users;
CREATE POLICY "Own row only" ON distilled.users
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Own zones only" ON distilled.zones;
CREATE POLICY "Own zones only" ON distilled.zones
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own saves only" ON distilled.user_saves;
CREATE POLICY "Own saves only" ON distilled.user_saves
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own tracks only" ON distilled.user_tracks;
CREATE POLICY "Own tracks only" ON distilled.user_tracks
  FOR ALL USING (auth.uid() = user_id);

-- Articles/quicklook: readable by any authenticated user, writes only via
-- service_role (the pipeline) — no insert/update/delete policy for
-- `authenticated` means RLS default-denies those, even though the GRANT
-- below is broad.
DROP POLICY IF EXISTS "Authenticated read" ON distilled.articles;
CREATE POLICY "Authenticated read" ON distilled.articles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated read" ON distilled.zone_quicklook;
CREATE POLICY "Authenticated read" ON distilled.zone_quicklook
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Grants ────────────────────────────────────────────────────────────────────
-- No anon access at all — this app requires sign-in for everything.

GRANT USAGE ON SCHEMA distilled TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA distilled TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA distilled TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA distilled GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA distilled GRANT ALL ON TABLES TO service_role;
