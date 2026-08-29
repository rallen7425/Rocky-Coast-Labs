-- Family Chief of Staff — Notifications system.
--
-- Backs a real /notifications feed (ranked; Review / Important / More) and
-- the Today-screen Notifications tile that mirrors its "Important" set.
--
-- 1. entries.is_critical — a per-entry flag that forces a notification to
--    "critical" severity. Set by the email-scan extractor (closures,
--    cancellations, safety alerts, hard same-day deadlines) and by a manual
--    toggle in the entry form. Additive, defaulted, non-destructive.
--
-- 2. notification_dismissals — records a household-wide "dismissed" state
--    for individual notifications. Notifications are derived at request time
--    (not stored), so this is keyed by the derived stable id string
--    ("soon:<uuid>", "todo:<uuid>", "kim:<uuid>", ...). Advisories and the
--    review nudge are never dismissed here — advisories always run their
--    ~24h window, the review nudge mirrors the live review queue.
--
-- Same security posture as the rest of the schema: RLS on, zero
-- anon/authenticated policies (deny by default), service_role-only grants.

ALTER TABLE family_chief_of_staff.entries
  ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS family_chief_of_staff.notification_dismissals (
  notification_id text PRIMARY KEY,
  dismissed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE family_chief_of_staff.notification_dismissals ENABLE ROW LEVEL SECURITY;
GRANT ALL ON family_chief_of_staff.notification_dismissals TO service_role;

UPDATE _meta.apps SET
  notes = notes || ' 2026-08-29 (notifications): added entries.is_critical (bool, default false — forces critical severity, set by the extractor + a manual form toggle) and notification_dismissals (household-wide dismissed state keyed by the derived notification id). Feeds the rebuilt /notifications page (Review / Important / More) and the Today tile.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
