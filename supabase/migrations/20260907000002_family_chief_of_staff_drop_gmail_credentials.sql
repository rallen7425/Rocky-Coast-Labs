-- Family Chief of Staff — drop the legacy gmail_credentials singleton.
--
-- Follow-up to 20260907000001 (email_connections). Verified nothing reads
-- or writes gmail_credentials anymore: /settings/accounts, the pipeline,
-- and the CLI OAuth script all moved to email_connections in Phase 1 of the
-- connectors rework. Safe to drop.

DROP TABLE IF EXISTS family_chief_of_staff.gmail_credentials;

UPDATE _meta.apps SET
  notes = notes || ' 2026-09-07 (email/calendar connectors, Phase 1): dropped gmail_credentials — fully superseded by email_connections, nothing reads it anymore.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
