-- ─────────────────────────────────────────────────────────────────────────────
-- Join Requests — players interested in joining NC Bulls Cricket Club
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.join_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  playing_role  TEXT        NOT NULL CHECK (playing_role IN ('batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'beginner')),
  message       TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID        REFERENCES auth.users(id)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can submit a request
CREATE POLICY "join_requests_public_insert"
  ON public.join_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Admins and superadmins can read all requests
CREATE POLICY "join_requests_admin_select"
  ON public.join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admins and superadmins can approve/reject (update status)
CREATE POLICY "join_requests_admin_update"
  ON public.join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );
