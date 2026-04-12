-- Fix umpiring_fees RLS policies
-- The original policy used 'super_admin' but the actual role name is 'superadmin'
-- This caused Mark Paid to silently fail for all admin users.

DROP POLICY IF EXISTS "Admins can manage umpiring_fees" ON umpiring_fees;

CREATE POLICY "Admins can manage umpiring_fees"
  ON umpiring_fees FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
