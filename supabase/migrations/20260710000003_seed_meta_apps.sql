INSERT INTO _meta.apps (name, schema_name, vercel_project, github_repo, stage, supabase_status, notes) VALUES
  ('Distilled', NULL, 'distilled-news', 'rallen7425/Projects', 'active',
   'standalone project qyjkqfgodgnjlvjdyuci',
   'AI news briefing app, in daily use. Not yet migrated to shared project — do that in its own cutover session following the Sonic Radar pattern.'),

  ('Sonic Radar', 'sonicradar', 'sonic-radius', 'rallen7425/sonic-radius', 'prototype',
   'shared rocky-coast-labs project',
   'First app fully cut over to the shared project (2026-07-10). Old standalone project supabase-red-diamond (nxthgmqmgdgatqjnywhs) kept paused as a dormant backup, not in use.'),

  ('Rocky Coast Guide / Summer Village Life', NULL, 'summer-village-life', 'rallen7425/Rocky-Coast-Guides', 'active',
   'standalone project anlwanoqrixidexfvyfq',
   'Has real seeded content + admin login. Turborepo scaffold exists locally at rocky-coast-labs/apps/summer-village but is not yet wired to Vercel/GitHub or the shared schemas (rockycoast_core, village_summer reserved but empty). Live deployment still runs from the original standalone repo.'),

  ('PM ReArchitected', NULL, NULL, NULL, 'prototype',
   'none — no database needed',
   'Personal PM site, no login concept. Local git repo exists but has a stale root (predates a file reorg) and an uncommitted Archive/ with its own node_modules — needs its own small cleanup session before pushing to GitHub.'),

  ('Is It Offensive?', NULL, NULL, NULL, 'prototype',
   'none — no database needed',
   'First-pass Express + Anthropic SDK build. No Vercel or GitHub yet. Can be rebuilt freely if needed — no persisted data at stake.')
ON CONFLICT (name) DO UPDATE SET
  schema_name = EXCLUDED.schema_name,
  vercel_project = EXCLUDED.vercel_project,
  github_repo = EXCLUDED.github_repo,
  stage = EXCLUDED.stage,
  supabase_status = EXCLUDED.supabase_status,
  notes = EXCLUDED.notes,
  updated_at = NOW();
