-- player_finances: tracks season fee payments per player
-- Season fee: $120 per player
-- Run this in Supabase → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS player_finances (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT        NOT NULL,
  team        TEXT        NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  season      TEXT        NOT NULL DEFAULT '2026',
  amount_due  NUMERIC     NOT NULL DEFAULT 120,
  paid        BOOLEAN     NOT NULL DEFAULT false,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_name, team, season)
);

-- Auto-bump updated_at
DROP TRIGGER IF EXISTS player_finances_updated_at ON player_finances;
CREATE TRIGGER player_finances_updated_at
  BEFORE UPDATE ON player_finances
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE player_finances ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed in Availability page for payment tags)
CREATE POLICY "player_finances_select_all"
  ON player_finances FOR SELECT USING (true);

-- Admins can insert/update/delete for their team; superadmin for all
CREATE POLICY "player_finances_insert_admin"
  ON player_finances FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = player_finances.team))
    )
  );

CREATE POLICY "player_finances_update_admin"
  ON player_finances FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = player_finances.team))
    )
  );

CREATE POLICY "player_finances_delete_admin"
  ON player_finances FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'superadmin' OR (p.role = 'admin' AND p.team = player_finances.team))
    )
  );
