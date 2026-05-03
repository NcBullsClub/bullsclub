-- Fix umpiring_availability admin policies
-- The original policies used 'super_admin' but the actual role name is 'superadmin'
-- This caused super admins to be silently blocked from marking players complete.

DROP POLICY IF EXISTS "Admins can insert umpiring_availability for any player" ON umpiring_availability;
DROP POLICY IF EXISTS "Admins can update umpiring_availability for any player" ON umpiring_availability;
DROP POLICY IF EXISTS "Admins can delete umpiring_availability for any player" ON umpiring_availability;

CREATE POLICY "Admins can insert umpiring_availability for any player"
  ON umpiring_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update umpiring_availability for any player"
  ON umpiring_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete umpiring_availability for any player"
  ON umpiring_availability FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
