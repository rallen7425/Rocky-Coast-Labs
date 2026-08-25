-- Infra naming cleanup: the app's working name "Rufus" was never meant to
-- leak into infrastructure naming (schema, folder, package name) — the
-- product should stay generically named so it can be rebranded later
-- without unwinding file structure or code. GitHub repo and Vercel project
-- were already correctly named "Family-Chief-of-Staff" (2026-08-22); this
-- migration brings the Postgres schema in line with that.
ALTER SCHEMA rufus RENAME TO family_chief_of_staff;

UPDATE _meta.apps SET
  name = 'Family Chief of Staff',
  schema_name = 'family_chief_of_staff',
  github_repo = 'rallen7425/Family-Chief-of-Staff',
  notes = notes || ' Schema renamed rufus -> family_chief_of_staff 2026-08-25 for infra-naming consistency (chat persona name "Rufus" retained in the UI only, now driven by a single ASSISTANT_NAME constant in the app code).',
  updated_at = NOW()
WHERE schema_name = 'rufus';
