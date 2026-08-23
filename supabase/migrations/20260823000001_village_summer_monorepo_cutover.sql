UPDATE _meta.apps SET
  github_repo = 'rallen7425/Rocky-Coast-Labs',
  notes = 'Monorepo cutover completed 2026-08-23: app now deploys from rocky-coast-labs (apps/summer-village) via Vercel Git integration (Root Directory apps/summer-village), replacing the standalone rallen7425/Rocky-Coast-Guides repo as the deploy source. Verified live with real village_summer data (alerts, events, weather/tide) rendering correctly. Two gotchas hit during cutover, for reference: (1) Vercel "sensitive" env vars are only resolvable during Vercel''s own remote build, not a local `vercel build` — local prebuilt+deploy silently bakes in empty values; (2) Turbo 2.x needs a `packageManager` field in the workspace root package.json to resolve an npm workspace on Vercel. The standalone repo is being kept as a dormant fallback for now, not yet archived.',
  updated_at = NOW()
WHERE name = 'Rocky Coast Guide / Summer Village Life';
