UPDATE _meta.apps SET
  vercel_project = 'pm-rearchitected',
  github_repo = 'rallen7425/pm-rearchitected',
  notes = 'Personal PM site, no login concept, no database needed. Git repo fixed 2026-07-10 (was rooted one level up, predating a file reorg). First deployed to Vercel 2026-07-10: https://pm-rearchitected.vercel.app, verified working (Home with live Substack RSS, About, Resources).',
  updated_at = NOW()
WHERE name = 'PM ReArchitected';
