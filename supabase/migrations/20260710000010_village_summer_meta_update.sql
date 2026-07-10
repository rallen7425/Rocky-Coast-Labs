UPDATE _meta.apps SET
  schema_name = 'village_summer',
  supabase_status = 'shared rocky-coast-labs project',
  notes = 'Migrated 2026-07-10: 1 alert, 10 events, 11 amenities, 4 content pages, 1 weather_cache row carried over from the old standalone project (anlwanoqrixidexfvyfq), which is kept paused as a dormant backup. Admin auth account was NOT migrated (no real end users existed) — /admin needs a fresh admin account created on the new project. App still deploys from the standalone rallen7425/Rocky-Coast-Guides repo; the Turborepo monorepo (apps/summer-village) is scaffolded but not yet the deployed source.',
  updated_at = NOW()
WHERE name = 'Rocky Coast Guide / Summer Village Life';
