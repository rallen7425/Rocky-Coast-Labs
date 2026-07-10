# Rocky Coast Labs — Shared Platform

Umbrella studio name for a portfolio of independent prototype apps. Most are experiments that may never progress past prototype stage, so infrastructure stays on free tiers: Vercel Hobby (unlimited projects, no cost) + one shared Supabase free-tier project (avoids the multi-project sprawl that already happened once — see History below).

## Core convention: one Supabase project, one schema per app

**Shared project:** `rocky-coast-labs` (ref `kywdezqgrtpzuecxxvfc`, region `us-east-1`).

Each app gets its own Postgres schema, never `public`:

| App | Schema | Status |
|---|---|---|
| Sonic Radar | `sonicradar` | Live — migrated 2026-07-10 |
| Distilled | `distilled` (reserved) | Not yet migrated — still on its own standalone project |
| Rocky Coast Guide / Summer Village | `rockycoast_core`, `village_summer` (reserved) | Not yet migrated — still on its own standalone project |
| PM ReArchitected | — | No database; doesn't need one |
| Is It Offensive? | — | No database; doesn't need one |
| Portfolio tracking | `_meta` | Live |

### Onboarding a new app onto the shared project

1. Pick a schema name (lowercase, app-specific — e.g. `newapp`).
2. Add a migration under this repo's `supabase/migrations/` that does `CREATE SCHEMA newapp` + your tables + RLS policies.
3. **Don't forget explicit GRANTs** — custom schemas don't inherit the automatic `anon`/`authenticated` grants that `public` gets. Scope them per role, don't `GRANT ALL` to `anon`:
   ```sql
   GRANT USAGE ON SCHEMA newapp TO anon, authenticated, service_role;
   GRANT SELECT ON ALL TABLES IN SCHEMA newapp TO anon;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA newapp TO authenticated;
   GRANT ALL ON ALL TABLES IN SCHEMA newapp TO service_role;
   ```
4. `supabase db push` (this repo is already linked to the shared project).
5. Add `newapp` to `schemas` in `supabase/config.toml`, then `supabase config push` — **but push it schema-by-schema in your head first**: this command pushes the *entire* local config (api, auth, storage), not just the diff you care about. If auth/storage settings in `config.toml` haven't been deliberately set for this project yet, review them before pushing or you'll silently overwrite real remote settings with generic local-dev defaults (this happened once already — see History).
6. In your app, target the schema explicitly: `createClient(url, key, { db: { schema: "newapp" } })`. Supabase JS clients default to `public` otherwise.
7. Add a row to `_meta.apps` (see below).

### Service-role key discipline

The shared project has **one** service-role key that bypasses RLS across *every* schema, not just yours. Rules:
- Server-side only, never shipped to a browser client.
- Even though it *can* touch other apps' schemas, application code should only ever query its own schema — don't rely on the key's reach as a feature.

### Auth is opt-in per app

`auth.users` is project-wide and shared, but only apps that actually want cross-app identity should use it. So far only the Rocky Coast Guide family (village apps sharing bookmarks/identity) needs this. Distilled, Sonic Radar, PM ReArchitected, and Is It Offensive don't use Supabase Auth. Don't build auth in preemptively for an app that hasn't asked for it.

Shared identity, when used, should stay invisible to the end user — no visible cross-app branding or shared login screen implying "one account for everything." Think Automattic/WordPress.com: one underlying account system, no visible tie-in between products.

## `_meta.apps` — portfolio tracking table

One row per app, so status is visible without checking 5 separate Supabase/Vercel/GitHub dashboards:

```
name, schema_name, vercel_project, github_repo, stage ('prototype'|'active'|'retired'), supabase_status, notes, updated_at
```

Query it directly (exposed, public-read):
```
GET {SUPABASE_URL}/rest/v1/apps   (Accept-Profile: _meta header, anon key)
```

## Rocky Coast Guide monorepo (`apps/`, `packages/`)

The one app family with actual shared code — Rocky Coast Guide (standalone regional app) and per-village apps (Summer Village Guide, future Community 2) share regional content and UI. Structured as a Turborepo, each app still deploys as its own independent Vercel project (Root Directory pointed at the specific `apps/*` folder).

**Current status: scaffold only** (created 2026-07-10). `apps/summer-village` is a copy of the standalone app, still pointing at its own standalone Supabase project (`anlwanoqrixidexfvyfq`) — not yet repointed to `village_summer` in the shared project, not yet wired to Vercel/GitHub from this repo. `packages/rocky-coast-core`, `packages/rocky-coast-auth`, `packages/ui` are empty placeholders. The live `summer-village-life.vercel.app` deployment still runs from the original standalone repo (`rallen7425/Rocky-Coast-Guides`).

Other apps (PM ReArchitected, Distilled, Sonic Radar, Is It Offensive) are standalone — no shared code, don't force them into this monorepo.

## History (why this exists)

By the time this shared platform was built (2026-07-10), three apps already had separate live standalone Supabase projects — exactly the sprawl this is meant to prevent:
- Distilled (`qyjkqfgodgnjlvjdyuci`) — active, in daily use.
- Sonic Radar (`supabase-red-diamond` / `nxthgmqmgdgatqjnywhs`) — had gone inactive and paused; held real enrichment data (958 albums, all with AI-generated summaries, chart rankings) that needed rescuing before migrating. Rescued via REST API dump (no direct DB password was available, so `pg_dump`/`psql` weren't an option — a full JSON export + REST re-insert into the new schema worked fine for a single-table app this size). Old project kept around, paused, as a dormant backup.
- Rocky Coast Guide (`anlwanoqrixidexfvyfq`) — active, has real seeded content and an admin login.

Sonic Radar was the first (and so far only) app fully cut over to the shared project. Distilled and Rocky Coast Guide are still running on their original standalone projects — migrating them is future work, following the same pattern Sonic Radar's cutover established: rescue/back up data first if there's anything live, create the schema + scoped grants in the shared project, re-point the app's client, verify locally, then redeploy.
