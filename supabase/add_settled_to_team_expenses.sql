-- Add settled_at column to team_expenses
-- settled_at is set when an admin marks the expense as reimbursed/settled

ALTER TABLE team_expenses ADD COLUMN IF NOT EXISTS settled_at timestamptz DEFAULT null;
