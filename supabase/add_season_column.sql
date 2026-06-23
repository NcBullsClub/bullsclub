-- ============================================================
-- Multi-Season Support
-- Run in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Add `season` column to the fixtures table ─────────────────────────────
-- Values follow the slug convention: 'mega-bash-26', 'mega-smash-26', 'winter-26'
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS season TEXT;

CREATE INDEX IF NOT EXISTS fixtures_season_idx ON fixtures(season);

-- ── 2. Back-fill existing fixtures with the correct season slug ───────────────
-- Fixtures already in the table have type = 'Mega Bash' and dates in early 2026,
-- so they belong to 'mega-bash-26'.
UPDATE fixtures
SET season = 'mega-bash-26'
WHERE season IS NULL
  AND type = 'Mega Bash'
  AND EXTRACT(YEAR FROM date) = 2026;

-- ── 3. Add `season` column to match_results ──────────────────────────────────
-- match_results are linked to fixtures via fixture_date + team.
-- Stamp the season on each result row to allow fast season-scoped queries.
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS season TEXT;

CREATE INDEX IF NOT EXISTS match_results_season_idx ON match_results(season);

-- Back-fill results that match existing fixtures
UPDATE match_results mr
SET season = f.season
FROM fixtures f
WHERE f.date    = mr.fixture_date
  AND f.team    = mr.team
  AND mr.season IS NULL
  AND f.season  IS NOT NULL;

-- ── 4. (Optional) RLS updates — no changes needed ────────────────────────────
-- Existing policies already restrict write access to admins and read to everyone.
-- The new `season` column is automatically covered by those policies.

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- After running, confirm with:
--   SELECT season, COUNT(*) FROM fixtures GROUP BY season;
--   SELECT season, COUNT(*) FROM match_results GROUP BY season;
