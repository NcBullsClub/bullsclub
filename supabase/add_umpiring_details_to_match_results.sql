-- Add admin-editable umpiring details override to match_results
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS umpiring_details TEXT;

-- Optional backfill helper (keep NULL so UI can use computed default/Pool Umpire)
-- UPDATE match_results SET umpiring_details = NULL WHERE umpiring_details IS NULL;
