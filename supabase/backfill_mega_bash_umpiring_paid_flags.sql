-- Backfill Mega Bash umpiring fee paid flags
-- Use this if some historical paid rows were unintentionally reset to unpaid.

BEGIN;

-- 1) Any row with a paid_at timestamp should be marked paid.
UPDATE umpiring_fees
SET paid = TRUE,
    updated_at = NOW(),
    updated_by = COALESCE(updated_by, 'Backfill')
WHERE season IN ('mega-bash-26', '2026', 'mega bash', 'mega-bash', 'Mega Bash')
  AND paid IS DISTINCT FROM TRUE
  AND paid_at IS NOT NULL;

-- 2) If carry-forward requests table exists, approved requests imply source fee was paid.
DO $$
DECLARE
  has_cf_table BOOLEAN;
  has_reviewed_at BOOLEAN;
BEGIN
  SELECT to_regclass('public.umpiring_carry_forward_requests') IS NOT NULL
  INTO has_cf_table;

  IF NOT has_cf_table THEN
    RAISE NOTICE 'Skipping carry-forward paid backfill: table umpiring_carry_forward_requests does not exist.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'umpiring_carry_forward_requests'
      AND column_name = 'reviewed_at'
  ) INTO has_reviewed_at;

  IF has_reviewed_at THEN
    EXECUTE $sql$
      UPDATE umpiring_fees uf
      SET paid = TRUE,
          paid_at = COALESCE(uf.paid_at, r.reviewed_at, r.requested_at, NOW()),
          updated_at = NOW(),
          updated_by = COALESCE(uf.updated_by, 'Backfill')
      FROM umpiring_carry_forward_requests r
      WHERE r.umpiring_fee_id = uf.id
        AND r.status = 'approved'
        AND uf.season IN ('mega-bash-26', '2026', 'mega bash', 'mega-bash', 'Mega Bash')
        AND uf.paid IS DISTINCT FROM TRUE
    $sql$;
  ELSE
    EXECUTE $sql$
      UPDATE umpiring_fees uf
      SET paid = TRUE,
          paid_at = COALESCE(uf.paid_at, r.requested_at, NOW()),
          updated_at = NOW(),
          updated_by = COALESCE(uf.updated_by, 'Backfill')
      FROM umpiring_carry_forward_requests r
      WHERE r.umpiring_fee_id = uf.id
        AND r.status = 'approved'
        AND uf.season IN ('mega-bash-26', '2026', 'mega bash', 'mega-bash', 'Mega Bash')
        AND uf.paid IS DISTINCT FROM TRUE
    $sql$;
  END IF;
END $$;

COMMIT;

-- Optional verification
-- SELECT season, paid, COUNT(*)
-- FROM umpiring_fees
-- WHERE season IN ('mega-bash-26', '2026', 'mega bash', 'mega-bash', 'Mega Bash')
-- GROUP BY season, paid
-- ORDER BY season, paid DESC;
