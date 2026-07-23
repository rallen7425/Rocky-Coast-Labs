# Rocky Coast Labs — Shared Platform

Umbrella studio name for a portfolio of independent prototype apps. Most are experiments that may never progress past prototype stage, so infrastructure stays on free tiers: Vercel Hobby (unlimited projects, no cost) + one shared Supabase free-tier project (avoids the multi-project sprawl that already happened once — see History below).

## Core convention: one Supabase project, one schema per app

**Shared project:** `rocky-coast-labs` (ref `kywdezqgrtpzuecxxvfc`, region `us-east-1`).

Each app gets its own Postgres schema, never `public`:

| App | Schema | Status |
|---|---|---|
| Sonic Radar | `sonicradar` | Live in production — migrated 2026-07-10 |
| Distilled | `distilled` | Live in production — migrated 2026-07-10 |
| Rocky Coast Guide / Summer Village | `village_summer` (`rockycoast_core` reserved, unused) | Live in production — migrated 2026-07-10 |
| PM ReArchitected | `pm_rearchitected` | Live in production — AI Glossary migrated 2026-07-23 |
| Is It Offensive? | — | No database; doesn't need one |
| Portfolio tracking | `_meta` | Live |

**All apps that need a database are now fully migrated, deployed, and automated-verified** (headless curl/browser checks confirming real data renders — see History). PM ReArchitected's AI Glossary (categories/terms/aliases/related_terms/sources, public read-only, no auth) was the fourth app onboarded, added 2026-07-23 — same pattern as the original three, minus the `authenticated` grants since this app has no login concept. What's still outstanding is manual, hands-on testing of each app in normal day-to-day use, planned for a future session — see "Next steps" below.

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

`auth.users` is project-wide and shared, but only apps that actually want cross-app identity should use it. So far Rocky Coast Guide (village apps sharing bookmarks/identity) and Distilled (email/password + Google OAuth, though local dev mostly bypasses it via `DEV_BYPASS_USER_ID`) use real Supabase Auth. Sonic Radar, PM ReArchitected, and Is It Offensive don't. Don't build auth in preemptively for an app that hasn't asked for it.

**Gotcha: Supabase Auth logins are project-wide, not per-schema.** Since every app now shares one Supabase project, the same email can only be registered once across the *entire* project — not once per app. Creating a test/admin account for App A with `you@example.com`, then trying to create a *different* test account for App B with the same email, fails outright ("already registered"). If two apps each need their own separate test identity, use distinct addresses (Gmail's `+tag` addressing works fine — `you+appname@gmail.com` still lands in the same inbox but registers as a distinct account). This came up for real: Rocky Coast Guide's admin account and Distilled's test account both wanted `rallen7425@gmail.com`; Distilled's ended up as `rallen7425+distilled@gmail.com` instead.

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

**Current status: scaffold only, and now stale** (created 2026-07-10, before the standalone repo's own cutover). `apps/summer-village` is a snapshot of the standalone app taken *before* it was migrated to `village_summer` — it still has the old code pointing at the retired standalone Supabase project. The actual migrated, deployed code lives in the standalone repo (`rallen7425/Rocky-Coast-Guides`), not here. `packages/rocky-coast-core`, `packages/rocky-coast-auth`, `packages/ui` are still empty placeholders. Before doing anything with this monorepo in a future session, re-sync `apps/summer-village` from the standalone repo's current state first. The live `summer-village-life.vercel.app` deployment runs from the standalone repo, not from this monorepo.

Other apps (PM ReArchitected, Distilled, Sonic Radar, Is It Offensive) are standalone — no shared code, don't force them into this monorepo.

## History (why this exists)

By the time this shared platform was built (2026-07-10), three apps already had separate live standalone Supabase projects — exactly the sprawl this is meant to prevent:
- Distilled (`qyjkqfgodgnjlvjdyuci`) — active, in daily use.
- Sonic Radar (`supabase-red-diamond` / `nxthgmqmgdgatqjnywhs`) — had gone inactive and paused; held real enrichment data (958 albums, all with AI-generated summaries, chart rankings) that needed rescuing before migrating. Rescued via REST API dump (no direct DB password was available, so `pg_dump`/`psql` weren't an option — a full JSON export + REST re-insert into the new schema worked fine for a single-table app this size).
- Rocky Coast Guide (`anlwanoqrixidexfvyfq`) — active, has real seeded content and an admin login.

All three were migrated the same day, in this order: Sonic Radar first (as the pattern-proving pilot, lowest stakes since it had no live users), then Distilled, then Rocky Coast Guide. Each followed the same steps: rescue/back up data via REST API export, create the schema + scoped grants (never `GRANT ALL` to `anon` — caught as a real mistake during the first migration), re-point the app's client to the schema, verify (locally, then via automated headless checks against production), then redeploy. All three old standalone projects are now **paused** as free, dormant backups — a deliberate choice over deleting them outright, since paused projects don't count against the free tier's active-project limit and cost nothing to keep as a safety net.

Two things worth knowing about that limit, learned empirically rather than documented anywhere by Supabase: it's **2 concurrently active projects**, not 2 total — paused projects are free and don't count. And `supabase config push` pushes the CLI's local `config.toml` wholesale (api + auth + storage sections together), not just the schema-exposure diff you meant to change — it silently overwrote this project's Auth defaults with generic local-dev values the first time it ran. Not a live problem today (no app here relies on those settings yet), but review `[auth]`/`[storage]` in `config.toml` before ever running that command again.

For Distilled and Rocky Coast Guide specifically: neither app's real Supabase Auth accounts were migrated, since no real end users existed at migration time (confirmed with the user beforehand) — only test/dev accounts. Distilled's local dev already uses a fixed `DEV_BYPASS_USER_ID` test user (unaffected). Rocky Coast Guide's real admin login was recreated fresh via the Supabase Admin API (`role: admin` in `user_metadata`) and verified working end-to-end (guest mode + `/admin` console) on production.

## Next steps (as of 2026-07-10)

1. **Manual redeploy/testing pass** on all three migrated apps, in a future session — today's verification was automated (curl + headless-browser checks confirming real data renders correctly), not hands-on human testing of the actual day-to-day workflows.
2. **Then resume Distilled product work** — held off during this whole infra push. Priority order (per the user, deliberately *not* the onboarding-first order in Distilled's own CLAUDE.md): resolve outstanding UI issues, fix content-management inconsistencies, finish outstanding Zones work — all before circling back to rebuilding onboarding.
3. Rocky Coast Guide's Turborepo shared-code extraction (`packages/rocky-coast-core`, `packages/rocky-coast-auth`, `packages/ui`) stays deferred until a second village app actually exists to justify it — building it now would be speculative.
4. PM ReArchitected has no Vercel deployment yet (only GitHub) — not blocking anything, just not done.
