-- Normalize fixture type values to stage-based labels
-- Run in Supabase SQL editor

UPDATE fixtures
SET type = CASE
  WHEN type IS NULL OR btrim(type) = '' THEN 'League'
  WHEN lower(btrim(type)) IN ('mega bash', 'mega smash', 'winter', 'league') THEN 'League'
  WHEN lower(btrim(type)) IN ('playoff', 'playoffs','quarterfinal', 'quarterfinals', 'qualifier', 'qualifiers') THEN 'Playoffs'
  WHEN lower(btrim(type)) IN ('semis', 'semifinal', 'semifinals') THEN 'SemiFinal'
  WHEN lower(btrim(type)) IN ('championship', 'final') THEN 'Championship'
  ELSE 'League'
END;

ALTER TABLE fixtures
  ALTER COLUMN type SET DEFAULT 'League';

ALTER TABLE fixtures
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE fixtures
  DROP CONSTRAINT IF EXISTS fixtures_type_check;

ALTER TABLE fixtures
  ADD CONSTRAINT fixtures_type_check
  CHECK (type IN ('League', 'Playoffs', 'SemiFinal', 'Championship'));
