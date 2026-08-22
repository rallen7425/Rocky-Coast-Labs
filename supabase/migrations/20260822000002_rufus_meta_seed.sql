INSERT INTO _meta.apps (name, schema_name, vercel_project, github_repo, stage, supabase_status, notes) VALUES
  ('Rufus', 'rufus', 'rick-allen-s-projects/rufus', 'rallen7425/rufus', 'prototype',
   'shared rocky-coast-labs project',
   'Family Chief of Staff app — single-household, no auth. Standalone Next.js repo at /Users/rallen/Documents/Claude/Projects/rufus (not part of this Turborepo). rufus schema onboarded 2026-08-22 with events/todos/keep_in_mind_items/family_members/gmail_credentials/email_scan_log, RLS deny-by-default (no anon/authenticated grants at all — every table is service_role only). No Vercel deployment yet.')
ON CONFLICT (name) DO UPDATE SET
  schema_name = EXCLUDED.schema_name,
  vercel_project = EXCLUDED.vercel_project,
  github_repo = EXCLUDED.github_repo,
  stage = EXCLUDED.stage,
  supabase_status = EXCLUDED.supabase_status,
  notes = EXCLUDED.notes,
  updated_at = NOW();
