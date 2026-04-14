-- ─────────────────────────────────────────────────────────────────────────────
-- Require phone (WhatsApp/mobile) for public join requests
-- Run in Supabase → SQL Editor → New Query → Run
--
-- Notes:
-- 1) This enforces phone for NEW/UPDATED public rows.
-- 2) Existing rows are left untouched via NOT VALID.
-- ─────────────────────────────────────────────────────────────────────────────

-- Make sure request_type exists (from existing-player onboarding migration).
ALTER TABLE public.join_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'public'
  CHECK (request_type IN ('public', 'existing_player'));

-- Enforce non-empty phone for public requests.
ALTER TABLE public.join_requests
  DROP CONSTRAINT IF EXISTS join_requests_public_phone_required;

ALTER TABLE public.join_requests
  ADD CONSTRAINT join_requests_public_phone_required
  CHECK (
    request_type <> 'public'
    OR (
      phone IS NOT NULL
      AND btrim(phone) <> ''
      AND char_length(regexp_replace(phone, '\\D', '', 'g')) BETWEEN 10 AND 15
    )
  ) NOT VALID;
