-- Infra naming cleanup, follow-up to 20260825000001 (schema rename).
-- ALTER SCHEMA ... RENAME does not rename the indexes inside the schema,
-- so five indexes created by the original rufus migrations still carried
-- "rufus" in their names. Bring them in line with the sibling convention
-- (idx_<schema>_<table>_<col>, e.g. idx_pm_rearchitected_terms_search).
-- Index renames are metadata-only: no rebuild, no lock of consequence,
-- no PostgREST/config involvement.

ALTER INDEX IF EXISTS family_chief_of_staff.idx_rufus_events_starts_at
  RENAME TO idx_family_chief_of_staff_events_starts_at;
ALTER INDEX IF EXISTS family_chief_of_staff.idx_rufus_events_person
  RENAME TO idx_family_chief_of_staff_events_person;
ALTER INDEX IF EXISTS family_chief_of_staff.idx_rufus_events_status
  RENAME TO idx_family_chief_of_staff_events_status;
ALTER INDEX IF EXISTS family_chief_of_staff.idx_rufus_todos_person
  RENAME TO idx_family_chief_of_staff_todos_person;
ALTER INDEX IF EXISTS family_chief_of_staff.idx_rufus_events_recurrence_id
  RENAME TO idx_family_chief_of_staff_events_recurrence_id;

-- Correct two stale facts in the running notes for this app's registry row.
UPDATE _meta.apps SET
  notes = notes || ' 2026-08-28 infra-naming audit: renamed the 5 remaining idx_rufus_* indexes to idx_family_chief_of_staff_*. Corrected two stale notes above: the local repo path is now ~/Documents/Claude/Projects/family-chief-of-staff, and the rufus-olive.vercel.app Vercel alias (a note above claimed it was removed in 2026-08 — it was not) has been retired as part of this cleanup. Chat persona name "Rufus" is retained in the UI only (ASSISTANT_NAME constant).',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
