# Summer Village Life — Project Brief

---

## 🗂 Session Status (updated 2026-07-10)

**2026-07-10:** Migrated onto the shared `rocky-coast-labs` Supabase project (`village_summer` schema) as part of a portfolio-wide infra consolidation — see the Infrastructure table below and `rocky-coast-labs/ARCHITECTURE.md` for full detail. Verified in production, end to end: guest mode (real alert + events data), admin sign-in → `/admin` console, AND the full renter flow — sign in → 3-step onboarding (name, cottage number, check-in/out dates) → Home/Village/Events/Guide all rendering real data, with the entered name and cottage number correctly reflected ("Welcome, Rick" / "Cottage 42"). This resolves the long-standing "onboarding never tested end-to-end" item below — no issues found.

### Infrastructure

| Resource | Detail |
|---|---|
| **GitHub repo** | `git@github.com:rallen7425/Rocky-Coast-Guides.git` |
| **Live URL** | https://summer-village-life.vercel.app |
| **Admin URL** | https://summer-village-life.vercel.app/admin |
| **Vercel project** | `rick-allen-s-projects / summer-village-life` (ID: `prj_8Y6MvpbBi4Ln0ohgPZrQkQ6b5t0n`) |
| **Supabase project** | `rocky-coast-labs` (ref `kywdezqgrtpzuecxxvfc`) — shared project, schema `village_summer` |
| **Supabase access token** | Personal access token (stored locally — do not commit) |
| **Admin credentials** | `rallen7425@gmail.com` (role: admin, email confirmed) — password in `rocky-coast-labs/.secrets/rcg-admin-password.txt` (gitignored); move to a real password manager and rotate when convenient |

**Migration note (2026-07-10):** Moved from a standalone Supabase project (`anlwanoqrixidexfvyfq`) into the shared `rocky-coast-labs` project's `village_summer` schema, alongside the rest of the Rocky Coast Labs portfolio. `src/lib/supabase.ts` now passes `db: { schema: 'village_summer' }` to `createClient` — don't remove that or queries silently hit (nonexistent) `public.*`. Data migrated as-is (1 alert, 10 events, 11 amenities, 4 content pages, 1 weather_cache row). The admin auth account was **not** migrated (no real end users existed) — a fresh admin account was created directly via the Supabase Admin API instead, and both guest mode and `/admin` are verified working on production. The old standalone project is a candidate to pause now that this is confirmed stable. A Turborepo scaffold for the wider Rocky Coast Guide app family exists at `../../rocky-coast-labs/apps/summer-village` (see that repo's `ARCHITECTURE.md`), but this standalone repo is still what's actually deployed — the monorepo migration (shared code extraction, Vercel repoint) hasn't happened yet.

### What's complete

- ✅ Full app scaffold — Vite 5 + React 18 + TypeScript + Tailwind CSS v3
- ✅ All 5 screens built and matching HTML prototypes: Home, Village, Events, Guide, Menu drawer
- ✅ Supabase schema — migrations `001_schema.sql`, `002_rls.sql`, `003_seed.sql` run against live project
- ✅ Seed data live — 1 alert, 10 events (relative dates), 11 amenities, 4 content pages
- ✅ Auth — LoginPage, 3-step OnboardingPage, AuthProvider, role-based route guards
- ✅ Admin console — `/admin` with Dashboard, Alerts, Events, Amenities CRUD (role-guarded)
- ✅ PWA — service worker, web manifest, offline caching via Workbox
- ✅ Deployed to Vercel production (commit `b52aef8`, latest deploy `dpl_2BvGhFVFySE3rN6oGMLoxfTV3paN`)
- ✅ Supabase env vars set on Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- ✅ Admin user created in Supabase Auth with `role: admin` in user_metadata
- ✅ SplashPage — barn background, "Welcome to Summer Village", Sign In + Continue as Guest buttons
- ✅ Guest mode — `isGuest` flag in auth context, persisted in `localStorage` (`svl_guest_mode`); guests skip onboarding, see Sign In prompt in menu drawer; cleared on real sign-in
- ✅ HEIC → JPEG conversion — all images converted for Chrome compatibility (`sv-barn.jpg`, `rocky-coast-guide.jpg`); all imports updated across the app
- ✅ Home screen gradient tuned — barn photo visible across full page (max 0.58 overlay), not blacked out at bottom
- ✅ YourPlanCard visual polish — heading matched to "Events & Activities" (14px font-display bold); background adjusted (`rgba(8,18,36,0.28)`) to visually match WeatherRow despite sitting higher in the gradient

### Known issues / next session must address

1. **GitHub auto-deploys will fail** — Vercel's `rootDirectory` is `null`. Pushes to `main` build from repo root (no `package.json` there) and fail. **Always deploy manually via CLI from `app/`:** `cd app && vercel --prod`. Fix properly by adding a `vercel.json` at the repo root pointing builds to `app/`.

2. ~~Regular renter login flow not end-to-end tested~~ — **RESOLVED 2026-07-10.** Full sign-in → onboarding → home flow verified working on production against the new shared Supabase project, no issues found.

3. **Weather data is static** — `weather_cache` table is always empty. WeatherRow shows hardcoded placeholder data. Needs a Supabase Edge Function on a cron schedule to fetch real weather + tide data.

4. **Content pages not built** — Menu items (Arrival Guide, Renter's Guide, WiFi, Property Rules, FAQ) tap to nothing. `content_pages` table is seeded but no detail screens exist.

5. **Splash screen shown to returning signed-in users** — If a user clears `localStorage` but still has a Supabase session cookie, the routing logic needs to be verified. Currently `RequireAuth` redirects to `/welcome` only if `!session && !isGuest`, which should be correct.

### Vercel deployment (CLI — required until GitHub auto-deploy is fixed)

```bash
cd "/Users/rallen/Documents/Claude/Projects/Rocky Coast Guide/Rocky Coast Guide/app"
vercel --prod          # normal deploy (uses build cache)
vercel --prod --force  # force full rebuild (use when env vars change)
```

The `.vercel/project.json` is inside `app/` and points to project ID `prj_8Y6MvpbBi4Ln0ohgPZrQkQ6b5t0n`.

**Important:** Never put the Supabase personal access token or any secret in this file — GitHub push protection will block the push.

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
A separate React app (same repo, `/admin` route or separate Vercel deployment) where a property manager can:
- Publish/dismiss emergency alerts
- Create, edit, and delete events
- Update amenity status (open/closed/maintenance) and hours
- Manage content pages (FAQ, arrival guide, property rules, etc.)

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

2. **Pools** — list card, data from `amenities` table (category = 'pool')
   - Adult Pool: 8am–10pm, ages 16+
   - Family Pool (Heated): 8am–10pm
   - Pavilion Pool (Not Heated): 8am–10pm
   - Status badge: Open (green) / Maintenance (red) / Closed (red)

3. **Amenities** — list card, data from `amenities` table (category = 'amenity')
   - Pickleball Courts (6 courts)
   - Fitness Center (downstairs at the Barn)
   - Sauna (downstairs at the Barn)
   - Game Room (upstairs at the Barn)
   - Tennis Courts
   - Basketball Courts
   - Playground
   - Pavilion

4. **Schedules** — static links
   - Barn Schedule
   - (Beach Access removed — not applicable)

---

### `/events` — Events & Activities

**Background:** Same barn photo.

**Components:**
- **FilterChips** — All / On-Site / Nearby / This Weekend (client-side filter)
- **DateGroup** — label + EventListCard per date group
- **EventListItem** — dot indicator (blue = on-site, amber = off-property) + title + time + location badge
  - On-site: green location text (venue name, e.g. "Barn") top-right
  - Off-property: amber distance text (e.g. "~12 mi") top-right

**Data:** `events` table, ordered by date/time, grouped by date client-side.

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
id              uuid primary key default gen_random_uuid()
title           text not null
date            date not null
time_start      time
time_end        time
is_onsite       boolean default true
venue           text                 -- 'Barn', 'Pavilion', 'York', etc.
distance_miles  numeric(4,1)         -- null if on-site
city            text                 -- null if on-site
category        text                 -- 'community' | 'arts' | 'food' | 'auto' | etc.
is_active       boolean default true
created_at      timestamptz default now()
```

### `amenities`
```sql
id            uuid primary key default gen_random_uuid()
name          text not null
category      text not null        -- 'pool' | 'amenity'
status        text default 'open'  -- 'open' | 'closed' | 'maintenance'
hours_open    time
hours_close   time
location      text                 -- 'Downstairs at the Barn', etc.
notes         text
age_restriction text              -- 'Ages 16 and up', null if none
sort_order    int default 0
```

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
