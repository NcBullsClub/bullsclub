-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add email column to profiles table
-- Run this in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add email column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email for all existing profiles from auth.users
UPDATE profiles
SET    email = auth.users.email
FROM   auth.users
WHERE  profiles.id = auth.users.id;

-- 3. Update (or create) the handle_new_user trigger function to include email
--    so every future sign-up automatically populates it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    team,
    role,
    email,
    phone,
    playing_role,
    batting_hand,
    bowling_style
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'team',
    'player',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'playing_role',
    NEW.raw_user_meta_data->>'batting_hand',
    NEW.raw_user_meta_data->>'bowling_style'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
