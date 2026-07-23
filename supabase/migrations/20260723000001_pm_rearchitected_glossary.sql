-- ============================================================
-- PM ReArchitected — AI Glossary schema
-- Public read-only content, no auth in this app (see _meta.apps notes),
-- so RLS follows sonicradar's public-read pattern, not distilled's.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS pm_rearchitected;

CREATE TABLE IF NOT EXISTS pm_rearchitected.categories (
  id_slug     text primary key,
  name        text not null,
  description text,
  sort_order  int not null
);

CREATE TABLE IF NOT EXISTS pm_rearchitected.terms (
  id_slug           text primary key,
  canonical_term    text not null,
  short_definition  text not null,
  long_definition   text not null,
  category_id       text not null references pm_rearchitected.categories(id_slug),
  priority          smallint not null check (priority between 1 and 5),
  classification    text not null check (classification in ('Technical','Non-Technical','Borderline')),
  status            text not null default 'active' check (status in ('active','deprecated')),
  alias_text_concat text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS pm_rearchitected.aliases (
  id          uuid primary key default gen_random_uuid(),
  term_id     text not null references pm_rearchitected.terms(id_slug) on delete cascade,
  alias_text  text not null,
  alias_type  text not null check (alias_type in ('synonym','deprecated_or_variant')),
  unique (term_id, alias_text)
);

CREATE TABLE IF NOT EXISTS pm_rearchitected.related_terms (
  term_id            text not null references pm_rearchitected.terms(id_slug) on delete cascade,
  related_term_id    text not null references pm_rearchitected.terms(id_slug) on delete cascade,
  relationship_type  text not null default 'see_also',
  primary key (term_id, related_term_id)
);

CREATE TABLE IF NOT EXISTS pm_rearchitected.sources (
  id          uuid primary key default gen_random_uuid(),
  term_id     text not null references pm_rearchitected.terms(id_slug) on delete cascade,
  source_name text not null,
  url         text not null,
  source_type text not null default 'further_reading'
);

-- ── Full-text search ─────────────────────────────────────────────────────────
-- alias_text_concat is populated by the seed script (aliases are seeded after
-- terms, so it can't be a generated column referencing another table).

ALTER TABLE pm_rearchitected.terms ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', canonical_term), 'A') ||
    setweight(to_tsvector('english', coalesce(alias_text_concat, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(short_definition, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(long_definition, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_pm_rearchitected_terms_search ON pm_rearchitected.terms USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_pm_rearchitected_terms_category ON pm_rearchitected.terms (category_id, priority);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE pm_rearchitected.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_rearchitected.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_rearchitected.aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_rearchitected.related_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_rearchitected.sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON pm_rearchitected.categories;
CREATE POLICY "Public read access" ON pm_rearchitected.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON pm_rearchitected.terms;
CREATE POLICY "Public read access" ON pm_rearchitected.terms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON pm_rearchitected.aliases;
CREATE POLICY "Public read access" ON pm_rearchitected.aliases FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON pm_rearchitected.related_terms;
CREATE POLICY "Public read access" ON pm_rearchitected.related_terms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON pm_rearchitected.sources;
CREATE POLICY "Public read access" ON pm_rearchitected.sources FOR SELECT USING (true);

-- No write policy for anon/authenticated — this app has no auth, so writes
-- only ever happen via service_role (the seed script).

-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA pm_rearchitected TO anon, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA pm_rearchitected TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA pm_rearchitected TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pm_rearchitected GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA pm_rearchitected GRANT ALL ON TABLES TO service_role;
