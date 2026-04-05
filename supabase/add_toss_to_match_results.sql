-- Add toss column to match_results table
-- Run this in Supabase → SQL Editor → New Query → Run

ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS toss TEXT;

-- Explanation: stores toss outcome, e.g. "Raising Bulls won toss, elected to bat"
