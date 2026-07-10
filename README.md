# Rocky Coast Labs

Turborepo for the Rocky Coast Guide app family (shared regional content + per-village apps). See `ARCHITECTURE.md` for the shared Supabase/Vercel platform conventions used across the whole Rocky Coast Labs portfolio, not just this monorepo.

## Structure

```
apps/
  summer-village/   Village app #1 — a SNAPSHOT copied from the standalone repo on
                     2026-07-10, before that standalone repo was itself migrated to the
                     shared project. This copy is now stale — re-sync from the standalone
                     repo before using it for anything.
packages/
  rocky-coast-core/ Shared regional components/queries/types — placeholder, not yet extracted.
  rocky-coast-auth/ Shared Supabase auth client/hooks for the guide family — placeholder.
  ui/               Shared design system — placeholder.
```

## Status

Scaffold only, and the `apps/summer-village` snapshot inside it is now out of date. The
actual live app was migrated separately, directly in its own standalone repo
(`rallen7425/Rocky-Coast-Guides`) — see that repo's `CLAUDE.md` for current status. It now
runs on this shared project's `village_summer` schema and is deployed and verified in
production at `summer-village-life.vercel.app`, but it still deploys FROM the standalone
repo, not from this monorepo.

A future session will: re-sync `apps/summer-village` from the standalone repo's current
(migrated) state, extract shared code into the `packages/*` placeholders once a second
village app actually exists to justify it, repoint Vercel's root directory at
`apps/summer-village`, and retire the old standalone repo.
