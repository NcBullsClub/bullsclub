-- Add country code support for join requests
-- Run in Supabase SQL editor

ALTER TABLE public.join_requests
  ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Keep existing rows usable and set a sensible default.
UPDATE public.join_requests
SET country_code = '1'
WHERE (country_code IS NULL OR btrim(country_code) = '')
  AND (
    request_type <> 'public'
    OR (
      phone IS NOT NULL
      AND btrim(phone) <> ''
      AND char_length(regexp_replace(phone, '\\D', '', 'g')) BETWEEN 10 AND 15
    )
  );

ALTER TABLE public.join_requests
  ALTER COLUMN country_code SET DEFAULT '1';

-- Validate formatting for future inserts/updates.
ALTER TABLE public.join_requests
  DROP CONSTRAINT IF EXISTS join_requests_country_code_format;

ALTER TABLE public.join_requests
  ADD CONSTRAINT join_requests_country_code_format
  CHECK (country_code ~ '^[0-9]{1,4}$') NOT VALID;
