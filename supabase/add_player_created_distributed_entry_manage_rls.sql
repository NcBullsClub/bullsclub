-- Allow players to manage the distributed personal due entries they created.
--
-- Run in Supabase SQL Editor after add_player_created_distributed_entries_rls.sql.

ALTER TABLE player_finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_finance_entries_creator_update_distributed_due" ON player_finance_entries;
CREATE POLICY "player_finance_entries_creator_update_distributed_due"
  ON player_finance_entries FOR UPDATE
  USING (
    added_by_user_id = auth.uid()
    AND added_by_user_id IS NOT NULL
    AND entry_type = 'personal_due'
    AND is_team_amount = FALSE
    AND player_id <> auth.uid()
  )
  WITH CHECK (
    added_by_user_id = auth.uid()
    AND added_by_user_id IS NOT NULL
    AND entry_type = 'personal_due'
    AND is_team_amount = FALSE
    AND player_id <> auth.uid()
  );

DROP POLICY IF EXISTS "player_finance_entries_creator_delete_unpaid_distributed_due" ON player_finance_entries;
CREATE POLICY "player_finance_entries_creator_delete_unpaid_distributed_due"
  ON player_finance_entries FOR DELETE
  USING (
    added_by_user_id = auth.uid()
    AND added_by_user_id IS NOT NULL
    AND entry_type = 'personal_due'
    AND is_team_amount = FALSE
    AND player_id <> auth.uid()
    AND paid = FALSE
  );
