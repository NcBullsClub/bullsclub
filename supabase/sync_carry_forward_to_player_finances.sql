-- Backfill player_finances from already approved umpiring carry-forward requests.
--
-- This makes the target season Season Fee amount/status reflect carry-forwarded
-- umpiring amounts (for example Mega Smash after carry-forward from Mega Bash).

BEGIN;

INSERT INTO player_finances (
  player_name,
  team,
  season,
  amount_due,
  paid,
  paid_at,
  updated_by,
  updated_at
)
SELECT
  COALESCE(p.full_name, uf.player_name) AS player_name,
  uf.team,
  r.to_season AS season,
  COALESCE(uf.amount, 60) AS amount_due,
  TRUE AS paid,
  COALESCE(r.requested_at, NOW()) AS paid_at,
  'Admin' AS updated_by,
  NOW() AS updated_at
FROM umpiring_carry_forward_requests r
JOIN umpiring_fees uf ON uf.id = r.umpiring_fee_id
LEFT JOIN profiles p ON p.id = r.user_id
WHERE r.status = 'approved'
ON CONFLICT (player_name, team, season)
DO UPDATE
SET
  amount_due = EXCLUDED.amount_due,
  paid = TRUE,
  paid_at = EXCLUDED.paid_at,
  updated_by = EXCLUDED.updated_by,
  updated_at = EXCLUDED.updated_at;

COMMIT;

-- Optional check for one player:
-- SELECT player_name, team, season, amount_due, paid, paid_at
-- FROM player_finances
-- WHERE lower(player_name) = 'kumar swamy'
-- ORDER BY season;
