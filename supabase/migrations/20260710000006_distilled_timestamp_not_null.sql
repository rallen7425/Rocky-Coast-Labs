-- All created_at/updated_at columns have a DEFAULT now() and the app never
-- inserts an explicit null for them — app-level TS types (e.g. TopicRow in
-- TrackingClient.tsx) already assume these are non-null strings.

ALTER TABLE distilled.users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE distilled.zones ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE distilled.articles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE distilled.user_saves ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE distilled.user_tracks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE distilled.zone_quicklook ALTER COLUMN updated_at SET NOT NULL;
