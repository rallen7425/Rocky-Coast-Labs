-- Announcements: a calmer, scheduled banner distinct from `alerts` (which
-- is red/urgent, single-alert-at-a-time). Visibility is governed entirely
-- by the starts_at/ends_at window — no is_active/hidden flag needed.

CREATE TABLE IF NOT EXISTS village_summer.announcements (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null default (date_trunc('day', now()) + interval '1 day'),
  created_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS announcements_window_idx
  ON village_summer.announcements (starts_at, ends_at);

ALTER TABLE village_summer.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements: anyone can read active" ON village_summer.announcements;
CREATE POLICY "announcements: anyone can read active"
  ON village_summer.announcements FOR SELECT
  USING (starts_at <= now() AND ends_at > now());

DROP POLICY IF EXISTS "announcements: admin full access" ON village_summer.announcements;
CREATE POLICY "announcements: admin full access"
  ON village_summer.announcements FOR ALL
  USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

-- Explicit grants — don't rely solely on schema-wide ALTER DEFAULT PRIVILEGES;
-- this exact gap already shipped a real bug for amenities/events (20260823000004).
GRANT SELECT ON village_summer.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON village_summer.announcements TO authenticated;
