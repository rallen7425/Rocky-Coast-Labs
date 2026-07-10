-- ============================================================
-- Rocky Coast Labs shared Supabase project
-- Schema: sonicradar (Sonic Radar app) + _meta (portfolio tracking)
-- ============================================================

-- ── sonicradar ────────────────────────────────────────────────────────────────
-- Same table definition as the original standalone project's setup/schema.sql,
-- just under its own schema instead of public.

CREATE SCHEMA IF NOT EXISTS sonicradar;

CREATE TABLE IF NOT EXISTS sonicradar.albums (
    id              BIGSERIAL PRIMARY KEY,

    artist          TEXT        NOT NULL,
    album           TEXT        NOT NULL,
    year            INTEGER,
    decade          TEXT,

    genre           TEXT,
    subgenres       TEXT,

    on_acclaimed_music  BOOLEAN     DEFAULT FALSE,
    on_rym              BOOLEAN     DEFAULT FALSE,
    on_rolling_stone    BOOLEAN     DEFAULT FALSE,
    am_rank             INTEGER,
    rym_rank            INTEGER,
    rs_rank             INTEGER,
    sources             TEXT,

    artwork_url         TEXT,
    musicbrainz_id      TEXT,

    ai_summary          TEXT,

    pitchfork_url       TEXT,
    allmusic_url        TEXT,
    rym_url             TEXT,
    metacritic_url      TEXT,
    rolling_stone_url   TEXT,

    artwork_verified    BOOLEAN     DEFAULT FALSE,
    summary_verified    BOOLEAN     DEFAULT FALSE,
    reviews_verified    BOOLEAN     DEFAULT FALSE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (artist, album)
);

CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_year    ON sonicradar.albums (year);
CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_decade  ON sonicradar.albums (decade);
CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_genre   ON sonicradar.albums (genre);
CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_am_rank ON sonicradar.albums (am_rank) WHERE am_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_rym_rank ON sonicradar.albums (rym_rank) WHERE rym_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sonicradar_albums_fts ON sonicradar.albums
    USING gin(to_tsvector('english', coalesce(artist, '') || ' ' || coalesce(album, '')));

CREATE OR REPLACE FUNCTION sonicradar.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS albums_updated_at ON sonicradar.albums;
CREATE TRIGGER albums_updated_at
    BEFORE UPDATE ON sonicradar.albums
    FOR EACH ROW
    EXECUTE FUNCTION sonicradar.update_updated_at();

ALTER TABLE sonicradar.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON sonicradar.albums;
CREATE POLICY "Public read access"
    ON sonicradar.albums FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated write access" ON sonicradar.albums;
CREATE POLICY "Authenticated write access"
    ON sonicradar.albums FOR ALL
    USING (auth.role() = 'authenticated');

CREATE OR REPLACE VIEW sonicradar.album_browse AS
SELECT
    id, artist, album, year, decade, genre, subgenres, artwork_url,
    am_rank, rym_rank, rs_rank, sources,
    CASE WHEN ai_summary IS NOT NULL THEN true ELSE false END AS has_summary,
    CASE WHEN artwork_url IS NOT NULL THEN true ELSE false END AS has_artwork
FROM sonicradar.albums
ORDER BY COALESCE(am_rank, 9999), COALESCE(rym_rank, 9999);

-- ── _meta ─────────────────────────────────────────────────────────────────────
-- Cross-app tracking so portfolio-wide status is visible without checking
-- 5 different Supabase/Vercel/GitHub dashboards.

CREATE SCHEMA IF NOT EXISTS _meta;

CREATE TABLE IF NOT EXISTS _meta.apps (
    name             TEXT PRIMARY KEY,
    schema_name      TEXT,
    vercel_project   TEXT,
    github_repo      TEXT,
    stage            TEXT NOT NULL DEFAULT 'prototype', -- 'prototype' | 'active' | 'retired'
    supabase_status  TEXT,                              -- which Supabase project it's on today
    notes            TEXT,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE _meta.apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON _meta.apps;
CREATE POLICY "Public read access"
    ON _meta.apps FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated write access" ON _meta.apps;
CREATE POLICY "Authenticated write access"
    ON _meta.apps FOR ALL
    USING (auth.role() = 'authenticated');
