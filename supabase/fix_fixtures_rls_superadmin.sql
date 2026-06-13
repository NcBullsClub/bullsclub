-- ============================================================
-- Fix fixtures & umpiring_assignments RLS policies
-- The original policies used 'super_admin' but the actual
-- role name in the profiles table is 'superadmin'.
-- ============================================================

-- ── fixtures ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage fixtures" ON fixtures;

CREATE POLICY "Admins can manage fixtures" ON fixtures FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

-- ── umpiring_assignments ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage umpiring_assignments" ON umpiring_assignments;

CREATE POLICY "Admins can manage umpiring_assignments" ON umpiring_assignments FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
