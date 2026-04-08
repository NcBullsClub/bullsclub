-- Team Expenses table
-- Tracks miscellaneous spending by players/admins on behalf of the team

CREATE TABLE IF NOT EXISTS team_expenses (
  id           uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  season       text             NOT NULL,
  team         text             NOT NULL,          -- 'raising-bulls' | 'royal-bulls' | 'both'
  paid_by      text             NOT NULL,          -- player full name
  amount       numeric(10, 2)   NOT NULL,
  category     text             NOT NULL DEFAULT 'other', -- drinks | snacks | food | equipment | other
  description  text,
  expense_date date             NOT NULL,
  created_by   text,                               -- admin email who logged it
  created_at   timestamptz      DEFAULT now(),
  deleted_at   timestamptz      DEFAULT null       -- soft delete
);

-- Add deleted_at if not already present (safe re-run)
ALTER TABLE team_expenses ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

ALTER TABLE team_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe re-run)
DROP POLICY IF EXISTS "Admins can read expenses"   ON team_expenses;
DROP POLICY IF EXISTS "Admins can insert expenses" ON team_expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON team_expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON team_expenses;

-- Admins can read all expenses
CREATE POLICY "Admins can read expenses"
  ON team_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admins can insert expenses
CREATE POLICY "Admins can insert expenses"
  ON team_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admins can update expenses (used for soft delete and amount edits)
CREATE POLICY "Admins can update expenses"
  ON team_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );
