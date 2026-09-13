-- Family Chief of Staff — Identity Phase 1 follow-up: default household_id.
--
-- The prior migration made household_id NOT NULL everywhere with no
-- default. That's correct for the end state, but the app's write paths
-- (lib/actions/*.ts, scripts/pipeline/*) don't set household_id yet — that
-- wiring is later-phase work (once a real session exists to read it from).
-- Left as-is, every INSERT in the live app would start failing immediately
-- ("null value in column household_id violates not-null constraint").
--
-- Fix: default every household_id column to the one real household while
-- there's only one. This default gets dropped once app code explicitly
-- sets household_id on every write (a later-phase cleanup, not done here).
DO $$
DECLARE
  hh_id uuid := (SELECT id FROM family_chief_of_staff.households LIMIT 1);
BEGIN
  EXECUTE format('ALTER TABLE family_chief_of_staff.family_members ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.entries ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.entry_owners ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.member_locations ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.arrival_buffer_rules ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.member_details ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.email_connections ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.calendar_sync_links ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.email_scan_log ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.notification_dismissals ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.member_email_domains ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.keep_in_mind_items ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.chores ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.chore_assignees ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.chore_completions ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.member_points ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.goals ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.goal_availability ALTER COLUMN household_id SET DEFAULT %L', hh_id);
  EXECUTE format('ALTER TABLE family_chief_of_staff.goal_claims ALTER COLUMN household_id SET DEFAULT %L', hh_id);
END $$;

-- No family_members exception: the live "Add family member" flow
-- (Manage Family) writes a new family_members row today without setting
-- household_id, same as every other table's existing write paths — it
-- needs the same default to keep working. A default doesn't stop a future
-- onboarding flow from explicitly setting a *different* household_id when
-- it creates a brand-new household; it only fills in when a write omits
-- the column. The real risk this default defers, everywhere it's applied:
-- once later-phase code creates a second real household, EVERY write path
-- (not just onboarding's) must start setting household_id explicitly, or
-- it will silently default to this one household. Drop these defaults
-- together, once that's true, not table-by-table.

UPDATE _meta.apps SET
  notes = notes || ' 2026-09-12 (Identity Phase 1 follow-up): defaulted household_id on every table except family_members to the one real household, so existing app writes (which do not set household_id yet) keep working until later-phase code explicitly sets it. Drop these defaults once that wiring lands.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
