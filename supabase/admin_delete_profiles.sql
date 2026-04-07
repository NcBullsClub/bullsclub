-- ─────────────────────────────────────────────────────────────────────────────
-- Allow admins/superadmins to delete player profiles from the roster
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Admins can delete profiles on their own team; superadmins can delete anyone.
-- Prevents deletion of superadmin accounts by non-superadmins.

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'superadmin'
          OR (p.role = 'admin' AND p.team = profiles.team)
        )
    )
    -- Extra guard: only superadmin can delete other superadmins
    AND (
      profiles.role != 'superadmin'
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'superadmin'
      )
    )
  );
