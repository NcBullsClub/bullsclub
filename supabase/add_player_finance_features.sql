-- Finance feature enhancements
-- 1) Umpiring fee audit metadata for paid/unpaid and completion source
-- 2) Personal finance entries for player-visible dues/credits
-- 3) Carry-forward requests for unpaid umpiring credits
-- 4) Restrict player_finances SELECT to authenticated users

ALTER TABLE umpiring_fees
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS completion_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE umpiring_fees
SET updated_by = COALESCE(updated_by, 'System'),
    updated_at = COALESCE(updated_at, created_at, NOW()),
    completion_source = COALESCE(completion_source, 'manual'),
    completed_at = COALESCE(completed_at, created_at)
WHERE updated_by IS NULL
   OR updated_at IS NULL
   OR completion_source IS NULL
   OR completed_at IS NULL;

-- Personal player ledger entries (for personal dues/credits)
CREATE TABLE IF NOT EXISTS player_finance_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season             TEXT NOT NULL,
  team               TEXT NOT NULL,
  entry_type         TEXT NOT NULL CHECK (entry_type IN ('personal_due', 'personal_credit')),
  amount             NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description        TEXT,
  is_team_amount     BOOLEAN NOT NULL DEFAULT FALSE,
  can_self_mark_paid BOOLEAN NOT NULL DEFAULT TRUE,
  paid               BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at            TIMESTAMPTZ,
  added_by_user_id   UUID REFERENCES profiles(id),
  added_by_name      TEXT,
  paid_marked_by     TEXT,
  source_expense_id  UUID REFERENCES team_expenses(id),
  source_umpiring_fee_id BIGINT REFERENCES umpiring_fees(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_finance_entries
  ADD COLUMN IF NOT EXISTS source_expense_id UUID REFERENCES team_expenses(id),
  ADD COLUMN IF NOT EXISTS source_umpiring_fee_id BIGINT REFERENCES umpiring_fees(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_player_finance_entries_umpiring_source
  ON player_finance_entries(player_id, season, source_umpiring_fee_id)
  WHERE source_umpiring_fee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_finance_entries_player_season
  ON player_finance_entries(player_id, season);

ALTER TABLE player_finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_finance_entries_select" ON player_finance_entries;
DROP POLICY IF EXISTS "player_finance_entries_admin_insert" ON player_finance_entries;
DROP POLICY IF EXISTS "player_finance_entries_admin_update" ON player_finance_entries;
DROP POLICY IF EXISTS "player_finance_entries_user_update_personal" ON player_finance_entries;

CREATE POLICY "player_finance_entries_select"
  ON player_finance_entries FOR SELECT
  USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "player_finance_entries_admin_insert"
  ON player_finance_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "player_finance_entries_admin_update"
  ON player_finance_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "player_finance_entries_user_update_personal"
  ON player_finance_entries FOR UPDATE
  USING (
    auth.uid() = player_id
    AND is_team_amount = FALSE
    AND can_self_mark_paid = TRUE
  )
  WITH CHECK (
    auth.uid() = player_id
    AND is_team_amount = FALSE
    AND can_self_mark_paid = TRUE
  );

-- Carry-forward requests for umpiring credits
CREATE TABLE IF NOT EXISTS umpiring_carry_forward_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  umpiring_fee_id BIGINT NOT NULL REFERENCES umpiring_fees(id) ON DELETE CASCADE,
  from_season    TEXT NOT NULL,
  to_season      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note     TEXT,
  reviewed_by_name TEXT,
  reviewed_at    TIMESTAMPTZ,
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, umpiring_fee_id, to_season)
);

ALTER TABLE umpiring_carry_forward_requests
  ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE umpiring_carry_forward_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carry_requests_select" ON umpiring_carry_forward_requests;
DROP POLICY IF EXISTS "carry_requests_user_insert" ON umpiring_carry_forward_requests;
DROP POLICY IF EXISTS "carry_requests_admin_update" ON umpiring_carry_forward_requests;

CREATE POLICY "carry_requests_select"
  ON umpiring_carry_forward_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "carry_requests_user_insert"
  ON umpiring_carry_forward_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "carry_requests_admin_update"
  ON umpiring_carry_forward_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

-- Payment confirmation requests from players (in-app)
CREATE TABLE IF NOT EXISTS finance_payment_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season           TEXT NOT NULL,
  request_type     TEXT NOT NULL CHECK (request_type IN ('season_fee', 'entry')),
  finance_entry_id UUID REFERENCES player_finance_entries(id) ON DELETE CASCADE,
  requested_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_name TEXT,
  reviewed_at      TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_payment_request_season_fee
  ON finance_payment_requests(user_id, season)
  WHERE request_type = 'season_fee' AND finance_entry_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_payment_request_entry
  ON finance_payment_requests(user_id, season, finance_entry_id)
  WHERE request_type = 'entry' AND finance_entry_id IS NOT NULL;

ALTER TABLE finance_payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_payment_requests_select" ON finance_payment_requests;
DROP POLICY IF EXISTS "finance_payment_requests_user_insert" ON finance_payment_requests;
DROP POLICY IF EXISTS "finance_payment_requests_admin_update" ON finance_payment_requests;

CREATE POLICY "finance_payment_requests_select"
  ON finance_payment_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "finance_payment_requests_user_insert"
  ON finance_payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "finance_payment_requests_admin_update"
  ON finance_payment_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

-- Restrict season fee rows to authenticated users (public no longer needed)
DROP POLICY IF EXISTS "player_finances_select_all" ON player_finances;
CREATE POLICY "player_finances_select_authenticated"
  ON player_finances FOR SELECT
  USING (auth.uid() IS NOT NULL);
