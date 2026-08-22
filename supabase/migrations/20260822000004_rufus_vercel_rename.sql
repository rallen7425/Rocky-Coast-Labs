UPDATE _meta.apps SET
  vercel_project = 'rick-allen-s-projects/family-chief-of-staff',
  notes = notes || ' Vercel project renamed from "rufus" to "family-chief-of-staff" 2026-08-22 for naming consistency with the GCP/GitHub choice — production URL corrected to https://family-chief-of-staff.vercel.app (old rufus-olive.vercel.app alias removed). Also disabled Vercel SSO deployment protection, which had been silently gating the new alias behind a Vercel login — a real problem for an app other family members need to open without a Vercel account.',
  updated_at = NOW()
WHERE name = 'Rufus';
