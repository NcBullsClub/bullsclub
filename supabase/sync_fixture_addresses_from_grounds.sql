-- ============================================================
-- Backfill fixture venue addresses from grounds table
-- Run after create_grounds_table.sql
-- ============================================================

WITH grounds_norm AS (
  SELECT
    g.name,
    g.address,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim(g.name)), 'century\s*fields?\s*([0-9]+)', 'cf\1', 'g'),
          '\bcf\s*([0-9]+)\b',
          'cf\1',
          'g'
        ),
        '\bc\s*r\s*woods(?:\s*park)?\b|\bcr\s*woods(?:\s*park)?\b',
        'crwoodspark',
        'g'
      ),
      '[^a-z0-9]+',
      '',
      'g'
    ) AS venue_key
  FROM grounds g
),
fixtures_norm AS (
  SELECT
    f.id,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim(f.venue)), 'century\s*fields?\s*([0-9]+)', 'cf\1', 'g'),
          '\bcf\s*([0-9]+)\b',
          'cf\1',
          'g'
        ),
        '\bc\s*r\s*woods(?:\s*park)?\b|\bcr\s*woods(?:\s*park)?\b',
        'crwoodspark',
        'g'
      ),
      '[^a-z0-9]+',
      '',
      'g'
    ) AS venue_key
  FROM fixtures f
  WHERE COALESCE(trim(f.venue), '') <> ''
)
UPDATE fixtures f
SET venue_address = g.address
FROM fixtures_norm fn
JOIN grounds_norm g ON g.venue_key = fn.venue_key
WHERE f.id = fn.id
  AND (
    f.venue_address IS NULL
    OR trim(f.venue_address) = ''
    OR trim(f.venue_address) <> trim(g.address)
  );

-- Verify
-- SELECT venue, venue_address FROM fixtures ORDER BY date, team;
