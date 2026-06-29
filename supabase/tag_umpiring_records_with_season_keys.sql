-- ============================================================
-- Tag umpiring records with canonical season keys
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Add season columns
ALTER TABLE umpiring_assignments
  ADD COLUMN IF NOT EXISTS season TEXT;

ALTER TABLE umpiring_availability
  ADD COLUMN IF NOT EXISTS season TEXT;

CREATE INDEX IF NOT EXISTS umpiring_assignments_season_idx
  ON umpiring_assignments(season);

CREATE INDEX IF NOT EXISTS umpiring_availability_season_idx
  ON umpiring_availability(season);

-- 2) Backfill assignment season from date ranges
UPDATE umpiring_assignments ua
SET season = CASE
  WHEN ua.date BETWEEN DATE '2026-03-01' AND DATE '2026-06-30' THEN 'mega-bash-26'
  WHEN ua.date BETWEEN DATE '2026-07-01' AND DATE '2026-09-15' THEN 'mega-smash-26'
  WHEN ua.date BETWEEN DATE '2026-09-16' AND DATE '2026-12-31' THEN 'winter-26'
  ELSE COALESCE(ua.season, 'mega-bash-26')
END
WHERE ua.season IS NULL;

-- 3) Backfill availability season from linked assignment season
UPDATE umpiring_availability av
SET season = ua.season
FROM umpiring_assignments ua
WHERE ua.id = av.umpiring_assignment_id
  AND av.season IS NULL
  AND ua.season IS NOT NULL;

-- 4) Fallback for availability rows without a linked assignment season
UPDATE umpiring_availability
SET season = 'mega-bash-26'
WHERE season IS NULL;

-- 5) Enforce defaults and NOT NULL after backfill
ALTER TABLE umpiring_assignments
  ALTER COLUMN season SET DEFAULT 'mega-bash-26';

ALTER TABLE umpiring_availability
  ALTER COLUMN season SET DEFAULT 'mega-bash-26';

ALTER TABLE umpiring_assignments
  ALTER COLUMN season SET NOT NULL;

ALTER TABLE umpiring_availability
  ALTER COLUMN season SET NOT NULL;

-- Verify
-- SELECT season, COUNT(*) FROM umpiring_assignments GROUP BY season ORDER BY season;
-- SELECT season, COUNT(*) FROM umpiring_availability GROUP BY season ORDER BY season;
