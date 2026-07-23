UPDATE _meta.apps SET
  schema_name = 'pm_rearchitected',
  supabase_status = 'rocky-coast-labs (shared)',
  notes = notes || ' AI Glossary feature added 2026-07-23: pm_rearchitected schema (categories/terms/aliases/related_terms/sources), public read-only, no auth.',
  updated_at = NOW()
WHERE name = 'PM ReArchitected';
