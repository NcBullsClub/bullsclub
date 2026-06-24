-- Fix late-June umpiring fee rows that were classified as Mega Smash.
--
-- Context:
-- June 20/21 assignments are part of Mega Bash in current club schedule,
-- but earlier season mapping logic split at June 15.

BEGIN;

UPDATE umpiring_fees f
SET season = 'mega-bash-26'
FROM umpiring_assignments a
WHERE a.id = f.umpiring_assignment_id
  AND a.date BETWEEN DATE '2026-06-16' AND DATE '2026-06-30'
  AND f.season = 'mega-smash-26';

COMMIT;

-- Optional verification:
-- SELECT f.player_name, a.date, f.season
-- FROM umpiring_fees f
-- JOIN umpiring_assignments a ON a.id = f.umpiring_assignment_id
-- WHERE lower(f.player_name) IN ('ramu jagarapu', 'ravi gangineni')
-- ORDER BY a.date;
