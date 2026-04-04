-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Features Migration
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Add superadmin role to profiles ──────────────────────────────────────
-- Drop and recreate the role check to include 'superadmin'.
-- superadmin has access to both teams; admin only manages their own team.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('player', 'admin', 'superadmin'));

-- To promote a user to superadmin:
--   UPDATE profiles SET role = 'superadmin' WHERE id = '<uuid>';

-- ─── 2. Players table ────────────────────────────────────────────────────────
-- DB-managed roster so admins can add/edit/delete without touching code files.

CREATE TABLE IF NOT EXISTS players (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  team          TEXT        NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  role          TEXT        NOT NULL DEFAULT 'Batsman',
  captain       BOOLEAN     NOT NULL DEFAULT false,
  photo         TEXT,
  nationality   TEXT        NOT NULL DEFAULT 'India',
  display_order INT         NOT NULL DEFAULT 99,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS players_updated_at ON players;
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── 3. Match results table ───────────────────────────────────────────────────
-- Admins enter results after each match. Replaces manual edits to results.json.
-- Storage note: ~500 bytes/row; 300 rows over 5 years ≈ 150 KB. Negligible.

CREATE TABLE IF NOT EXISTS match_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_date  DATE        NOT NULL,
  opponent      TEXT        NOT NULL,
  team          TEXT        NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  venue         TEXT,
  format        TEXT,
  result        TEXT,          -- e.g. "Raising Bulls won by 47 runs"
  ncb_score     TEXT,          -- our score, e.g. "106/10"
  opp_score     TEXT,          -- opponent score, e.g. "59/10"
  mom           TEXT,          -- Man of the Match name
  mom_stat      TEXT,          -- MoM stat line, e.g. "54 off 32 balls"
  scorecard_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fixture_date, team)
);

DROP TRIGGER IF EXISTS match_results_updated_at ON match_results;
CREATE TRIGGER match_results_updated_at
  BEFORE UPDATE ON match_results
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── 4. RLS for players ───────────────────────────────────────────────────────

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select_all"
  ON players FOR SELECT USING (true);

-- admin manages their own team; superadmin manages both
CREATE POLICY "players_insert_admin"
  ON players FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = players.team))
    )
  );

CREATE POLICY "players_update_admin"
  ON players FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = players.team))
    )
  );

CREATE POLICY "players_delete_admin"
  ON players FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = players.team))
    )
  );

-- ─── 5. RLS for match_results ─────────────────────────────────────────────────

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_results_select_all"
  ON match_results FOR SELECT USING (true);

CREATE POLICY "match_results_insert_admin"
  ON match_results FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = match_results.team))
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

-- ─── 6. allowed_emails — admin access ────────────────────────────────────────
-- If allowed_emails has RLS disabled (default), this section enables it so
-- admins can manage emails for their own team, superadmin for both.
-- Skip if you want to keep allowed_emails managed only via the service role.

-- ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allowed_emails_select_admin"
--   ON allowed_emails FOR SELECT USING (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
--   );
-- CREATE POLICY "allowed_emails_insert_admin"
--   ON allowed_emails FOR INSERT WITH CHECK (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
--   );
-- CREATE POLICY "allowed_emails_delete_admin"
--   ON allowed_emails FOR DELETE USING (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
--   );
-- ─────────────────────────────────────────────────────────────────────────────
