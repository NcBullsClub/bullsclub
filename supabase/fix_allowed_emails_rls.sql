-- Fix allowed_emails RLS to allow both admin and superadmin roles.
-- Run this in the Supabase SQL editor.

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "allowed_emails_select_admin" ON allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_insert_admin" ON allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_update_admin" ON allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_delete_admin" ON allowed_emails;

-- SELECT: admin or superadmin can read all rows
CREATE POLICY "allowed_emails_select_admin"
  ON allowed_emails FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- INSERT: admin or superadmin can add rows
CREATE POLICY "allowed_emails_insert_admin"
  ON allowed_emails FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- UPDATE: admin or superadmin can update rows
CREATE POLICY "allowed_emails_update_admin"
  ON allowed_emails FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- DELETE: admin or superadmin can delete rows
CREATE POLICY "allowed_emails_delete_admin"
  ON allowed_emails FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );
