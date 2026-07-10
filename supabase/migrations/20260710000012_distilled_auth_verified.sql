UPDATE _meta.apps SET
  notes = 'Migrated 2026-07-10: 1680 articles, 6 zones, 1 test user, 1 save carried over from the old standalone project (qyjkqfgodgnjlvjdyuci), which is kept unpaused for now as a safety net. Full local-dev navigation tested (Today/Zones/Zone Detail/Story Detail/Tracking/Saved/Profile) — all working. Real production sign-in also verified via a fresh test account (rallen7425+distilled@gmail.com, distinct from Rocky Coast Guide''s admin email due to the project-wide Supabase Auth email collision — see ARCHITECTURE.md) created with the same ID as the migrated distilled.users row, so it correctly shows the same zones/saved article. Still untested: the tracking-topic-removal fix (no tracked topics existed to test against).',
  updated_at = NOW()
WHERE name = 'Distilled';
