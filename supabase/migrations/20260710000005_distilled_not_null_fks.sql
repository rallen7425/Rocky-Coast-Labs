-- FK columns that logically can't be null (a zone/save/track without an
-- owner doesn't make sense) — the app code already assumes non-null here.
-- No existing rows have nulls, so these are safe to tighten.

ALTER TABLE distilled.zones ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE distilled.user_saves ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE distilled.user_saves ALTER COLUMN article_id SET NOT NULL;
ALTER TABLE distilled.user_tracks ALTER COLUMN user_id SET NOT NULL;
