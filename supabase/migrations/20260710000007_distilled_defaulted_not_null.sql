-- Remaining defaulted columns the app treats as always-present
-- (ZoneRow.position/enabled, ArticleDisplay.tags/urgencyScore are all
-- non-optional in the app's TS types).

ALTER TABLE distilled.zones ALTER COLUMN position SET NOT NULL;
ALTER TABLE distilled.zones ALTER COLUMN enabled SET NOT NULL;
ALTER TABLE distilled.articles ALTER COLUMN urgency_score SET NOT NULL;
ALTER TABLE distilled.articles ALTER COLUMN tags SET NOT NULL;
ALTER TABLE distilled.zone_quicklook ALTER COLUMN position SET NOT NULL;
