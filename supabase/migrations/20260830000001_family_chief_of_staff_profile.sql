-- Family Chief of Staff — Profile & Family Management.
--
-- Per-family-member profile fields + a structured "member details" list
-- (activities / teams / coaches). Backs the new Settings Hub, My Profile,
-- Manage Family, Edit Member, Member Details, and Privacy/Forget screens.
--
-- Notes:
--  * email / phone are user-editable CONTACT details, not identity — no
--    uniqueness constraint, never a lookup/foreign key. The stable id
--    stays family_members.id (the existing UUID pk).
--  * is_adult is kept (lib/visibility.ts, the pipeline, and EntryForm read
--    it). Going forward the app recomputes it from `birthday` at write time
--    and persists it, so is_adult is a derived-but-stored cache.
--  * home location reuses the already-seeded member_locations "Home" row
--    (family_member_id IS NULL, label = 'Home') — no new household table.
--
-- Same security posture as the rest of the schema: RLS on, zero
-- anon/authenticated policies, service_role-only grants.

ALTER TABLE family_chief_of_staff.family_members
  ADD COLUMN IF NOT EXISTS relationship         text,
  ADD COLUMN IF NOT EXISTS is_head_of_household boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS birthday             date,
  ADD COLUMN IF NOT EXISTS email                text,
  ADD COLUMN IF NOT EXISTS phone                text,
  ADD COLUMN IF NOT EXISTS school               text,
  ADD COLUMN IF NOT EXISTS grade                text;

CREATE TABLE IF NOT EXISTS family_chief_of_staff.member_details (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id  uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  label             text NOT NULL,                    -- "Activity" | "Team" | "Coach" | ...
  value             text NOT NULL,                    -- "Soccer — JV"
  fields            jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{label,value}, ...] expandable sub-rows
  ignored           boolean NOT NULL DEFAULT false,   -- soft-hidden from downstream logic, kept visible
  source            text NOT NULL DEFAULT 'manual'
                      CHECK (source IN ('manual', 'detected', 'voice')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_member_details_member
  ON family_chief_of_staff.member_details (family_member_id);

ALTER TABLE family_chief_of_staff.member_details ENABLE ROW LEVEL SECURITY;
GRANT ALL ON family_chief_of_staff.member_details TO service_role;

UPDATE _meta.apps SET
  notes = notes || ' 2026-08-30 (profile & family management): family_members gained relationship, is_head_of_household, birthday (is_adult now recomputed from it at write time), email, phone, school, grade; added member_details (structured activities/teams/coaches list, manual-only for now). Home location reuses the member_locations Home row.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
