-- ─────────────────────────────────────────────────────────────────────────────
-- Allow admins to update any player's profile (regardless of team)
-- Replaces the previous team-scoped update policy.
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (
    -- Owner can always update their own row
    auth.uid() = id
    OR
    -- Any admin (or superadmin) can update any profile
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    -- Prevent privilege escalation: only a superadmin can grant the superadmin role
    role != 'superadmin'
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
  );
