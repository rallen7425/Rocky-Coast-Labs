# Summer Village Life — Project Brief

---

## 🗂 Session Status (updated 2026-08-23 — end of session)

### Current status

Production is live, stable, and verified at the current build (`vercel deploy --prod` → `vercel promote` → curl asset-hash check, all clean as of this write-up). All 17 migrations through `20260823000009` are applied to the remote database. `git` is clean and pushed to `origin/main` — no uncommitted work. The monorepo cutover (this app deploys from `rocky-coast-labs`, not the old standalone `Rocky-Coast-Guides` repo, same Vercel project `prj_8Y6MvpbBi4Ln0ohgPZrQkQ6b5t0n`) is stable; the standalone repo remains a dormant, untouched fallback, not yet archived.

The admin console (`/admin`) now has real, working CRUD for Alerts, Announcements, Events (with simple recurrence, including making an *existing* event recurring), and Amenities (with sub-amenity grouping, drag-and-drop reordering, and photo upload). The guest-facing app has live weather, real events/amenities/alerts/announcements data, and routed detail pages for events and amenities.

### Completed this session (chronological)

1. **Weather/tide feature** — `WeatherRow` wired to real `weather_cache` data, cron scheduled every 30 min.
2. **Found and fixed a 44-day-stale production domain** — `summer-village-life.vercel.app` was pinned to a July-10 deployment and hadn't moved across 6+ prior `vercel deploy --prod` runs. Root cause in the Vercel dashboard's domain-tracking settings was never fully confirmed (not CLI-reachable), but the workaround (`vercel deploy --prod` → `vercel promote "$DEPLOY_URL"` → curl asset-hash verify, all in the Deploying section below) has been used successfully for every deploy since and should be treated as the permanent runbook, not a one-off fix.
3. **Fixed anon RLS gaps** on `amenities`/`events` (guests couldn't read either table) and removed a hardcoded `STATIC_EVENTS` fallback in `EventsScroll` that had been silently masking the bug with fake June-2026 data.
4. **Built the full Calendar/Announcements/Amenities feature** — new `announcements` table + admin page + Home banner; `events` gained description/long_description/url/is_all_day/address/recurrence_id with full admin CRUD and a new `/events/:id` detail page; `amenities` gained parent_id/description/long_description/photo_url/rules/hidden with full admin CRUD, a new Storage bucket (`village-summer-amenity-photos`), and a new `/amenities/:id` detail page. Explicitly deferred per user decision: AI-ish event ingestion (email upload, web-link import, AI web-scan proposals) — not built, schema left open for it later.
5. **Fixed a stale-cache bug that made real saves look like they'd failed** — the service worker was caching Supabase API *responses* (`StaleWhileRevalidate`, not just static assets), so a successful admin write's own list-refresh could be served pre-write data. Switched to `NetworkFirst`. Separately, added a `controllerchange` listener so an already-open tab reloads once a new service worker takes over, instead of silently running stale JS indefinitely — this class of "the fix isn't showing up" report came up repeatedly this session before the listener existed.
6. **Added edit + hard delete to Admin Alerts** (previously dismiss-only, no way to remove or fix a mistake).
7. **Added recurrence support when editing an existing event**, not just when creating a new one (the toggle previously only appeared on "New Event").
8. **Fixed the admin modal cutting off its own top** (Name field unreachable, blocking creation) — two real, distinct causes found and fixed: a flexbox vertical-centering overflow quirk (switched to always top-aligned), and iOS Safari's `position: fixed` behaving relative to the layout viewport rather than the visual one when the background page was pre-scrolled (added a body-scroll-lock while the modal is open, plus `100dvh`-based sizing). **Not yet confirmed fixed on the user's actual device** — see Known Issues.
9. **Added drag-and-drop reordering to Admin Amenities** (`@dnd-kit`) — the admin order is now the app order, since the guest-facing query already read `sort_order`.
10. **Added bulk/inline sub-amenity management** — editing a top-level amenity now shows a Sub-Amenities section to either add a brand-new child by name or attach an *existing* amenity as a child, fixing a real workflow gap (previously you could only link one amenity to a parent at a time, from that child's own edit form). Caught and fixed a real safety bug before shipping: removing an item from this list now *detaches* it (`parent_id` → null) rather than hard-deleting it. Used this to actually fix the user's real "Pools" amenity, which existed empty with its three pools still unattached at top-level — verified via direct DB query and the live guest-facing page.

### Known issues / what's broken

1. **Modal top-cut-off — fixed twice, unconfirmed on the reporter's device.** Both root causes found and fixed (see #8 above) were reproduced and verified in this session's own testing (both desktop and mobile-emulated viewports, including the specific "background page pre-scrolled" scenario). The user reported it a third time after the *first* fix; a second, different root cause was found and fixed, but no screenshot or device/browser info was ever obtained to confirm the second fix actually resolved what they were seeing. **If this recurs, get a screenshot and device/browser details (installed PWA vs. a regular Safari/Chrome tab) before attempting another blind fix** — two rounds of guessing-then-fixing is already more than ideal, and a third without evidence risks fixing a third real bug while missing whatever it is they're still seeing, or chasing something that's actually just stale-tab caching (see item 5 in Completed This Session — a tab open since before that fix shipped won't have picked it up without one manual reload).
2. **New admin accounts get routed into the guest onboarding wizard instead of `/admin`.** `App.tsx`'s `needsOnboarding` check is just `!profile.cottageNumber` with no admin exemption. Not addressed this session — carried over.
3. **Content pages not built.** Menu items (Arrival Guide, Renter's Guide, WiFi, Property Rules, FAQ) tap to nothing; `content_pages` table is seeded but has no guest-facing detail screens and no admin management page either. Not addressed this session — carried over.
4. **Unverified routing edge case, carried over from before the cutover:** whether a user who clears `localStorage` but still holds a live Supabase session cookie is routed correctly by `RequireAuth`. Looks correct by inspection, never exercised end-to-end.
5. **No bulk edit/cancel of a whole recurring event series** — by design, MVP scope is create-a-series-only (both for new events and for making an existing event recurring). Editing or deleting one instance never affects its siblings.
6. **AI event ingestion (email upload, web-link import, AI web-scan-and-propose) is out of scope** — explicit user decision, not a bug. Schema doesn't preclude adding it later.

### Next session should pick up from

- If the modal issue is reported again: get a screenshot + device info first (see Known Issue 1) before changing code.
- The "next round" admin issues (Known Issues 2–3 above) were explicitly deferred by the user before this session's Calendar/Announcements/Amenities work took over — worth checking if they're still the priority, or if AI event ingestion (explicitly deferred, see Known Issue 6) has moved up.
- Low priority, no urgency: the Vercel dashboard's domain-tracking setting for `summer-village-life.vercel.app` was never actually inspected (Settings → Domains isn't CLI-reachable) — the `vercel promote` + curl-verify workaround has been solid across many deploys this session, so this is a nice-to-have root-cause close-out, not a blocker.

### Infrastructure

| Resource | Detail |
|---|---|
| **GitHub repo** | `git@github.com:rallen7425/Rocky-Coast-Labs.git` (monorepo — this app lives at `apps/summer-village`). The old `rallen7425/Rocky-Coast-Guides` repo still exists as an untouched dormant fallback. |
| **Live URL** | https://summer-village-life.vercel.app |
| **Admin URL** | https://summer-village-life.vercel.app/admin |
| **Vercel project** | `rick-allen-s-projects / summer-village-life` (ID: `prj_8Y6MvpbBi4Ln0ohgPZrQkQ6b5t0n`) — Git source: `rocky-coast-labs`, Root Directory: `apps/summer-village` |
| **Supabase project** | `rocky-coast-labs` (ref `kywdezqgrtpzuecxxvfc`) — shared project, schema `village_summer` |
| **Admin credentials** | `rallen7425@gmail.com` (role: admin) — password in `rocky-coast-labs/.secrets/rcg-admin-password.txt` (gitignored). Verified working 2026-08-23. |

**Two real Vercel/Turbo gotchas hit during the cutover** (see `rocky-coast-labs/ARCHITECTURE.md` for the full writeup):
- Vercel's "sensitive" env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are write-only and only resolvable during Vercel's own **remote** build — a local `vercel build` (even with `--prod`) silently bakes in *empty* values instead of erroring, which broke production for a few minutes before a `vercel rollback` fixed it. **Always deploy with `vercel deploy --prod` (no `--prebuilt`) from the repo root**, never build locally and deploy prebuilt output.
- Turbo 2.x needs `packageManager` set in the monorepo root `package.json` to resolve the npm workspace during a Vercel build — already fixed there, don't remove it.
- Also: this app has a PWA service worker that aggressively caches assets. If a fix doesn't appear to be live after a deploy, check for a stale service worker before assuming the deploy failed (`navigator.serviceWorker.getRegistrations()` + `caches.keys()` in devtools, unregister/clear, hard reload).
- **Fixed 2026-08-23**: that same service worker was also caching every Supabase REST *response* (`vite.config.ts`'s `runtimeCaching`), not just static assets — `StaleWhileRevalidate` with a 1hr TTL. A real admin insert/update would succeed, but the list re-fetch right after it was answered from the pre-write cache, making a genuine save look like it silently failed (reported live: a new alert and event both actually saved, neither appeared to). Switched to `NetworkFirst` (cache name bumped to `supabase-cache-v2`). **This class of bug can only be caught with a production-mode build** (`npm run build && npm run preview`, or the `summer-village-preview` launch.json entry) — `vite dev` doesn't run the real service worker, so this kind of regression is invisible in normal dev testing.

### Deploying

```bash
cd /Users/rallen/Documents/Claude/Projects/rocky-coast-labs
DEPLOY_URL=$(vercel deploy --prod)   # remote build — required, see the sensitive-env-var gotcha above
vercel promote "$DEPLOY_URL"         # reassign ALL production domains — see the stale-alias gotcha below
```
Do **not** `vercel build` locally then `vercel deploy --prebuilt` for this project — see Infrastructure notes above for why.

**Mandatory post-deploy check — the live domain has silently failed to update before (see "Completed this session" #2 above).** Never trust the deploy command's own success output:
```bash
curl -s https://summer-village-life.vercel.app/ | grep -o 'assets/index-[a-zA-Z0-9]*\.js'
```
Compare the hash against the asset filename in the just-completed build's own output. If they don't match, `vercel promote` didn't take effect — fall back to `vercel alias set "$DEPLOY_URL" summer-village-life.vercel.app` (confirmed to work) and re-check.

Node version constraint: **Node v20.10.0** — use `vite@5` (not v6+).

---

## Product Overview

**Summer Village Life** is a mobile-first PWA (Progressive Web App) for guests and owners at The Cottages at Summer Village, a 65-acre gated 3-season resort community at 454 Post Road (Route 1), Wells, Maine 04090.

The app gives renters and owners a single destination for community info, amenities, events, and a Southern Maine destination guide. It replaces a fragmented experience currently spread across PDFs, a basic WordPress site, and word-of-mouth.

**Company:** Rocky Coast Guide (Rocky Coast Cottages, LLC — Rick Allen, owner)
**App name:** Summer Village Life
**Destination section:** Rocky Coast Guide (embedded in the app; also designed to stand alone)

### Long-term vision
- Phase 1: PWA (this project) — accessed via QR code at check-in, installable to home screen
- Phase 2: Native iOS/Android via React Native + Expo (reusing most logic)
- Phase 3: Expand the model to other resort communities; Rocky Coast Guide becomes a standalone Southern Maine travel app

### Admin site
A separate React app (same repo, `/admin` route) where a property manager can:
- Publish/dismiss emergency alerts (`/admin/alerts`)
- Post scheduled announcements (`/admin/announcements`)
- Create, edit, hide/show, and delete events, including simple weekly recurrence (`/admin/events`)
- Create, edit, hide/show, and delete amenities — hours, status, sub-amenities, photos (`/admin/amenities`)
- Manage content pages (FAQ, arrival guide, property rules, etc.) — not yet built, see Known Issues

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite | Fast builds, HMR |
| Styling | Tailwind CSS v3 | Utility-first, matches design system |
| Routing | React Router v6 | Client-side routing |
| Backend / DB | Supabase | Postgres, Auth, real-time subscriptions, storage |
| PWA | vite-plugin-pwa | Service worker, offline cache, installable |
| Hosting | Vercel | Auto-deploy from main branch |
| Fonts | Google Fonts | Plus Jakarta Sans + Manrope (see design system) |

### Key packages
```
react-router-dom
@supabase/supabase-js
vite-plugin-pwa
workbox-window
lucide-react          # icons (replaces emoji placeholders in prototypes)
date-fns              # date formatting
```

---

## Design System — Coastal Haven

See `/DESIGN.md` for full spec. Summary:

### Colors
```css
--primary:            #103457;  /* Deep Navy — headers, primary actions */
--primary-container:  #2b4b6f;  /* Mid Navy */
--secondary:          #3f6371;  /* Muted Teal — section labels, accents */
--secondary-container:#c2e8f8;  /* Light Blue */
--inverse-primary:    #a9c9f3;  /* Soft Blue — on-site badges */
--sandy:              #E8DED1;  /* Sandy Neutral — warm backgrounds */
--surface:            #f8f9fa;  /* White surfaces */
--on-surface:         #191c1d;  /* Near-black text */
--error:              #ba1a1a;  /* Emergency / alerts */
--today:              #f0a500;  /* Amber — Today tag, off-property distances */
--tomorrow:           #1b9e8a;  /* Bright Teal — Tomorrow tag */
--open-green:         #7ee8a2;  /* On-site location badge, Open status */
```

### Typography
```css
/* Headings */
font-family: 'Plus Jakarta Sans', sans-serif;
/* Body, labels, meta */
font-family: 'Manrope', sans-serif;
```

### Glass card pattern (used throughout app)
```css
background: rgba(255, 255, 255, 0.13);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.22);
border-radius: 16px;
```

### Gradient overlay (over barn photo background)
```css
background: linear-gradient(
  180deg,
  rgba(8,18,36,0.82) 0%,    /* dark — status bar / greeting */
  rgba(8,18,36,0.28) 20%,
  rgba(8,18,36,0.08) 42%,   /* lightest — barn photo shows through */
  rgba(8,18,36,0.62) 65%,
  rgba(8,18,36,0.92) 85%,   /* dark — modules readable */
  rgba(8,18,36,0.96) 100%
);
```

---

## Navigation Structure

Floating pill nav bar (355px wide, navy, bottom 20px), 5 tabs:

| Index | Label | Icon (Lucide) | Route |
|---|---|---|---|
| 0 | Home | `Home` | `/` |
| 1 | Village | `Building2` | `/village` |
| 2 | Events | `Calendar` | `/events` |
| 3 | Guide | `Compass` | `/guide` |
| 4 | Menu | `Menu` | — (drawer, not a route) |

The Menu tab opens a slide-in drawer from the left (75% screen width, white background) rather than navigating to a new page.

---

## Pages & Component Inventory

### `/` — Home

**Background:** Full-bleed barn photo (`/assets/sv-barn.jpg`) with gradient overlay. Content scrolls over the fixed background; hero photo shows through a flexible spacer between the greeting and the modules.

**Layout:** Single scrollable column. Modules anchor to the bottom — hero spacer grows to fill remaining space.

**Modules (top to bottom):**

1. **YourPlanCard** — double-height glass card
   - Header: "Your Plan" eyebrow + date + check-out badge
   - Row 1: featured tonight's event (dynamic)
   - Row 2: beach conditions (tide + wind)
   - Footer: "Edit your plan →" action link

2. **WeatherRow** — 3-section glass card
   - Temp (current + feels like)
   - Next Tide (time + type, e.g. "Low Tide")
   - Beach conditions (Ideal / Fair / Poor + wind speed)

3. **EventsScroll** — horizontal scroll, glass cards
   - Up to 6 cards + "View All →" card
   - First card: next on-property event
   - Cards show: day tag (Today/Tomorrow/day name), on-site location (green) or distance (amber), title, time, venue
   - Data from `events` table, filtered to upcoming 7 days

**Top area (not scrollable with modules):**
- Status bar
- Greeting: "Good Morning / Welcome to Summer Village"
- AlertBanner (dismissible, red) — driven by active `alerts` table row

---

### `/village` — The Village

**Background:** Same barn photo.

**Sections:**

1. **PropertyMap** — 180px tall card with embedded thumbnail (`/assets/sv-map-thumb.jpg`). "Full map →" expands to full-screen view of `/assets/sv-map-full.jpg`.

2. **Amenities** — one unified list card, data from `amenities` table grouped by `parent_id` (top-level = `parent_id IS NULL`, each with its own sub-amenities nested directly beneath, indented). **Breaking change from the original MVP spec (2026-08-23)**: this replaced a hardcoded two-section Pools/Amenities split (`category = 'pool' | 'amenity'`) — that `category` column still exists with historical data but is no longer read or written anywhere; grouping is now generic and admin-configurable via the "Sub-amenity of" picker on `/admin/amenities`. Tapping a row navigates to `/amenities/:id`.

3. **Schedules** — static links
   - Barn Schedule
   - (Beach Access removed — not applicable)

#### `/amenities/:id` — Amenity Detail

Routed page (not a modal/overlay). Shows photo (if set, from the `village-summer-amenity-photos` Storage bucket), status badge (if not "open"), hours, age restriction, short description, long description, and additional rules — all optional except name.

---

### `/events` — Events & Activities

**Background:** Same barn photo.

**Components:**
- **FilterChips** — All / On-Site / Nearby / This Weekend (client-side filter)
- **DateGroup** — label + EventListCard per date group
- **EventListItem** — dot indicator (blue = on-site, amber = off-property) + title + time + location badge, tappable → `/events/:id`
  - On-site: green location text (venue name, e.g. "Barn") top-right
  - Off-property: amber distance text (e.g. "~12 mi") top-right

**Data:** `events` table, ordered by date/time, grouped by date client-side. Guests only ever see `is_active = true` rows (RLS); the admin console shows everything, hidden or not.

#### `/events/:id` — Event Detail

Routed page — the app's first routed detail page, established together with `/amenities/:id` in the same 2026-08-23 build. Shows date/time (or "All day"), location (on-site venue, or off-site address/city + distance), short description, long description, and an optional external web link.

---

### `/guide` — Rocky Coast Guide

**Background:** Rocky Coast photo (`/assets/rocky-coast-guide.jpg`) — distinct from barn photo to signal a different section of the app.

**Sections:**
1. **StaffPick** — navy glass card, "Staff Pick Today" with featured recommendation
2. **CategoryGrid** — 2-column grid: Beaches, Restaurants, Attractions, Shopping
3. **ConditionsRow** — list: Tide Charts, Sunrise/Sunset, Route 1 Traffic
4. **DayTrips** — list: Portland, White Mountains, Acadia

This section is designed to stand alone as its own app eventually — keep Guide components isolated under `/src/features/guide/`.

---

### Menu Drawer (not a route)

Triggered by Menu tab. Slides in from left, covers 75% of screen (292px on 390px viewport). White background, navy header.

**Sections & items:**
- **Profile:** Profile, Cottage, Notifications
- **Renters:** Arrival Guide, Renter's Guide, WiFi, Property Rules
- **Owners:** Owner's Page *(only visible to owner role)*
- **Contact:** Front Desk, Emergency (red)
- **Information:** FAQ, Community Website

---

## Supabase Schema (MVP)

### `alerts`
```sql
id          uuid primary key default gen_random_uuid()
message     text not null
severity    text default 'warning'  -- 'info' | 'warning' | 'emergency'
is_active   boolean default true
created_at  timestamptz default now()
expires_at  timestamptz            -- null = no expiry
```

### `events`
```sql
id                uuid primary key default gen_random_uuid()
title             text not null
date              date not null
time_start        time
time_end          time
is_onsite         boolean default true
venue             text                 -- 'Barn', 'Pavilion', 'York', etc.
distance_miles    numeric(4,1)         -- null if on-site
city              text                 -- null if on-site (short display, e.g. 'Ogunquit')
address           text                 -- null if on-site (full street address, detail page only)
category          text                 -- 'community' | 'arts' | 'food' | 'auto' | etc.
is_active         boolean default true -- reused as the hide/show flag; a real DELETE is used for hard-delete
created_at        timestamptz default now()
description       text                 -- short, shown on cards
long_description  text                 -- optional, detail page only
url               text                 -- optional external web link, detail page only
is_all_day        boolean not null default false
recurrence_id     uuid                 -- tags rows generated from one recurring input; create-a-series only, no bulk edit
```

### `amenities`
```sql
id               uuid primary key default gen_random_uuid()
name             text not null
category         text                 -- LEGACY, superseded by parent_id — no longer read or written
status           text default 'open'  -- 'open' | 'closed' | 'maintenance'
hours_open       time
hours_close      time
location         text                 -- 'Downstairs at the Barn', etc.
notes            text
age_restriction  text                 -- 'Ages 16 and up', null if none
sort_order       int default 0
parent_id        uuid references amenities(id) on delete cascade  -- null = top-level; sub-amenity hierarchy
description      text                 -- short, shown on the /village list
long_description text                 -- optional, detail page only
photo_url        text                 -- storage object path in village-summer-amenity-photos, not a full URL
rules            text                 -- "Additional Rules", detail page only
hidden           boolean not null default false  -- curation axis, independent of `status` (operational axis)
```

### `announcements`
```sql
id          uuid primary key default gen_random_uuid()
message     text not null
starts_at   timestamptz not null default now()
ends_at     timestamptz not null default (date_trunc('day', now()) + interval '1 day')
created_at  timestamptz default now()
```
*No hide/show flag — visibility is entirely governed by the `starts_at`/`ends_at` window (public RLS policy: `starts_at <= now() AND ends_at > now()`). Calmer/lower-urgency than `alerts`; supports multiple simultaneous banners.*

### `content_pages`
```sql
id          uuid primary key default gen_random_uuid()
slug        text unique not null  -- 'arrival-guide' | 'renters-guide' | 'faq' | 'property-rules'
title       text not null
body        text                  -- markdown
updated_at  timestamptz default now()
```

### `weather_cache`
```sql
id            uuid primary key default gen_random_uuid()
fetched_at    timestamptz default now()
temp_f        numeric(4,1)
feels_like_f  numeric(4,1)
wind_mph      numeric(4,1)
beach_status  text              -- 'Ideal' | 'Fair' | 'Poor'
next_tide_at  timestamptz
next_tide_type text             -- 'Low' | 'High'
```
*Populated by a Supabase Edge Function on a cron schedule (every 30 min). App reads from this table rather than calling weather APIs directly — keeps API keys server-side and supports offline cache.*

### Auth / Roles
Use Supabase Auth. Store role in `users` table or user metadata:
```sql
-- user_metadata in Supabase Auth
{ "role": "renter" | "owner" | "admin" }
```
- **Renter:** Default. Sees all community content. Owners section in Menu hidden.
- **Owner:** Sees Owners section in Menu. Future: owner-specific dashboard.
- **Admin:** Access to admin site. Can write to all tables.

Role assigned during onboarding flow (or manually by admin for owners).

---

## Key Assets

| File | Location | Notes |
|---|---|---|
| Barn photo | `/assets/sv-barn.jpg` | Home/Village/Events background |
| Rocky Coast photo | `/assets/rocky-coast-guide.jpg` | Guide section background |
| Map thumbnail | `/assets/sv-map-thumb.jpg` | Village page map card |
| Map full | `/assets/sv-map-full.jpg` | Full-screen map view |
| Design system | `/DESIGN.md` | Full color/type/spacing spec |

---

## HTML Prototypes (Reference)

All 5 screens are prototyped as standalone HTML files in this directory. Use them as the visual specification — every card, spacing, gradient, and icon in the production app should match these prototypes.

| File | Screen |
|---|---|
| `summer-village-life-home.html` | Home |
| `summer-village-life-village.html` | Village |
| `summer-village-life-events.html` | Events |
| `summer-village-life-guide.html` | Rocky Coast Guide |
| `summer-village-life-menu.html` | Menu drawer |

---

## Build Order (Recommended)

1. **Project scaffold** — Vite + React + Tailwind + React Router + Supabase client
2. **Design tokens** — Tailwind config from design system colors/fonts
3. **Shared components** — GlassCard, FloatingNav, StatusBar, SectionLabel, RowItem
4. **Home screen** — static first (no Supabase), then wire AlertBanner and EventsScroll to live data
5. **Supabase schema** — run migrations, seed with sample data
6. **Village page** — amenities + pools pulling from Supabase, real-time status updates
7. **Events page** — full list with filters, live from `events` table
8. **Menu drawer** — with role-based section visibility
9. **Guide section** — static content first, staff picks from Supabase later
10. **PWA config** — service worker, offline cache for critical routes, installable manifest
11. **Admin site** — alert publisher, event CRUD, amenity status manager
12. **Auth + onboarding** — role assignment, cottage number, check-in/out dates

---

## Notes for Claude Code

- Match the HTML prototypes visually. When in doubt, inspect the prototype HTML/CSS.
- Glassmorphism cards use `backdrop-filter: blur(20px)` — ensure Tailwind config includes `backdropBlur`.
- The floating nav is `position: fixed` at `bottom: 20px`, centered, 355px wide pill shape.
- The home screen background image is `position: fixed` so it stays still while content scrolls.
- Icons: use `lucide-react` throughout. The prototype uses emoji/SVG as placeholders — replace with Lucide equivalents.
- All text minimum 11px (labels), 12px (meta), 13px (body). The prototypes have some 9-10px labels that should be bumped up in production.
- The Menu is a drawer, not a page — implement as an overlay component controlled by a global state or context, triggered from FloatingNav.
- Keep Guide components isolated under `/src/features/guide/` — it's designed to become a standalone product.
