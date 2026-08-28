-- Family Chief of Staff — P1 of the event/task/reminder/advisory redesign.
--
-- Collapses `events` + `todos` into one `entries` table with a four-way
-- `kind` discriminator, and adds the supporting tables the redesign needs:
--   entry_owners        — multi-owner join (a form jointly owned by both parents)
--   member_locations    — household "Home" + optional per-person School/Work
--   arrival_buffer_rules — "arrive N minutes early" defaults, editable in Settings
--
-- Live-data migration: every existing events/todos row is copied into
-- `entries` KEEPING ITS ID (so source_detail grouping, recurrence_id links,
-- and any external references stay valid). The old `events` / `todos`
-- tables are intentionally LEFT IN PLACE as a rollback net — a later
-- throwaway migration drops them once the deploy is verified. Until then,
-- the app writes only to `entries`, so the old tables go stale immediately.
--
-- Same security posture as the rest of this schema: RLS on, zero
-- anon/authenticated policies (deny by default), service_role-only grants.

-- ── entries ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_chief_of_staff.entries (
  id                 uuid primary key default gen_random_uuid(),
  kind               text not null check (kind in ('event', 'task', 'reminder', 'advisory')),
  title              text not null,
  notes              text,

  -- Location upgraded from plain text to geocodable. lat/lng stay null
  -- until P1.5 wires geocoding on save.
  location_text      text,
  location_lat       double precision,
  location_lng       double precision,

  -- Only 'busy' entries are checked against each other for scheduling
  -- conflicts (P1.5). Default by kind, overridable per entry.
  busy_status        text not null default 'free' check (busy_status in ('busy', 'free')),

  -- 'personal' = relevant to one person (an adult's own appointment);
  -- 'family' = a household concept. Who-can-see-it still comes from
  -- lib/visibility.ts, not this column.
  scope              text not null default 'family' check (scope in ('personal', 'family')),

  -- Who it's ABOUT (single person, or null = whole family). Who's
  -- RESPONSIBLE is entry_owners (many).
  subject_member_id  uuid references family_chief_of_staff.family_members(id) on delete set null,

  -- Small fixed vocabulary assigned by extraction, not matched on raw
  -- title keywords: game | practice | rehearsal | appointment | other.
  category           text,

  starts_at          timestamptz,               -- events / reminders on a datetime
  ends_at            timestamptz,
  due_at             date,                       -- tasks / deadline-style reminders
  is_all_day         boolean not null default false,

  -- Distinct from starts_at: "players report by 2:45" / "doors 6:30".
  arrival_at         timestamptz,
  arrival_source     text check (arrival_source in ('stated', 'inferred', 'manual')),

  -- Shared by every row generated from one recurring input (existing
  -- pattern from events.recurrence_id); recurrence_until records how long
  -- the series was set to run.
  recurrence_id      uuid,
  recurrence_until   date,

  -- Reminder -> the event/task it's attached to. Null = standalone
  -- reminder (its own date, or a deadline). ON DELETE SET NULL so
  -- deleting the target leaves the reminder as a standalone rather than
  -- silently removing it.
  linked_entry_id    uuid references family_chief_of_staff.entries(id) on delete set null,

  status             text not null default 'confirmed'
                       check (status in ('pending_review', 'confirmed', 'dismissed')),
  completed_at       timestamptz,               -- tasks only; null = not done

  source_type        text not null check (source_type in ('manual', 'chat', 'email_scan')),
  source_detail      jsonb,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_starts_at
  ON family_chief_of_staff.entries (starts_at);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_due_at
  ON family_chief_of_staff.entries (due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_subject
  ON family_chief_of_staff.entries (subject_member_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_kind
  ON family_chief_of_staff.entries (kind);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_status
  ON family_chief_of_staff.entries (status) WHERE status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_recurrence_id
  ON family_chief_of_staff.entries (recurrence_id) WHERE recurrence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_linked
  ON family_chief_of_staff.entries (linked_entry_id) WHERE linked_entry_id IS NOT NULL;

-- ── entry_owners ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_chief_of_staff.entry_owners (
  entry_id          uuid not null references family_chief_of_staff.entries(id) on delete cascade,
  family_member_id  uuid not null references family_chief_of_staff.family_members(id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (entry_id, family_member_id)
);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entry_owners_member
  ON family_chief_of_staff.entry_owners (family_member_id);

-- ── member_locations ─────────────────────────────────────────────────────────
-- Exactly one row should be household-wide (family_member_id IS NULL) with
-- label 'Home' — the travel-time fallback origin. Per-person School/Work
-- rows are schema-only in v1 (not used by the fallback logic yet).
CREATE TABLE IF NOT EXISTS family_chief_of_staff.member_locations (
  id                uuid primary key default gen_random_uuid(),
  family_member_id  uuid references family_chief_of_staff.family_members(id) on delete cascade,
  label             text not null check (label in ('Home', 'School', 'Work', 'Other')),
  address           text,
  lat               double precision,
  lng               double precision,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_locations_member
  ON family_chief_of_staff.member_locations (family_member_id);

-- ── arrival_buffer_rules ─────────────────────────────────────────────────────
-- Matching priority (see lib/arrival.ts): an exact category match wins;
-- otherwise the general rule (category IS NULL) applies when the entry's
-- subject is a child; otherwise no default (arrival stays null).
CREATE TABLE IF NOT EXISTS family_chief_of_staff.arrival_buffer_rules (
  id                   uuid primary key default gen_random_uuid(),
  category             text,                    -- null = general "kid's activity" fallback
  applies_to_kids_only boolean not null default true,
  buffer_minutes       int not null check (buffer_minutes >= 0 and buffer_minutes <= 180),
  created_at           timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE family_chief_of_staff.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.entry_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.member_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.arrival_buffer_rules ENABLE ROW LEVEL SECURITY;

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT ALL ON family_chief_of_staff.entries TO service_role;
GRANT ALL ON family_chief_of_staff.entry_owners TO service_role;
GRANT ALL ON family_chief_of_staff.member_locations TO service_role;
GRANT ALL ON family_chief_of_staff.arrival_buffer_rules TO service_role;

-- ── Seed: arrival buffer rules ───────────────────────────────────────────────
INSERT INTO family_chief_of_staff.arrival_buffer_rules (category, applies_to_kids_only, buffer_minutes)
SELECT * FROM (VALUES
  (NULL,   true, 15),   -- general default for any kid's activity
  ('game', true, 60)    -- overrides the general default for games/matches
) AS seed(category, applies_to_kids_only, buffer_minutes)
WHERE NOT EXISTS (SELECT 1 FROM family_chief_of_staff.arrival_buffer_rules);

-- ── Seed: the household "Home" location ─────────────────────────────────────
-- Address-less placeholder so the "exactly one household-wide Home row"
-- invariant holds from the start; the real address is entered in Settings
-- and geocoded in P1.5.
INSERT INTO family_chief_of_staff.member_locations (family_member_id, label, address)
SELECT NULL, 'Home', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM family_chief_of_staff.member_locations
  WHERE family_member_id IS NULL AND label = 'Home'
);

-- ── Data migration: events -> entries ────────────────────────────────────────
-- kind carries P0's events.kind (event | advisory). busy by default for
-- events, free for advisories. scope 'personal' when the subject is an
-- adult (their own thing), else 'family'.
INSERT INTO family_chief_of_staff.entries (
  id, kind, title, notes, location_text, busy_status, scope, subject_member_id,
  category, starts_at, ends_at, due_at, is_all_day, recurrence_id, status,
  source_type, source_detail, created_at, updated_at
)
SELECT
  e.id,
  e.kind,
  e.title,
  e.notes,
  e.location,
  CASE WHEN e.kind = 'advisory' THEN 'free' ELSE 'busy' END,
  CASE WHEN fm.is_adult IS TRUE THEN 'personal' ELSE 'family' END,
  e.family_member_id,
  e.category,
  e.starts_at,
  e.ends_at,
  NULL,
  e.all_day,
  e.recurrence_id,
  e.status,
  e.source_type,
  e.source_detail,
  e.created_at,
  e.updated_at
FROM family_chief_of_staff.events e
LEFT JOIN family_chief_of_staff.family_members fm ON fm.id = e.family_member_id
WHERE NOT EXISTS (SELECT 1 FROM family_chief_of_staff.entries en WHERE en.id = e.id);

-- ── Data migration: todos -> entries ────────────────────────────────────────
INSERT INTO family_chief_of_staff.entries (
  id, kind, title, notes, busy_status, scope, subject_member_id,
  due_at, is_all_day, status, completed_at,
  source_type, source_detail, created_at, updated_at
)
SELECT
  t.id,
  'task',
  t.title,
  NULL,
  'free',
  CASE WHEN fm.is_adult IS TRUE THEN 'personal' ELSE 'family' END,
  t.family_member_id,
  t.due_date,
  false,
  t.status,
  CASE WHEN t.completed THEN COALESCE(t.completed_at, t.updated_at) ELSE NULL END,
  t.source_type,
  t.source_detail,
  t.created_at,
  t.updated_at
FROM family_chief_of_staff.todos t
LEFT JOIN family_chief_of_staff.family_members fm ON fm.id = t.family_member_id
WHERE NOT EXISTS (SELECT 1 FROM family_chief_of_staff.entries en WHERE en.id = t.id);

-- ── Backfill entry_owners ───────────────────────────────────────────────────
-- Default owner = the subject, but only for family-scoped entries (kid
-- subjects). Adult-subject entries are 'personal' and get no owner row,
-- matching the form rule "personal entry — no separate owner needed".
-- Whole-family entries (null subject) also get none.
INSERT INTO family_chief_of_staff.entry_owners (entry_id, family_member_id)
SELECT en.id, en.subject_member_id
FROM family_chief_of_staff.entries en
WHERE en.subject_member_id IS NOT NULL
  AND en.scope = 'family'
  AND NOT EXISTS (
    SELECT 1 FROM family_chief_of_staff.entry_owners eo
    WHERE eo.entry_id = en.id AND eo.family_member_id = en.subject_member_id
  );

-- ── _meta.apps note ─────────────────────────────────────────────────────────
UPDATE _meta.apps SET
  notes = notes || ' 2026-08-28 (P1 of the entry redesign): added entries (kind event|task|reminder|advisory), entry_owners, member_locations, arrival_buffer_rules. Migrated all events + todos rows into entries KEEPING their ids; events/todos tables left in place as a rollback net (to be dropped in a follow-up once verified). App now reads/writes entries only.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
