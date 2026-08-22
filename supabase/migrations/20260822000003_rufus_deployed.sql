UPDATE _meta.apps SET
  vercel_project = 'rick-allen-s-projects/rufus',
  github_repo = 'rallen7425/Family-Chief-of-Staff',
  stage = 'active',
  notes = notes || ' Deployed to Vercel 2026-08-22: https://rufus-olive.vercel.app. GitHub repo named Family-Chief-of-Staff (not "rufus") for the same reason the GCP OAuth app was — the product name may still change and this avoids a legacy name trail. All 8 build phases complete and verified against real data: manual CRUD, chat/NL via Claude tool-use, and the Gmail email-scan pipeline (confirmed against real school emails, including a real .docx attachment) all working end-to-end in production.',
  updated_at = NOW()
WHERE name = 'Rufus';
