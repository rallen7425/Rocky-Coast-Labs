-- ============================================================
-- Rufus (Family Chief of Staff) — schema
-- No auth/login concept in the MVP (single household, single implicit
-- user) — unlike pm_rearchitected's public-read pattern, this app needs
-- full read+write from its own server-side code, so RLS is enabled with
-- zero anon/authenticated policies at all (deny by default) and every
-- table is granted only to service_role. No browser Supabase client
-- exists in this app.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS rufus;

CREATE TABLE IF NOT EXISTS rufus.family_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  accent_color  text not null check (accent_color in ('coral','teal','gold','berry')),
  avatar_url    text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- family_member_id nullable = whole-family / unassigned event.
-- status supports post-hoc review for auto-detected (email-scan) events
-- without blocking them from appearing on the calendar.
-- source_type + source_detail give every event provenance regardless of
-- path (manual / chat / email_scan), so the chat can cite sources.
CREATE TABLE IF NOT EXISTS rufus.events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  family_member_id  uuid references rufus.family_members(id) on delete set null,
  category          text,
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  all_day           boolean not null default false,
  location          text,
  notes             text,
  status            text not null default 'confirmed'
                     check (status in ('pending_review','confirmed','dismissed')),
  source_type       text not null check (source_type in ('manual','chat','email_scan')),
  source_detail     jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_rufus_events_starts_at ON rufus.events (starts_at);
CREATE INDEX IF NOT EXISTS idx_rufus_events_person ON rufus.events (family_member_id);
CREATE INDEX IF NOT EXISTS idx_rufus_events_status ON rufus.events (status) WHERE status = 'pending_review';

CREATE TABLE IF NOT EXISTS rufus.todos (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  family_member_id  uuid references rufus.family_members(id) on delete set null,
  due_date          date,
  completed         boolean not null default false,
  completed_at      timestamptz,
  status            text not null default 'confirmed'
                     check (status in ('pending_review','confirmed','dismissed')),
  source_type       text not null check (source_type in ('manual','chat','email_scan')),
  source_detail     jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_rufus_todos_person ON rufus.todos (family_member_id);

-- Today-screen nudges not tied to a specific event/todo (e.g. weather-driven
-- reminders). pending_review events are surfaced separately by the app,
-- queried directly from rufus.events — not duplicated into this table.
CREATE TABLE IF NOT EXISTS rufus.keep_in_mind_items (
  id                uuid primary key default gen_random_uuid(),
  body              text not null,
  icon              text,
  family_member_id  uuid references rufus.family_members(id) on delete set null,
  dismissed         boolean not null default false,
  source_type       text not null default 'manual' check (source_type in ('manual','chat','email_scan','system')),
  source_detail     jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Single household, single Gmail mailbox — singleton row (id is always 1).
CREATE TABLE IF NOT EXISTS rufus.gmail_credentials (
  id                    smallint primary key default 1 check (id = 1),
  google_account_email  text not null,
  refresh_token         text not null,
  access_token          text,
  token_expiry          timestamptz,
  scopes                text,
  connected_at          timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Dedupe/audit log for the email-scan pipeline — mirrors Distilled's
-- external_id dedupe-before-enrichment pattern so re-runs don't reprocess
-- the same email or re-call Claude needlessly.
CREATE TABLE IF NOT EXISTS rufus.email_scan_log (
  id                uuid primary key default gen_random_uuid(),
  gmail_message_id  text not null unique,
  thread_id         text,
  sender            text,
  subject           text,
  received_at       timestamptz,
  processed_at      timestamptz not null default now(),
  events_created    int not null default 0,
  todos_created     int not null default 0,
  status            text not null default 'processed' check (status in ('processed','skipped','error')),
  error_detail      text
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Enabled with zero anon/authenticated policies = deny by default for both
-- roles. service_role bypasses RLS entirely, which is how the app's own
-- server-side Supabase client (service-role key, never shipped to the
-- browser) reads and writes.

ALTER TABLE rufus.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rufus.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rufus.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rufus.keep_in_mind_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rufus.gmail_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE rufus.email_scan_log ENABLE ROW LEVEL SECURITY;

-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA rufus TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA rufus TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rufus GRANT ALL ON TABLES TO service_role;

-- ── Seed: family roster ─────────────────────────────────────────────────────
-- Fixed MVP roster (Rick/Kim/Ben/Nora). A future onboarding/user-management
-- flow will let colors be reassigned or repeated — accent_color is just a
-- column, not unique, so repeats are already supported by the schema.

INSERT INTO rufus.family_members (name, accent_color, sort_order)
SELECT * FROM (VALUES
  ('Rick', 'coral', 0),
  ('Kim',  'teal',  1),
  ('Ben',  'gold',  2),
  ('Nora', 'berry', 3)
) AS seed(name, accent_color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM rufus.family_members);
