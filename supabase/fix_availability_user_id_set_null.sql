-- Fix profile deletion error when preserving availability records
-- Error seen: null value in column "user_id" violates not-null constraint
-- Run in Supabase SQL Editor

-- availability: allow null user_id so ON DELETE SET NULL can work
ALTER TABLE availability ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_user_id_fkey;
ALTER TABLE availability ADD CONSTRAINT availability_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- umpiring_availability: keep behavior consistent
ALTER TABLE umpiring_availability ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE umpiring_availability DROP CONSTRAINT IF EXISTS umpiring_availability_user_id_fkey;
ALTER TABLE umpiring_availability ADD CONSTRAINT umpiring_availability_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
