-- ─────────────────────────────────────────────────────────────────────────────
-- Existing Player Onboarding — extend join_requests for the temporary
-- existing-player fast-track form.
--
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Add new columns to capture full playing profile from existing players.
-- All columns are nullable so existing public requests are unaffected.
ALTER TABLE public.join_requests
  ADD COLUMN IF NOT EXISTS request_type  TEXT NOT NULL DEFAULT 'public'
    CHECK (request_type IN ('public', 'existing_player')),
  ADD COLUMN IF NOT EXISTS team          TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS batting_hand  TEXT,
  ADD COLUMN IF NOT EXISTS bowling_style TEXT;

-- Index to make filtering by type fast in the admin dashboard.
CREATE INDEX IF NOT EXISTS idx_join_requests_request_type
  ON public.join_requests (request_type);
