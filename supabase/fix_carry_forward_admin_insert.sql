-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: Allow admins to INSERT carry-forward requests on behalf of players.
-- The original policy only allowed users to insert their own records,
-- which blocked admin-initiated carry-forwards.
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "carry_requests_admin_insert" ON umpiring_carry_forward_requests;

CREATE POLICY "carry_requests_admin_insert"
  ON umpiring_carry_forward_requests FOR INSERT
  WITH CHECK (
    -- Player inserting their own request
    auth.uid() = user_id
    OR
    -- Admin inserting on behalf of a player
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

-- Replace the old user-only insert policy to avoid duplicate coverage
DROP POLICY IF EXISTS "carry_requests_user_insert" ON umpiring_carry_forward_requests;
