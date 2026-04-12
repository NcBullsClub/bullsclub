-- ─────────────────────────────────────────────────────────────────────────────
-- Returns all rows from auth.users, only callable by superadmins.
-- Lets the admin UI show accounts that have no profile row (soft-deleted from roster).
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION list_auth_users()
RETURNS TABLE (
  id                    UUID,
  email                 TEXT,
  created_at            TIMESTAMPTZ,
  last_sign_in_at       TIMESTAMPTZ,
  email_confirmed_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: superadmin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.id::UUID,
    u.email::TEXT,
    u.created_at::TIMESTAMPTZ,
    u.last_sign_in_at::TIMESTAMPTZ,
    u.email_confirmed_at::TIMESTAMPTZ
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION list_auth_users() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION list_auth_users() TO authenticated;
