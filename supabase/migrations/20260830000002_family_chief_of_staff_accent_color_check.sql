-- Family Chief of Staff — drop the accent_color CHECK.
--
-- The original schema constrained family_members.accent_color to the four
-- brand colours ('coral','teal','gold','berry'). Profile & Family
-- Management expanded AccentColor to 18 values, so saving any new colour
-- was failing on family_members_accent_color_check.
--
-- Rather than hard-code 18 values in a constraint that has to stay in sync
-- with lib/colors.ts (and the palette is expected to keep growing / move
-- to arbitrary hex), drop the constraint and let the app layer — the
-- AccentColor union + ACCENT_HEX + the colour picker — be the source of
-- truth.

ALTER TABLE family_chief_of_staff.family_members
  DROP CONSTRAINT IF EXISTS family_members_accent_color_check;

UPDATE _meta.apps SET
  notes = notes || ' 2026-08-30: dropped family_members_accent_color_check — accent_color is now app-validated (18-value palette, growing).',
  updated_at = NOW()
WHERE schema_name = 'family_chief_of_staff';
