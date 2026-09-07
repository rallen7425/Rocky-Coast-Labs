-- Family Chief of Staff — Email + Calendar Connectors, Phase 0.
--
-- Replaces the single-mailbox `gmail_credentials` singleton (id smallint
-- check (id = 1)) with a real per-family-member, multi-provider connections
-- table, plus a mapping table for the calendar two-way sync work that
-- follows in a later phase. See email-calendar-connectors-plan.md in the
-- family-chief-of-staff repo for the full design/rationale.
--
-- `gmail_credentials` is intentionally NOT dropped or altered here — the
-- existing pipeline keeps working unchanged until the new table is backfilled
-- and verified live; dropping the old table is a separate follow-up
-- migration once that's confirmed.
--
-- Same security posture as the rest of the schema: RLS on, zero
-- anon/authenticated policies, service_role-only grants.

CREATE TABLE IF NOT EXISTS family_chief_of_staff.email_connections (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id        uuid NOT NULL REFERENCES family_chief_of_staff.family_members(id) ON DELETE CASCADE,
  provider                text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  external_account_email  text NOT NULL,
  status                  text NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'paused', 'needs_reconnect', 'disconnected')),
  email_enabled           boolean NOT NULL DEFAULT true,
  calendar_enabled        boolean NOT NULL DEFAULT false,
  scopes                  text[] NOT NULL DEFAULT '{}',
  -- AES-256-GCM ciphertext (lib/security/tokenCrypto.ts) — never a plaintext
  -- token in this table. bytea, not text: the ciphertext is raw binary.
  refresh_token_enc       bytea NOT NULL,
  access_token_enc        bytea,
  token_expiry            timestamptz,
  last_synced_at          timestamptz,
  last_error              text,
  connected_at            timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_account_email)
);

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_email_connections_member
  ON family_chief_of_staff.email_connections (family_member_id);

-- Calendar two-way sync mapping (Phase 2) — created now so the FK/cascade
-- shape is settled early; nothing writes to this table until that phase.
CREATE TABLE IF NOT EXISTS family_chief_of_staff.calendar_sync_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id              uuid NOT NULL REFERENCES family_chief_of_staff.entries(id) ON DELETE CASCADE,
  connection_id         uuid NOT NULL REFERENCES family_chief_of_staff.email_connections(id) ON DELETE CASCADE,
  external_event_id     text NOT NULL,
  external_updated_at   timestamptz,
  last_pushed_at        timestamptz,
  last_pulled_at        timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_event_id),
  UNIQUE (entry_id, connection_id)
);

-- Which connection a scanned message came from. Nullable: existing
-- pre-Phase-0 rows have no connection (there was only ever one mailbox, so
-- they get backfilled to that mailbox's new connection row for consistency);
-- every new row going forward always sets this.
ALTER TABLE family_chief_of_staff.email_scan_log
  ADD COLUMN IF NOT EXISTS connection_id uuid
    REFERENCES family_chief_of_staff.email_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_family_chief_of_staff_email_scan_log_connection
  ON family_chief_of_staff.email_scan_log (connection_id);

ALTER TABLE family_chief_of_staff.email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chief_of_staff.calendar_sync_links ENABLE ROW LEVEL SECURITY;

GRANT ALL ON family_chief_of_staff.email_connections TO service_role;
GRANT ALL ON family_chief_of_staff.calendar_sync_links TO service_role;

UPDATE _meta.apps SET
  notes = notes || ' 2026-09-07 (email/calendar connectors, Phase 0): added email_connections (multi-provider, per-family-member, replaces the gmail_credentials singleton — old table left in place until verified/dropped in a follow-up) and calendar_sync_links (unused until the Phase 2 calendar-sync work). email_scan_log gained a nullable connection_id.',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
