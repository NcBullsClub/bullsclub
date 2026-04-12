-- ─────────────────────────────────────────────────────────────────────────────
-- match_results table — run this in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- match_results: admins enter results post-match via the Admin Panel.
-- mom, mom_stat, and scorecard_url are intentionally nullable (optional).
-- Storage: ~500 bytes/row; 300 matches over 5 years ≈ 150 KB (negligible).

CREATE TABLE IF NOT EXISTS match_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_date  DATE        NOT NULL,
  opponent      TEXT        NOT NULL,
  team          TEXT        NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  venue         TEXT,
  format        TEXT,
  result        TEXT,             -- e.g. "Raising Bulls won by 47 runs"
  ncb_score     TEXT,             -- our team score, e.g. "106/10"
  opp_score     TEXT,             -- opponent score, e.g. "59/10"
  mom           TEXT,             -- Man of the Match name (optional)
  mom_stat      TEXT,             -- MoM stat line, e.g. "54 off 32" (optional)
  scorecard_url TEXT,             -- CricHeroes scorecard link (optional)
  umpiring_details TEXT,          -- override text for umpiring completion details (optional)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fixture_date, team)
);

-- Auto-bump updated_at on every change
-- (handle_updated_at function is already created by schema.sql)
DROP TRIGGER IF EXISTS match_results_updated_at ON match_results;
CREATE TRIGGER match_results_updated_at
  BEFORE UPDATE ON match_results
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Anyone can read results (public page)
CREATE POLICY "match_results_select_all"
  ON match_results FOR SELECT USING (true);

-- admin can insert/update/delete only their team's results; superadmin can do both
CREATE POLICY "match_results_insert_admin"
  ON match_results FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role IN ('admin', 'superadmin') AND p.team = match_results.team))
    )
  );

CREATE POLICY "match_results_update_admin"
  ON match_results FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = match_results.team))
    )
  );

CREATE POLICY "match_results_delete_admin"
  ON match_results FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = match_results.team))
    )
  );
