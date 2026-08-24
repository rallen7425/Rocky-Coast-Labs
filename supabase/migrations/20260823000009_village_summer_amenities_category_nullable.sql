-- amenities.category is superseded by parent_id-based grouping (its CHECK
-- constraint was already dropped in 20260823000007), but the column was
-- still `NOT NULL` with no default, so the new admin CRUD — which no longer
-- writes category at all — failed on every insert. Drop the NOT NULL too;
-- the column and its existing data are kept (some rows still carry
-- 'pool'/'amenity' historically) but nothing requires or enforces it now.
ALTER TABLE village_summer.amenities ALTER COLUMN category DROP NOT NULL;
