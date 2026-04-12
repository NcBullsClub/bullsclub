-- ─────────────────────────────────────────────────────────────────────────────
-- Hard-delete a user from auth.users (and cascading profile) via RPC
-- Only callable by superadmins; cannot delete yourself.
-- Run in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only superadmins may call this
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: superadmin role required';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Nullify FK references that don't have ON DELETE CASCADE/SET NULL
  -- (join_requests.reviewed_by and sponsor_inquiries.reviewed_by reference auth.users directly)
  UPDATE public.join_requests     SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
  UPDATE public.sponsor_inquiries SET reviewed_by = NULL WHERE reviewed_by = target_user_id;

  -- Delete from auth.users; profile row cascades automatically
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Revoke public execute, grant only to authenticated users (RLS inside the fn restricts further)
REVOKE EXECUTE ON FUNCTION delete_auth_user(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
