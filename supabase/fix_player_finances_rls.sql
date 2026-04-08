-- Fix player_finances RLS policies
-- Drops overly-restrictive policies and replaces with ones that
-- allow superadmins to act on any team, admins on their own team.

-- Drop existing policies
DROP POLICY IF EXISTS "player_finances_insert_admin" ON player_finances;
DROP POLICY IF EXISTS "player_finances_update_admin" ON player_finances;
DROP POLICY IF EXISTS "player_finances_delete_admin" ON player_finances;
DROP POLICY IF EXISTS "player_finances_select_all"   ON player_finances;

-- SELECT: anyone can read (needed for Availability page)
CREATE POLICY "player_finances_select_all"
  ON player_finances FOR SELECT
  USING (true);

-- INSERT: superadmin unrestricted; admin only for their own team
CREATE POLICY "player_finances_insert_admin"
  ON player_finances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- UPDATE: superadmin unrestricted; admin only for their own team
CREATE POLICY "player_finances_update_admin"
  ON player_finances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- DELETE: superadmin unrestricted; admin only for their own team
CREATE POLICY "player_finances_delete_admin"
  ON player_finances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );
