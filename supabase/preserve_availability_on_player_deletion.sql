-- Update availability table to preserve records when players leave
-- Run this in Supabase → SQL Editor → New Query → Run

-- Add user_name column to availability table
ALTER TABLE availability ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing records with player names
UPDATE availability
SET user_name = profiles.full_name
FROM profiles
WHERE availability.user_id = profiles.id;

-- Change foreign key to not cascade delete (preserve availability records)
ALTER TABLE availability ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_user_id_fkey;
ALTER TABLE availability ADD CONSTRAINT availability_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Do the same for umpiring_availability table
ALTER TABLE umpiring_availability ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing records with player names
UPDATE umpiring_availability
SET user_name = profiles.full_name
FROM profiles
WHERE umpiring_availability.user_id = profiles.id;

-- Change foreign key to not cascade delete
ALTER TABLE umpiring_availability ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE umpiring_availability DROP CONSTRAINT IF EXISTS umpiring_availability_user_id_fkey;
ALTER TABLE umpiring_availability ADD CONSTRAINT umpiring_availability_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- For records where user_id becomes NULL (if profile was deleted), keep user_name
-- This ensures we still show the name even if the profile is gone