-- Expands events for the admin "Manage Events & Activities" feature:
-- short/long description, optional web link, all-day flag, off-site
-- street address (city/distance_miles already existed for short display),
-- and a recurrence tag. is_active is reused as the hidden/visible flag
-- (it already has exactly that semantics via the existing partial index
-- and the guest query's .eq('is_active', true) filter) — hard delete is
-- a new capability added in the admin UI, not a schema change.

ALTER TABLE village_summer.events
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS url               text,
  ADD COLUMN IF NOT EXISTS is_all_day        boolean not null default false,
  ADD COLUMN IF NOT EXISTS address           text,
  ADD COLUMN IF NOT EXISTS recurrence_id     uuid;

-- Tags rows generated from one recurring-event input (e.g. "every Saturday
-- until Sept 30") so they can be identified as a series later, even though
-- MVP only supports *creating* a series, not bulk-editing/cancelling one.
-- Same idiom as rufus.events.recurrence_id (20260822000005).
CREATE INDEX IF NOT EXISTS idx_village_summer_events_recurrence_id
  ON village_summer.events (recurrence_id) WHERE recurrence_id IS NOT NULL;
