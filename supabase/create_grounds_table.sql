-- ============================================================
-- Grounds master table (DB-backed venue source)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS grounds (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grounds_name_idx ON grounds (name);

ALTER TABLE grounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read grounds" ON grounds;
CREATE POLICY "Anyone can read grounds"
  ON grounds FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage grounds" ON grounds;
CREATE POLICY "Admins can manage grounds"
  ON grounds FOR ALL
  USING  (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

INSERT INTO grounds (name, address)
VALUES
  ('Bethesda Lower', '2009 South Miami Blvd, Durham, NC 27703'),
  ('Bethesda Upper', '2009 South Miami Blvd, Durham, NC 27703'),
  ('Cedar Fork Community Center', '1050 Town Hall Dr, Morrisville, NC 27560'),
  ('Cedar Fork District Park', '288 Aviation Pkwy, Morrisville, NC 27560'),
  ('CF1', '7700 Barefoot Rd, Fuquay-Varina, NC 27526'),
  ('CF2', '7712 Barefoot Rd, Fuquay-Varina, NC 27526'),
  ('CF3', '7720 Barefoot Rd, Fuquay-Varina, NC 27526'),
  ('Church Street Park', '5800 Cricket Pitch Way, Morrisville, NC 27560'),
  ('Crabtree Creek Nature Park', '151 KeyBridge Dr, Morrisville, NC 27560'),
  ('FVAA Lower', 'Bakertown Rd, Fuquay Varina, NC 27526'),
  ('FVAA Upper', 'Bakertown Rd, Fuquay Varina, NC 27526'),
  ('Shiloh Baseball Field', '917 Church Street, Morrisville, NC 27560'),
  ('Shiloh Cricket Ground', '917 Church Street, Morrisville, NC 27560'),
  ('RTP 1', '223 E Institute Dr, Durham, NC 22709'),
  ('RTP 3', '2532 E Cornwallis Rd, Durham, NC 27713'),
  ('RTP 4', '2532 E Cornwallis Rd, Durham, NC 27713'),
  ('River Forest Park', '1000 Windermere Dr, Durham, NC 27712'),
  ('C R Woods Park', '417 Commonwealth St, Durham, NC 27703')
ON CONFLICT (name) DO UPDATE
SET
  address = EXCLUDED.address,
  updated_at = NOW();

-- Verify
-- SELECT id, name, address FROM grounds ORDER BY name;
