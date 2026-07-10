UPDATE _meta.apps SET
  notes = 'Migrated 2026-07-10: 1 alert, 10 events, 11 amenities, 4 content pages, 1 weather_cache row carried over from the old standalone project (anlwanoqrixidexfvyfq), which can now be paused since production is fully verified. Admin account recreated fresh (rallen7425@gmail.com, role=admin) since the old one was not migrated. Both guest mode and admin /admin console verified working on production. App still deploys from the standalone rallen7425/Rocky-Coast-Guides repo; the Turborepo monorepo (apps/summer-village) is scaffolded but not yet the deployed source.',
  updated_at = NOW()
WHERE name = 'Rocky Coast Guide / Summer Village Life';
