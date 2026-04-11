-- Fix umpiring_availability.user_id FK to reference profiles(id) instead of auth.users(id)
-- This allows Supabase PostgREST joins to profiles to work correctly.

ALTER TABLE umpiring_availability
  DROP CONSTRAINT IF EXISTS umpiring_availability_user_id_fkey;

ALTER TABLE umpiring_availability
  ADD CONSTRAINT umpiring_availability_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add missing DELETE policy so users can clear their own responses
CREATE POLICY "Users can delete their own umpiring_availability"
  ON umpiring_availability FOR DELETE
  USING (auth.uid() = user_id);

-- Fix SELECT policy: allow all users to read (same as main availability table)
DROP POLICY IF EXISTS "Users can read umpiring_availability for their team" ON umpiring_availability;
CREATE POLICY "Anyone can read umpiring_availability"
  ON umpiring_availability FOR SELECT
  USING (true);
