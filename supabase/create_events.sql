-- ============================================================
-- Events table (migrates clubhouse events from Turso to Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  slug            TEXT        NOT NULL UNIQUE,
  description     TEXT,
  type            TEXT        NOT NULL DEFAULT 'social',
  date            DATE,
  time            TEXT,
  venue           TEXT,
  venue_address   TEXT,
  cover_image_url TEXT,
  status          TEXT        NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past')),
  category        TEXT        NOT NULL DEFAULT 'social',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at fresh on edits.
DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Helpful index for list page ordering.
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all"
  ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_admin" ON events;
CREATE POLICY "events_insert_admin"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "events_update_admin" ON events;
CREATE POLICY "events_update_admin"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "events_delete_admin" ON events;
CREATE POLICY "events_delete_admin"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );
