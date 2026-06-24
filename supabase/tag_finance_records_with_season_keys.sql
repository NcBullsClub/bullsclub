-- Normalize finance tables to canonical season keys
--
-- Why:
-- Legacy finance rows were stored with year-like values (for example: '2026').
-- The app now uses season keys (for example: 'mega-bash-26').
-- This migration backfills existing rows and updates defaults for future inserts.

BEGIN;

CREATE OR REPLACE FUNCTION map_finance_season_key(raw_season TEXT, reference_date DATE DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT;
BEGIN
  v := lower(trim(COALESCE(raw_season, '')));

  IF v = '' THEN
    IF reference_date BETWEEN DATE '2026-03-01' AND DATE '2026-06-30' THEN
      RETURN 'mega-bash-26';
    ELSIF reference_date BETWEEN DATE '2026-07-01' AND DATE '2026-09-15' THEN
      RETURN 'mega-smash-26';
    ELSIF reference_date BETWEEN DATE '2026-09-16' AND DATE '2026-12-31' THEN
      RETURN 'winter-26';
    END IF;
    RETURN raw_season;
  END IF;

  IF v IN ('mega-bash-26', 'mega-smash-26', 'winter-26') THEN
    RETURN v;
  END IF;

  IF v ~ '(^|[^a-z])mega[ -]?bash([^a-z]|$)' THEN
    RETURN 'mega-bash-26';
  END IF;
  IF v ~ '(^|[^a-z])mega[ -]?smash([^a-z]|$)' THEN
    RETURN 'mega-smash-26';
  END IF;
  IF v ~ '(^|[^a-z])winter([^a-z]|$)' THEN
    RETURN 'winter-26';
  END IF;

  IF v ~ '(^|[^0-9])2026([^0-9]|$)' THEN
    IF reference_date BETWEEN DATE '2026-07-01' AND DATE '2026-09-15' THEN
      RETURN 'mega-smash-26';
    ELSIF reference_date BETWEEN DATE '2026-09-16' AND DATE '2026-12-31' THEN
      RETURN 'winter-26';
    ELSE
      RETURN 'mega-bash-26';
    END IF;
  END IF;

  RETURN raw_season;
END;
$$;

-- 1) Source tables first so dependent tables can inherit canonical values.
UPDATE team_expenses e
SET season = map_finance_season_key(e.season, e.expense_date)
WHERE e.season IS DISTINCT FROM map_finance_season_key(e.season, e.expense_date);

UPDATE umpiring_fees f
SET season = map_finance_season_key(f.season, a.date)
FROM umpiring_assignments a
WHERE a.id = f.umpiring_assignment_id
  AND f.season IS DISTINCT FROM map_finance_season_key(f.season, a.date);

ALTER TABLE player_finances
  ALTER COLUMN season SET DEFAULT 'mega-bash-26';

ALTER TABLE umpiring_fees
  ALTER COLUMN season SET DEFAULT 'mega-bash-26';

-- Backward compatibility: some environments created player_finance_entries
-- before source_* columns were added.
DO $$
BEGIN
  IF to_regclass('public.player_finance_entries') IS NOT NULL THEN
    ALTER TABLE player_finance_entries
      ADD COLUMN IF NOT EXISTS source_expense_id UUID,
      ADD COLUMN IF NOT EXISTS source_umpiring_fee_id BIGINT;
  ELSE
    RAISE NOTICE 'Skipping player_finance_entries normalization: table does not exist.';
  END IF;
END
$$;

-- 2) player_finances: dedupe by canonical season key before update.
WITH normalized AS (
  SELECT
    pf.id,
    map_finance_season_key(pf.season, COALESCE(pf.paid_at::date, pf.created_at::date)) AS season_key,
    row_number() OVER (
      PARTITION BY pf.player_name, pf.team, map_finance_season_key(pf.season, COALESCE(pf.paid_at::date, pf.created_at::date))
      ORDER BY pf.paid DESC, pf.paid_at DESC NULLS LAST, pf.updated_at DESC NULLS LAST, pf.created_at DESC NULLS LAST, pf.id DESC
    ) AS rn
  FROM player_finances pf
), to_delete AS (
  SELECT id FROM normalized WHERE rn > 1
)
DELETE FROM player_finances pf
USING to_delete d
WHERE pf.id = d.id;

UPDATE player_finances pf
SET season = map_finance_season_key(pf.season, COALESCE(pf.paid_at::date, pf.created_at::date))
WHERE pf.season IS DISTINCT FROM map_finance_season_key(pf.season, COALESCE(pf.paid_at::date, pf.created_at::date));

-- 3) player_finance_entries: protect unique (player_id, season, source_umpiring_fee_id).
DO $$
BEGIN
  IF to_regclass('public.player_finance_entries') IS NOT NULL THEN
    WITH normalized AS (
      SELECT
        e.id,
        e.player_id,
        e.source_umpiring_fee_id,
        COALESCE(uf.season, te.season, map_finance_season_key(e.season, e.created_at::date)) AS season_key,
        row_number() OVER (
          PARTITION BY e.player_id, COALESCE(uf.season, te.season, map_finance_season_key(e.season, e.created_at::date)), e.source_umpiring_fee_id
          ORDER BY e.paid DESC, e.paid_at DESC NULLS LAST, e.updated_at DESC NULLS LAST, e.created_at DESC NULLS LAST, e.id DESC
        ) AS rn
      FROM player_finance_entries e
      LEFT JOIN umpiring_fees uf ON uf.id = e.source_umpiring_fee_id
      LEFT JOIN team_expenses te ON te.id = e.source_expense_id
      WHERE e.source_umpiring_fee_id IS NOT NULL
    ), to_delete AS (
      SELECT id FROM normalized WHERE rn > 1
    )
    DELETE FROM player_finance_entries e
    USING to_delete d
    WHERE e.id = d.id;

    UPDATE player_finance_entries e
    SET season = uf.season
    FROM umpiring_fees uf
    WHERE uf.id = e.source_umpiring_fee_id
      AND e.season IS DISTINCT FROM uf.season;

    UPDATE player_finance_entries e
    SET season = te.season
    FROM team_expenses te
    WHERE te.id = e.source_expense_id
      AND e.source_umpiring_fee_id IS NULL
      AND e.season IS DISTINCT FROM te.season;

    UPDATE player_finance_entries e
    SET season = map_finance_season_key(e.season, e.created_at::date)
    WHERE e.season IS DISTINCT FROM map_finance_season_key(e.season, e.created_at::date);
  ELSE
    RAISE NOTICE 'Skipping player_finance_entries normalization: table does not exist.';
  END IF;
END
$$;

-- 4) finance_payment_requests: avoid unique collisions on canonical season.
DO $$
BEGIN
  IF to_regclass('public.finance_payment_requests') IS NOT NULL THEN
    WITH normalized AS (
      SELECT
        r.id,
        map_finance_season_key(r.season, r.requested_at::date) AS season_key,
        row_number() OVER (
          PARTITION BY r.user_id, map_finance_season_key(r.season, r.requested_at::date)
          ORDER BY (r.status = 'approved') DESC, r.updated_at DESC NULLS LAST, r.requested_at DESC NULLS LAST, r.id DESC
        ) AS rn
      FROM finance_payment_requests r
      WHERE r.request_type = 'season_fee' AND r.finance_entry_id IS NULL
    ), to_delete AS (
      SELECT id FROM normalized WHERE rn > 1
    )
    DELETE FROM finance_payment_requests r
    USING to_delete d
    WHERE r.id = d.id;

    WITH normalized AS (
      SELECT
        r.id,
        map_finance_season_key(r.season, r.requested_at::date) AS season_key,
        row_number() OVER (
          PARTITION BY r.user_id, map_finance_season_key(r.season, r.requested_at::date), r.finance_entry_id
          ORDER BY (r.status = 'approved') DESC, r.updated_at DESC NULLS LAST, r.requested_at DESC NULLS LAST, r.id DESC
        ) AS rn
      FROM finance_payment_requests r
      WHERE r.request_type = 'entry' AND r.finance_entry_id IS NOT NULL
    ), to_delete AS (
      SELECT id FROM normalized WHERE rn > 1
    )
    DELETE FROM finance_payment_requests r
    USING to_delete d
    WHERE r.id = d.id;

    IF to_regclass('public.player_finance_entries') IS NOT NULL THEN
      UPDATE finance_payment_requests r
      SET season = e.season
      FROM player_finance_entries e
      WHERE r.finance_entry_id = e.id
        AND r.season IS DISTINCT FROM e.season;
    END IF;

    UPDATE finance_payment_requests r
    SET season = map_finance_season_key(r.season, r.requested_at::date)
    WHERE r.season IS DISTINCT FROM map_finance_season_key(r.season, r.requested_at::date);
  ELSE
    RAISE NOTICE 'Skipping finance_payment_requests normalization: table does not exist.';
  END IF;
END
$$;

-- 5) Carry-forward requests.
DO $$
BEGIN
  IF to_regclass('public.umpiring_carry_forward_requests') IS NOT NULL THEN
    UPDATE umpiring_carry_forward_requests r
    SET from_season = COALESCE(f.season, map_finance_season_key(r.from_season, r.requested_at::date))
    FROM umpiring_fees f
    WHERE f.id = r.umpiring_fee_id
      AND r.from_season IS DISTINCT FROM COALESCE(f.season, map_finance_season_key(r.from_season, r.requested_at::date));

    WITH normalized AS (
      SELECT
        r.id,
        map_finance_season_key(r.to_season, r.requested_at::date) AS to_season_key,
        row_number() OVER (
          PARTITION BY r.user_id, r.umpiring_fee_id, map_finance_season_key(r.to_season, r.requested_at::date)
          ORDER BY (r.status = 'approved') DESC, r.updated_at DESC NULLS LAST, r.requested_at DESC NULLS LAST, r.id DESC
        ) AS rn
      FROM umpiring_carry_forward_requests r
    ), to_delete AS (
      SELECT id FROM normalized WHERE rn > 1
    )
    DELETE FROM umpiring_carry_forward_requests r
    USING to_delete d
    WHERE r.id = d.id;

    UPDATE umpiring_carry_forward_requests r
    SET to_season = map_finance_season_key(r.to_season, r.requested_at::date)
    WHERE r.to_season IS DISTINCT FROM map_finance_season_key(r.to_season, r.requested_at::date);
  ELSE
    RAISE NOTICE 'Skipping umpiring_carry_forward_requests normalization: table does not exist.';
  END IF;
END
$$;

COMMIT;

-- Optional verification queries:
-- SELECT season, COUNT(*) FROM player_finances GROUP BY season ORDER BY season;
-- SELECT season, COUNT(*) FROM team_expenses GROUP BY season ORDER BY season;
-- SELECT season, COUNT(*) FROM umpiring_fees GROUP BY season ORDER BY season;
-- SELECT season, COUNT(*) FROM player_finance_entries GROUP BY season ORDER BY season;
-- SELECT season, COUNT(*) FROM finance_payment_requests GROUP BY season ORDER BY season;
-- SELECT from_season, to_season, COUNT(*) FROM umpiring_carry_forward_requests GROUP BY from_season, to_season ORDER BY from_season, to_season;
