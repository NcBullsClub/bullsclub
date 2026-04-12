-- ============================================================
-- Allow admins to insert/update/delete umpiring_availability for any player
-- This is needed so admins can manually mark players as having completed
-- umpiring when the player forgot to update their own availability.
-- ============================================================

CREATE POLICY "Admins can insert umpiring_availability for any player"
  ON umpiring_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update umpiring_availability for any player"
  ON umpiring_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete umpiring_availability for any player"
  ON umpiring_availability FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
