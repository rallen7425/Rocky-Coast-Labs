-- Family Chief of Staff — Identity, Sign-In & Onboarding, Phase 1: data model.
--
-- Adds real multi-tenancy (households) ahead of real auth (Supabase Auth,
-- added in a later phase). Today there is exactly one implicit household
-- (Rick, Kim, Ben, Nora) — this migration creates one real `households` row
-- for it and backfills every table below to point at it.
--
-- Decisions locked in with the user before running this against live data:
--   - App-layer enforcement (household_id filtered in server code), not RLS,
--     for this pass — matches this schema's existing all-service-role
--     posture. No grants change here: Supabase Auth (wired up in a later
--     phase) only ever touches the `auth` schema directly; this schema's
--     data access stays on the service-role key from server code, same as
--     every table already in this schema.
--   - Rick's family-chief-of-staff identity reuses his existing auth.users
--     row (rallen7425@gmail.com, id 833b6858-59f9-480e-b27d-e0a6a800e66b) —
--     already registered on this shared project for a different app's
--     (Rocky Coast Guide) admin role. This app's code must never read or
--     rely on that row's app_metadata — it belongs to a different app's
--     namespace; family-chief-of-staff-specific state lives on
--     family_members, not on the shared auth.users row.
--   - The dead pre-unification `events`/`todos` tables (orphaned since the
--     2026-08-28 entries migration, never dropped as originally planned:
--     see that migration's own comment) are dropped here.
--   - The household_id table list below was built by grepping every
--     `create table family_chief_of_staff.*` across this schema's actual
--     migration history, not trusted from the identity plan doc alone —
--     it was missing member_email_domains and keep_in_mind_items.
--
-- Same security posture as the rest of this schema: RLS on, zero
-- anon/authenticated policies (deny by default), service_role-only grants.

-- ── households ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_chief_of_staff.households (
  id          uuid primary key default gen_random_uuid(),
  name        text,                              -- nullable: not yet named
  created_at  timestamptz not null default now()
);

-- ── household_invites ────────────────────────────────────────────────────────
-- Covers both onboarding use cases: an existing profile-only member being
-- invited to activate (family_member_id set, invite_type = 'activate_member'),
-- and a brand-new adult who isn't in the roster yet (family_member_id null,
-- invite_type = 'new_adult', full parent-tier access, no view/submission tier).
CREATE TABLE IF NOT EXISTS family_chief_of_staff.household_invites (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references family_chief_of_staff.households(id) on delete cascade,
  family_member_id  uuid references family_chief_of_staff.family_members(id) on delete cascade,
  invite_type       text not null check (invite_type in ('activate_member', 'new_adult')),
  method            text not null check (method in ('email', 'join_code')),
  email             text,
  join_code         text,
  view_scope        text check (view_scope in ('own', 'siblings', 'household')),
  submission_tier   text check (submission_tier in ('requires_approval', 'independent')),
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  accepted_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_household_invites_household
  ON family_chief_of_staff.household_invites (household_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_chief_of_staff_household_invites_join_code
  ON family_chief_of_staff.household_invites (join_code) WHERE join_code IS NOT NULL;

-- ── family_members additions ────────────────────────────────────────────────
-- birthday/relationship/is_head_of_household/email/phone/school/grade already
-- exist (2026-08-30) — not redefined here. has_approval_authority is
-- deliberately separate from is_head_of_household (per-decision, not
-- hardcoded to whoever holds HoH).
ALTER TABLE family_chief_of_staff.family_members
  ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS has_approval_authority boolean not null default false,
  ADD COLUMN IF NOT EXISTS account_status text not null default 'profile_only'
    check (account_status in ('profile_only', 'activated')),
  ADD COLUMN IF NOT EXISTS auth_user_id uuid unique references auth.users(id) on delete set null,
  ADD COLUMN IF NOT EXISTS view_scope text check (view_scope in ('own', 'siblings', 'household')),
  ADD COLUMN IF NOT EXISTS submission_tier text check (submission_tier in ('requires_approval', 'independent'));

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_family_members_household
  ON family_chief_of_staff.family_members (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_family_members_auth_user
  ON family_chief_of_staff.family_members (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ── household_id on every other real, live table ────────────────────────────
ALTER TABLE family_chief_of_staff.entries              ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.entry_owners          ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.member_locations      ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.arrival_buffer_rules  ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.member_details        ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.email_connections     ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.calendar_sync_links   ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.email_scan_log        ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.notification_dismissals ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.member_email_domains  ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.keep_in_mind_items    ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.chores                ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.chore_assignees       ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.chore_completions     ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.member_points         ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.goals                 ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.goal_availability     ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;
ALTER TABLE family_chief_of_staff.goal_claims           ADD COLUMN IF NOT EXISTS household_id uuid references family_chief_of_staff.households(id) on delete cascade;

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_household              ON family_chief_of_staff.entries (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entry_owners_household         ON family_chief_of_staff.entry_owners (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_locations_household     ON family_chief_of_staff.member_locations (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_arrival_buffer_rules_household ON family_chief_of_staff.arrival_buffer_rules (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_details_household       ON family_chief_of_staff.member_details (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_email_connections_household    ON family_chief_of_staff.email_connections (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_calendar_sync_links_household  ON family_chief_of_staff.calendar_sync_links (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_email_scan_log_household       ON family_chief_of_staff.email_scan_log (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_notification_dismissals_household ON family_chief_of_staff.notification_dismissals (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_email_domains_household ON family_chief_of_staff.member_email_domains (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_keep_in_mind_items_household   ON family_chief_of_staff.keep_in_mind_items (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_chores_household               ON family_chief_of_staff.chores (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_chore_assignees_household      ON family_chief_of_staff.chore_assignees (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_chore_completions_household    ON family_chief_of_staff.chore_completions (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_points_household        ON family_chief_of_staff.member_points (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_goals_household                ON family_chief_of_staff.goals (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_goal_availability_household    ON family_chief_of_staff.goal_availability (household_id);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_goal_claims_household          ON family_chief_of_staff.goal_claims (household_id);

-- ── Data migration: one household for the one real household ───────────────
INSERT INTO family_chief_of_staff.households (name)
SELECT NULL
WHERE NOT EXISTS (SELECT 1 FROM family_chief_of_staff.households);

UPDATE family_chief_of_staff.family_members       SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.entries               SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.entry_owners          SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.member_locations      SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.arrival_buffer_rules  SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.member_details        SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.email_connections     SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.calendar_sync_links   SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.email_scan_log        SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.notification_dismissals SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.member_email_domains  SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.keep_in_mind_items    SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.chores                SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.chore_assignees       SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.chore_completions     SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.member_points         SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.goals                 SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.goal_availability     SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;
UPDATE family_chief_of_staff.goal_claims           SET household_id = (SELECT id FROM family_chief_of_staff.households LIMIT 1) WHERE household_id IS NULL;

-- ── Retroactive household owner: Rick ───────────────────────────────────────
-- Reuses his existing auth.users row (see the top-of-file note on why —
-- confirmed with the user; that row's app_metadata belongs to a different
-- app and must never be read by this app's code).
UPDATE family_chief_of_staff.family_members
SET account_status = 'activated',
    auth_user_id = '833b6858-59f9-480e-b27d-e0a6a800e66b',
    has_approval_authority = true
WHERE id = '6a356c0e-27d3-465a-88d8-0fa78dee7298';  -- Rick

-- ── Lock in household_id as required, now that every row has one ───────────
ALTER TABLE family_chief_of_staff.family_members       ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.entries               ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.entry_owners          ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.member_locations      ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.arrival_buffer_rules  ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.member_details        ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.email_connections     ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.calendar_sync_links   ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.email_scan_log        ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.notification_dismissals ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.member_email_domains  ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.keep_in_mind_items    ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.chores                ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.chore_assignees       ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.chore_completions     ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.member_points         ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.goals                 ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.goal_availability     ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE family_chief_of_staff.goal_claims           ALTER COLUMN household_id SET NOT NULL;

-- ── Drop the dead pre-unification tables ────────────────────────────────────
-- Orphaned since 2026-08-28's entries migration (which explicitly left them
-- in place "as a rollback net" pending this exact follow-up); nothing in the
-- app has read or written either table since. 67 events + 26 todos rows.
DROP TABLE IF EXISTS family_chief_of_staff.events;
DROP TABLE IF EXISTS family_chief_of_staff.todos;

-- ── RLS + grants for the new tables ──────────────────────────────────────────
ALTER TABLE family_chief_of_staff.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.household_invites ENABLE ROW LEVEL SECURITY;
GRANT ALL ON family_chief_of_staff.households TO service_role;
GRANT ALL ON family_chief_of_staff.household_invites TO service_role;

-- ── _meta.apps note ─────────────────────────────────────────────────────────
UPDATE _meta.apps SET
  notes = notes || ' 2026-09-12 (Identity/Sign-In/Onboarding Phase 1): added households + household_invites; added household_id to every real table in this schema (backfilled to one household for the existing Rick/Kim/Ben/Nora data) plus has_approval_authority/account_status/auth_user_id/view_scope/submission_tier on family_members. Rick (family_members.id 6a356c0e-27d3-465a-88d8-0fa78dee7298) marked activated, linked to his existing auth.users row 833b6858-59f9-480e-b27d-e0a6a800e66b (shared with Rocky Coast Guide admin — app_metadata there belongs to that app, not this one). Dropped the long-orphaned events/todos tables. App-layer household_id enforcement (not RLS) by design for this pass.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
