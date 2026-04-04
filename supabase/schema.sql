-- ─────────────────────────────────────────────────────────────────────────────
-- NC Bulls Cricket Club — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
-- Extends auth.users with club-specific fields.
-- A row is created here on every successful signup.

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  team        TEXT        NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  role        TEXT        NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Availability ─────────────────────────────────────────────────────────
-- One row per player per fixture. UNIQUE prevents duplicate submissions;
-- use upsert (onConflict: 'user_id,fixture_date,fixture_team') to update.

CREATE TABLE IF NOT EXISTS availability (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fixture_date     DATE        NOT NULL,
  fixture_opponent TEXT        NOT NULL,
  fixture_team     TEXT        NOT NULL CHECK (fixture_team IN ('raising-bulls', 'royal-bulls')),
  status           TEXT        NOT NULL CHECK (status IN ('in', 'out', 'maybe')),
  notes            TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fixture_date, fixture_team)
);

-- Auto-bump updated_at on every row change
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS availability_updated_at ON availability;
CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── 3. Row Level Security ───────────────────────────────────────────────────

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read; only the owner can insert/update their own row
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- availability: anyone can read (public counts); auth users manage their own rows
CREATE POLICY "availability_select_all"
  ON availability FOR SELECT USING (true);

CREATE POLICY "availability_insert_own"
  ON availability FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "availability_update_own"
  ON availability FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "availability_delete_own"
  ON availability FOR DELETE USING (auth.uid() = user_id);

-- ─── 4. (Optional) Promote a user to admin ───────────────────────────────────
-- After running the schema, to make yourself an admin run:
--
--   UPDATE profiles SET role = 'admin' WHERE id = '<your-auth-user-uuid>';
--
-- Find your UUID in Supabase → Authentication → Users
-- ─────────────────────────────────────────────────────────────────────────────
