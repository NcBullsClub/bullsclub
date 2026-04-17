-- Add updated_by to player_finances for tracking who last updated the payment status
-- Run this in Supabase → SQL Editor → New Query → Run

ALTER TABLE player_finances ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Update existing records to have a default value
UPDATE player_finances SET updated_by = 'System' WHERE updated_by IS NULL;