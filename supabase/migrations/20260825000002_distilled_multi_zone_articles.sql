-- Distilled's article classification was tagging zone_type by which source
-- feed found an article (e.g. anything from Hacker News's general-interest
-- frontpage was blindly stamped "tech"), not by actual content. The pipeline
-- now classifies each article's real native zone via Claude, and a story can
-- additionally belong to News when it's breaking/critical enough — so
-- articles need a second, multi-valued column for "every zone this should be
-- findable under" alongside the existing single zone_type ("native zone",
-- still drives story-detail routing and the single zone pill, unchanged).
ALTER TABLE distilled.articles ADD COLUMN IF NOT EXISTS zone_types text[] NOT NULL DEFAULT '{}';

-- Backfill only: give every existing row a one-element array matching its
-- current zone_type, so the new array-based queries work uniformly across
-- old and new rows. This does NOT reclassify existing articles' content —
-- that was explicitly out of scope for this change.
UPDATE distilled.articles SET zone_types = ARRAY[zone_type] WHERE zone_type IS NOT NULL AND zone_types = '{}';
