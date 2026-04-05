-- Fix allowed_emails RLS to allow both admin and superadmin roles.
-- Run this in the Supabase SQL editor.
-- Safe to re-run at any time.

-- 1. Enable RLS (idempotent)
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on allowed_emails regardless of name,
--    so no legacy policy from the Supabase dashboard can block inserts.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'allowed_emails'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON allowed_emails', pol.policyname);
  END LOOP;
END $$;

-- 3. Recreate clean policies for admin + superadmin

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
