-- Allow players to create distributed personal due entries for teammates
-- and view only the entries they created.
--
-- Run in Supabase SQL Editor after add_player_finance_features.sql.

ALTER TABLE player_finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_finance_entries_creator_select" ON player_finance_entries;
CREATE POLICY "player_finance_entries_creator_select"
  ON player_finance_entries FOR SELECT
  USING (
    added_by_user_id = auth.uid()
    AND added_by_user_id IS NOT NULL
  );

DROP POLICY IF EXISTS "player_finance_entries_creator_insert_distributed_due" ON player_finance_entries;
CREATE POLICY "player_finance_entries_creator_insert_distributed_due"
  ON player_finance_entries FOR INSERT
  WITH CHECK (
    added_by_user_id = auth.uid()
    AND added_by_user_id IS NOT NULL
    AND entry_type = 'personal_due'
    AND is_team_amount = FALSE
    AND can_self_mark_paid = TRUE
    AND paid = FALSE
    AND player_id <> auth.uid()
  );
