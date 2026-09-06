-- Family Chief of Staff — per-activity arrival buffers + entry↔activity link.
--
-- Moves the arrival buffer from a household-wide category rule
-- (arrival_buffer_rules) toward a property of a SPECIFIC activity in a
-- member's "Additional Context and Details" list. An entry can point at one
-- of the subject member's member_details rows; arrival inference then
-- prefers that activity's own buffer, falling back to the category rule and
-- the general default (see lib/arrival.ts).
--
-- Same security posture as the rest of the schema: RLS already enabled on
-- both tables, service_role-only grants — nothing to re-grant here.

ALTER TABLE family_chief_of_staff.member_details
  ADD COLUMN IF NOT EXISTS arrival_buffer_minutes int
    CHECK (arrival_buffer_minutes IS NULL
           OR (arrival_buffer_minutes >= 0 AND arrival_buffer_minutes <= 180)),
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IS NULL
           OR category IN ('game', 'practice', 'rehearsal', 'appointment', 'other'));

ALTER TABLE family_chief_of_staff.entries
  ADD COLUMN IF NOT EXISTS member_detail_id uuid
    REFERENCES family_chief_of_staff.member_details(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_entries_member_detail
  ON family_chief_of_staff.entries (member_detail_id);

UPDATE _meta.apps SET
  notes = notes || ' 2026-09-06 (per-activity arrival): member_details gained arrival_buffer_minutes + category; entries gained member_detail_id (nullable FK, ON DELETE SET NULL) so an entry can bind to one activity and use that activity''s arrival buffer, falling back to arrival_buffer_rules then the general default.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
