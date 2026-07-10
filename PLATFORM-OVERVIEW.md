# Rocky Coast Labs — Platform Overview

**A plain-language summary of what changed on 2026-07-10, why, and how to manage it going forward.**
*(For the full technical reference, see `ARCHITECTURE.md` in this same repo. This document is the readable version — the one to share with someone who needs to understand the setup without reading code.)*

---

## The one-paragraph version

Rick runs five independent side-project apps. Each one had been quietly accumulating its own separate hosting and database setup — normal for a prototype, but risky at portfolio scale, since each database provider only gives a limited number of free projects before charging real money. Today's work consolidated three of those apps onto one shared, free database platform (keeping each app's data completely separate and private from the others), fixed several apps whose code had never actually been saved anywhere safe, and left clear documentation so this is easy to maintain and easy to extend the next time a new app idea comes along.

---

## The problem this solved

Before today:

- **Three apps each had their own separate database**, each one a distinct "project" with its own free quota. Free database quotas are limited (in practice, about two *active* projects at a time before you're pushed toward a paid plan) — with three apps already using one each, adding a fourth or fifth idea would have hit that wall immediately.
- **One app's assembled data was at real risk of being lost.** Sonic Radar (the music app) had a database that had gone dormant from inactivity, sitting in a "paused" state that, left long enough, becomes eligible for permanent deletion. It held real work product: 958 albums, each with an AI-written history and cultural context — hours of accumulated effort that wasn't backed up anywhere else.
- **Some apps' code existed only on this one laptop.** Three separate apps (Distilled, Sonic Radar, and part of Rocky Coast Guide's cleanup) had real, working code that had never actually been saved to GitHub — the industry-standard place code should live so it survives a lost laptop, a corrupted disk, or simply time. This wasn't intentional; it happened because deployments were done by pushing straight from the laptop to the hosting service, which doesn't require code to be saved to GitHub first.

## What we actually did

**1. Rescued the at-risk data first, before anything else.** Sonic Radar's dormant database was brought back online just long enough to copy every row out to a safe local backup, confirmed complete (all 958 albums, all with their AI-written content intact), before touching anything else.

**2. Built one shared database platform.** Instead of five separate databases, there's now **one** shared database service ("Rocky Coast Labs"), with each app given its own private, walled-off section within it — think of it like five separate locked filing cabinets inside one shared storage unit, rather than five separate storage units. No app can see or touch another app's data.

**3. Moved three apps onto it, one at a time, each fully tested before moving to the next:**
   - **Sonic Radar** — moved first, as a low-risk trial run (it has no real users yet, so mistakes here were cheap to fix).
   - **Distilled** — moved second, once the pattern was proven.
   - **Rocky Coast Guide (Summer Village Life)** — moved third, including recreating its admin login since the original wasn't safe to carry over automatically.

**4. Saved everything that was only living on the laptop.** The code for Sonic Radar, the shared platform itself, and Distilled's months of unsaved work are now all properly saved to GitHub.

**5. Fixed a smaller, unrelated problem we noticed along the way.** One app's internal notes had an admin password written in plain text, sitting in a place other people could potentially see it if that project were ever shared. That's been removed; the password should still be changed to be safe, since simply deleting it from the notes doesn't undo it having been there.

**6. Documented all of it**, so a future session (or a future person) can look at one file and understand the whole setup without having to reverse-engineer it from scratch.

---

## The new architecture, in plain terms

Picture it as three layers:

```
┌─────────────────────────────────────────────────────────┐
│  HOSTING (Vercel)                                        │
│  Each app is still its own separate, independent website │
│  — nothing shared here, no change from before.           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  SHARED DATABASE ("Rocky Coast Labs")                     │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ Distilled │  │ Sonic     │  │ Rocky Coast Guide /   │  │
│  │  (own     │  │ Radar     │  │ Summer Village Life   │  │
│  │  section) │  │ (own      │  │  (own section)         │  │
│  │           │  │  section) │  │                        │  │
│  └───────────┘  └───────────┘  └──────────────────────┘  │
│  Plus a small "status board" section tracking all apps.  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  CODE (GitHub)                                            │
│  Each app has its own repository — its permanent,          │
│  version-controlled home, separate from the others.       │
└─────────────────────────────────────────────────────────┘
```

**Why this is better than before:**
- One free database quota to manage instead of five.
- Adding a sixth app later costs nothing extra in database terms — it just gets its own new section within the same shared database.
- If one app's database section had a problem, the others are unaffected — they're walled off from each other by design, not just by convention.
- Old, since-replaced databases weren't deleted — they were put to sleep ("paused") instead, at zero ongoing cost, as an extra safety net in case anything is ever needed from them.

## What changed for each app

| App | Before | After | Status |
|---|---|---|---|
| **Distilled** (news app) | Own separate database | Shares the new platform | ✅ Live, verified |
| **Sonic Radar** (music app) | Own separate database, gone dormant, at real risk | Shares the new platform, data rescued | ✅ Live, verified |
| **Rocky Coast Guide** (Summer Village Life) | Own separate database | Shares the new platform | ✅ Live, verified |
| **PM ReArchitected** (personal site) | No database needed; code wasn't properly saved | No database needed; code now properly saved to GitHub | ✅ Code saved; not yet live on the web |
| **Is It Offensive?** | No database needed | No database needed | Untouched — no changes needed |

## Cost and capacity

Everything remains on completely free tiers. The one thing worth understanding: the free database plan allows a limited number of databases to be **actively running** at the same time (we learned through trial and error that the real number is two, not the "total projects" figure some documentation suggests). Databases that aren't actively running can be put to sleep ("paused") for free, indefinitely, with no downside other than needing a short "wake up" delay (a minute or two) if their data is ever needed again. All three of the old, now-replaced databases are currently paused rather than deleted — kept as a zero-cost safety net rather than thrown away.

---

## How to manage this going forward

**To check on the overall status of the portfolio** — there's a built-in "status board" (a small table inside the shared database) listing every app, which database section it uses, and notes on its current state. This is the fastest way to get a true, current answer to "what's the state of everything" without having to check five separate dashboards individually. Just ask whoever's helping (Claude Code or otherwise) to check it.

**To add a new app to the platform in the future** — the pattern is already documented and repeatable: the new app gets its own private section within the same shared database, gets added to the status board, and everything else (hosting, code repository) works exactly like it always has for a standalone app. This is meant to be a quick, low-effort step, not a project in itself.

**If something seems broken** — the old, paused databases are still there as a fallback. Nothing was deleted. Worst case, there's a path back.

**One honest caveat:** everything described above was tested automatically (scripted checks confirming the right data shows up in the right place) rather than by a person actually clicking through each app. That hands-on check is intentionally the very next thing to do, before any further work — see "What's next," below.

---

## What's next

1. **Manually test all three migrated apps** — actually use them, the way a real user would, to catch anything the automated checks might have missed.
2. **Then resume product work on Distilled** — which was deliberately paused for the entirety of this infrastructure effort. When it resumes, the plan is to fix existing interface issues, resolve content-management inconsistencies, and finish outstanding work on "Zones" — all before rebuilding the new-user signup flow, so that flow is built against a stable app rather than a moving target.
3. **Longer-term, low-priority:** deploy PM ReArchitected's website (code is ready, just needs to be published), and revisit whether Rocky Coast Guide's code should eventually move into the shared multi-app repository structure that was set up for it (not urgent — there's no second location-guide app yet to justify sharing code between them).
