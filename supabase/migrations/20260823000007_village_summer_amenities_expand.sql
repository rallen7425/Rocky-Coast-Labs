-- Expands amenities for the admin "Manage Amenities" feature: sub-amenity
-- hierarchy (parent_id, self-referencing — e.g. "Pools" as a parent with 3
-- individual pool sub-amenities), detail-page fields, and a real hidden
-- flag distinct from `status`. status (open/closed/maintenance) is
-- operational — a hidden-from-curation amenity might still be "open" —
-- while hidden is curational, so these stay separate axes rather than
-- folding hidden into a 4th status value.

ALTER TABLE village_summer.amenities
  ADD COLUMN IF NOT EXISTS parent_id        uuid REFERENCES village_summer.amenities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS photo_url        text,
  ADD COLUMN IF NOT EXISTS rules            text,
  ADD COLUMN IF NOT EXISTS hidden           boolean not null default false;

CREATE INDEX IF NOT EXISTS amenities_parent_idx ON village_summer.amenities (parent_id);

-- parent_id-based grouping fully supersedes the old flat pool/amenity
-- taxonomy — drop the constraint (column/data untouched, just stops being
-- enforced). This is Postgres's default auto-generated name for the
-- inline `category text not null check (category in ('pool','amenity'))`
-- column constraint in the base migration (confirmed via \d equivalent —
-- no explicit CONSTRAINT name was given, so Postgres names it
-- <table>_<column>_check).
ALTER TABLE village_summer.amenities DROP CONSTRAINT IF EXISTS amenities_category_check;

-- Guests should no longer see hidden amenities. Admins still see everything
-- via the existing "amenities: admin full access" FOR ALL policy (RLS
-- policies for the same command are OR'd together).
DROP POLICY IF EXISTS "amenities: anyone can read" ON village_summer.amenities;
CREATE POLICY "amenities: anyone can read"
  ON village_summer.amenities FOR SELECT
  USING (hidden = false);
