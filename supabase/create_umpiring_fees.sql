-- ============================================================
-- Umpiring Fees — tracks $60 payment per player per completed umpiring assignment
-- ============================================================
CREATE TABLE IF NOT EXISTS umpiring_fees (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_name            TEXT NOT NULL,
  team                   TEXT NOT NULL,
  umpiring_assignment_id BIGINT NOT NULL REFERENCES umpiring_assignments(id) ON DELETE CASCADE,
  season                 TEXT NOT NULL DEFAULT '2026',
  amount                 NUMERIC(10, 2) NOT NULL DEFAULT 60,
  paid                   BOOLEAN NOT NULL DEFAULT false,
  paid_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, umpiring_assignment_id)
);

ALTER TABLE umpiring_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage umpiring_fees"
  ON umpiring_fees FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can read their own umpiring_fees"
  ON umpiring_fees FOR SELECT
  USING (auth.uid() = user_id);
