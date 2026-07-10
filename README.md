# Rocky Coast Labs

Turborepo for the Rocky Coast Guide app family (shared regional content + per-village apps). See `ARCHITECTURE.md` for the shared Supabase/Vercel platform conventions used across the whole Rocky Coast Labs portfolio, not just this monorepo.

## Structure

```
apps/
  summer-village/   Village app #1 — copied from the standalone repo as a scaffolding step.
                     Still points at its own standalone Supabase project; not yet cut over
                     to the shared rocky-coast-labs Supabase project or repointed in Vercel.
packages/
  rocky-coast-core/ Shared regional components/queries/types — placeholder, not yet extracted.
  rocky-coast-auth/ Shared Supabase auth client/hooks for the guide family — placeholder.
  ui/               Shared design system — placeholder.
```

## Status

Scaffold only (created 2026-07-10). The live `summer-village-life.vercel.app` deployment
still runs from the original standalone repo (`Rocky Coast Guide/Rocky Coast Guide/app`,
pushed to `rallen7425/Rocky-Coast-Guides`) — nothing here is deployed yet. A future session
will: extract shared code into the `packages/*` placeholders, migrate `summer-village`'s
schema into the shared Supabase project's `village_summer` schema, repoint Vercel's root
directory at `apps/summer-village`, and retire the old standalone repo/project.
