-- Tags rows generated from one recurring-event input (e.g. "every Saturday
-- until Dec 1") so they can be identified as a series later, even though
-- MVP only supports *creating* a series, not bulk-editing/cancelling one —
-- that's much harder to retrofit without this link once rows already exist.
ALTER TABLE rufus.events ADD COLUMN IF NOT EXISTS recurrence_id uuid;
CREATE INDEX IF NOT EXISTS idx_rufus_events_recurrence_id
  ON rufus.events (recurrence_id) WHERE recurrence_id IS NOT NULL;
