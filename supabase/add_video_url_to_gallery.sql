-- Add video_url column to the gallery table in Turso
-- Run this in your Turso shell or via the Turso dashboard

ALTER TABLE gallery ADD COLUMN video_url TEXT;
