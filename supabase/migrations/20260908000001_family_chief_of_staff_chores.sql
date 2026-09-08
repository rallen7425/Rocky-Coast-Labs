-- Family Chief of Staff — Gamified Chore List (Chores tab + Right Now module).
--
-- Duolingo-style chore system for the kids: short, self-reported,
-- instantly-rewarded chores with points, streaks, a sibling leaderboard, and
-- parent-defined Goals kids save points toward and claim. See
-- gamified-chore-list-plan.md / gamified-chore-list-implementation-prompt.md
-- in the family-chief-of-staff repo for the full design/rationale.
--
-- Same security posture as the rest of the schema: RLS on, zero
-- anon/authenticated policies, service_role-only grants. No auth in this
-- app, so no per-row ownership enforcement beyond the app layer.

CREATE TABLE IF NOT EXISTS family_chief_of_staff.chores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  points            int NOT NULL DEFAULT 10,
  frequency         text NOT NULL DEFAULT 'daily'
                      CHECK (frequency IN ('one_time', 'daily', 'weekly', 'custom')),
  -- weekly/custom only: 0=Sun..6=Sat.
  frequency_days    int[],
  deadline_time     time,
  time_window       text NOT NULL DEFAULT 'anytime'
                      CHECK (time_window IN ('before_school', 'after_school', 'evening', 'anytime')),
  is_pinned         boolean NOT NULL DEFAULT false,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_chief_of_staff.chore_assignees (
  chore_id          uuid NOT NULL REFERENCES family_chief_of_staff.chores(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  PRIMARY KEY (chore_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS family_chief_of_staff.chore_completions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id          uuid NOT NULL REFERENCES family_chief_of_staff.chores(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  -- The occurrence date, for recurring chores.
  completed_on      date NOT NULL,
  status            text NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'partial')),
  -- Stored per-row, not looked up from chores.points at render time, so a
  -- later point-value change doesn't rewrite history.
  points_awarded    int NOT NULL,
  completed_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chore_id, family_member_id, completed_on)
);

CREATE TABLE IF NOT EXISTS family_chief_of_staff.member_points (
  family_member_id  uuid PRIMARY KEY REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  balance           int NOT NULL DEFAULT 0,
  current_streak    int NOT NULL DEFAULT 0,
  longest_streak    int NOT NULL DEFAULT 0,
  last_completed_on date
);

CREATE TABLE IF NOT EXISTS family_chief_of_staff.goals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  points_needed     int NOT NULL,
  needs_approval    boolean NOT NULL DEFAULT true,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- No rows for a goal = available to all kids.
CREATE TABLE IF NOT EXISTS family_chief_of_staff.goal_availability (
  goal_id           uuid NOT NULL REFERENCES family_chief_of_staff.goals(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS family_chief_of_staff.goal_claims (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id           uuid NOT NULL REFERENCES family_chief_of_staff.goals(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  points_spent      int NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'denied')),
  requested_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_chore_completions_member_date
  ON family_chief_of_staff.chore_completions (family_member_id, completed_on);
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_goal_claims_status
  ON family_chief_of_staff.goal_claims (status);

ALTER TABLE family_chief_of_staff.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.chore_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.member_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.goal_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.goal_claims ENABLE ROW LEVEL SECURITY;

GRANT ALL ON family_chief_of_staff.chores TO service_role;
GRANT ALL ON family_chief_of_staff.chore_assignees TO service_role;
GRANT ALL ON family_chief_of_staff.chore_completions TO service_role;
GRANT ALL ON family_chief_of_staff.member_points TO service_role;
GRANT ALL ON family_chief_of_staff.goals TO service_role;
GRANT ALL ON family_chief_of_staff.goal_availability TO service_role;
GRANT ALL ON family_chief_of_staff.goal_claims TO service_role;

UPDATE _meta.apps SET
  notes = notes || ' 2026-09-08 (gamified chore list): added chores/chore_assignees/chore_completions/member_points/goals/goal_availability/goal_claims — points, streaks, and parent-defined Goals for the new Chores tab + Today-page Right Now module.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
