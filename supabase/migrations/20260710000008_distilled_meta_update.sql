UPDATE _meta.apps SET
  schema_name = 'distilled',
  supabase_status = 'shared rocky-coast-labs project',
  notes = 'Migrated 2026-07-10: 1680 articles, 6 zones, 1 test user, 1 save carried over from the old standalone project (qyjkqfgodgnjlvjdyuci), which is kept around unpaused for now as a safety net until the new setup is confirmed stable in daily use. Note: Supabase Auth accounts were NOT migrated (no real end users existed) — anyone needing a real sign-in session on production needs a fresh account on the new project; local dev continues to use DEV_BYPASS_USER_ID.',
  updated_at = NOW()
WHERE name = 'Distilled';
