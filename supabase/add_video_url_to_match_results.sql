-- Add YouTube highlights URL to match results
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS video_url TEXT;
