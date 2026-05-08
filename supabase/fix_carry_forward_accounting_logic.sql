-- One-time data fix for carry-forward accounting
-- New rule:
-- 1) Carry-forward uses prior umpiring payout toward next season expenses.
-- 2) Next season should show player owes team the umpiring amount (usually $60).
-- 3) Team should not owe the player for that carried-forward umpiring amount.

BEGIN;

DO $$
DECLARE
  has_source_col BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'player_finance_entries'
      AND column_name = 'source_umpiring_fee_id'
  ) INTO has_source_col;

  IF has_source_col THEN
    -- Primary path: normalize entries keyed by source umpiring fee id.
    WITH approved AS (
      SELECT
        r.id,
        r.user_id,
        r.from_season,
        r.to_season,
        r.umpiring_fee_id,
        COALESCE(f.team, p.team) AS team,
        COALESCE(NULLIF(f.amount, 0), 60) AS amount,
        'Admin' AS reviewer
      FROM umpiring_carry_forward_requests r
      LEFT JOIN umpiring_fees f ON f.id = r.umpiring_fee_id
      LEFT JOIN profiles p ON p.id = r.user_id
      WHERE r.status = 'approved'
    )
    UPDATE player_finance_entries e
    SET
      team = a.team,
      entry_type = 'personal_due',
      amount = a.amount,
      description = 'Umpiring due (carry forward used from ' || a.from_season || ')',
      is_team_amount = TRUE,
      can_self_mark_paid = FALSE,
      paid = FALSE,
      paid_at = NULL,
      paid_marked_by = NULL,
      added_by_name = a.reviewer,
      updated_at = NOW()
    FROM approved a
    WHERE e.player_id = a.user_id
      AND e.season = a.to_season
      AND e.source_umpiring_fee_id = a.umpiring_fee_id;

    -- Insert missing normalized due entries for approved requests.
    INSERT INTO player_finance_entries (
      player_id,
      season,
      team,
      entry_type,
      amount,
      description,
      is_team_amount,
      can_self_mark_paid,
      paid,
      added_by_user_id,
      added_by_name,
      source_umpiring_fee_id,
      created_at,
      updated_at
    )
    SELECT
      r.user_id,
      r.to_season,
      COALESCE(f.team, p.team) AS team,
      'personal_due',
      COALESCE(NULLIF(f.amount, 0), 60) AS amount,
      'Umpiring due (carry forward used from ' || r.from_season || ')',
      TRUE,
      FALSE,
      FALSE,
      NULL,
      'Admin',
      r.umpiring_fee_id,
      NOW(),
      NOW()
    FROM umpiring_carry_forward_requests r
    LEFT JOIN umpiring_fees f ON f.id = r.umpiring_fee_id
    LEFT JOIN profiles p ON p.id = r.user_id
    WHERE r.status = 'approved'
      AND NOT EXISTS (
        SELECT 1
        FROM player_finance_entries e
        WHERE e.player_id = r.user_id
          AND e.season = r.to_season
          AND e.source_umpiring_fee_id = r.umpiring_fee_id
      );
  END IF;

  -- Fallback/cleanup path for legacy rows created before source linkage,
  -- keyed by old description text.
  WITH approved AS (
    SELECT
      r.user_id,
      r.from_season,
      r.to_season,
      COALESCE(f.team, p.team) AS team,
      COALESCE(NULLIF(f.amount, 0), 60) AS amount,
      'Admin' AS reviewer
    FROM umpiring_carry_forward_requests r
    LEFT JOIN umpiring_fees f ON f.id = r.umpiring_fee_id
    LEFT JOIN profiles p ON p.id = r.user_id
    WHERE r.status = 'approved'
  )
  UPDATE player_finance_entries e
  SET
    team = a.team,
    entry_type = 'personal_due',
    amount = a.amount,
    description = 'Umpiring due (carry forward used from ' || a.from_season || ')',
    is_team_amount = TRUE,
    can_self_mark_paid = FALSE,
    paid = FALSE,
    paid_at = NULL,
    paid_marked_by = NULL,
    added_by_name = a.reviewer,
    updated_at = NOW()
  FROM approved a
  WHERE e.player_id = a.user_id
    AND e.season = a.to_season
    AND e.entry_type = 'personal_credit'
    AND e.description = 'Carry forward from ' || a.from_season;
END $$;

COMMIT;
