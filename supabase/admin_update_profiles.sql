-- ─────────────────────────────────────────────────────────────────────────────
-- Allow admins to update player profiles (role + team)
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old "own-only" update policy and replace with a combined one that also
-- allows admins to update profiles within their team, and superadmins to update anyone.

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (
    -- Owner can always update their own row
    auth.uid() = id
    OR
    -- Admins can update players on their team; superadmins can update anyone
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'superadmin'
          OR (p.role = 'admin' AND p.team = profiles.team)
        )
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
