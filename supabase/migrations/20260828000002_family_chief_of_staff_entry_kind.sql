-- Family Chief of Staff — P0 of the event/task/reminder/advisory redesign.
--
-- The full redesign (P1) collapses `events` + `todos` into one `entries`
-- table with a four-way `kind` discriminator (event|task|reminder|advisory).
-- P0 ships the one piece that needs storage now — Advisory as a visually
-- distinct kind — as a minimal, additive column on the existing `events`
-- table so the P0 UI work (delete action, date/time pickers, advisory
-- rendering) can land ahead of the live-data migration.
--
-- Additive and non-destructive: new column is defaulted, existing rows
-- become kind='event'. No PostgREST/config involvement (pure DDL on an
-- already-exposed schema).

ALTER TABLE family_chief_of_staff.events
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'event'
  CHECK (kind IN ('event', 'advisory'));

-- Partial index: advisories are the rare case and are queried/branched on
-- separately in the UI (muted styling, collapsible day summary).
CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_events_kind
  ON family_chief_of_staff.events (kind) WHERE kind <> 'event';

UPDATE _meta.apps SET
  notes = notes || ' 2026-08-28 (P0 of the entry redesign): added events.kind (event|advisory), defaulted to ''event''. First step toward the unified entries model coming in P1 (events+todos -> entries with kind event|task|reminder|advisory). Advisories render visually distinct — muted, no person color, collapsible "N advisories" day summary.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
