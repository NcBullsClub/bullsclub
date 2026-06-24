-- Contacts feature
-- - Players directory (from profiles)
-- - Services directory with extensible sections
-- - Shared notes per service contact

BEGIN;

CREATE TABLE IF NOT EXISTS service_contact_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 100,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id       UUID NOT NULL REFERENCES service_contact_sections(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT,
  whatsapp_number  TEXT,
  email            TEXT,
  special_note     TEXT,
  created_by       UUID REFERENCES profiles(id),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_contact_notes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_contact_id UUID NOT NULL REFERENCES service_contacts(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note               TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_contacts_section_id
  ON service_contacts(section_id);

CREATE INDEX IF NOT EXISTS idx_service_contact_notes_contact_id
  ON service_contact_notes(service_contact_id, created_at DESC);

DROP TRIGGER IF EXISTS service_contact_sections_updated_at ON service_contact_sections;
CREATE TRIGGER service_contact_sections_updated_at
  BEFORE UPDATE ON service_contact_sections
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS service_contacts_updated_at ON service_contacts;
CREATE TRIGGER service_contacts_updated_at
  BEFORE UPDATE ON service_contacts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS service_contact_notes_updated_at ON service_contact_notes;
CREATE TRIGGER service_contact_notes_updated_at
  BEFORE UPDATE ON service_contact_notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE service_contact_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contact_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_sections_select_authenticated" ON service_contact_sections;
DROP POLICY IF EXISTS "contacts_sections_insert_authenticated" ON service_contact_sections;
DROP POLICY IF EXISTS "contacts_sections_update_admin_or_creator" ON service_contact_sections;
DROP POLICY IF EXISTS "contacts_sections_delete_admin" ON service_contact_sections;

CREATE POLICY "contacts_sections_select_authenticated"
  ON service_contact_sections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_sections_insert_authenticated"
  ON service_contact_sections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_sections_update_admin_or_creator"
  ON service_contact_sections FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    (
      is_active = true
    )
    OR (
      NOT EXISTS (
        SELECT 1
        FROM service_contacts c
        WHERE c.section_id = service_contact_sections.id
          AND c.is_active = true
      )
    )
  );

CREATE POLICY "contacts_sections_delete_admin"
  ON service_contact_sections FOR DELETE
  USING (
    (
      NOT EXISTS (
        SELECT 1
        FROM service_contacts c
        WHERE c.section_id = service_contact_sections.id
          AND c.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS "contacts_entries_select_authenticated" ON service_contacts;
DROP POLICY IF EXISTS "contacts_entries_insert_authenticated" ON service_contacts;
DROP POLICY IF EXISTS "contacts_entries_update_admin_or_creator" ON service_contacts;
DROP POLICY IF EXISTS "contacts_entries_delete_admin" ON service_contacts;

CREATE POLICY "contacts_entries_select_authenticated"
  ON service_contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_entries_insert_authenticated"
  ON service_contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_entries_update_admin_or_creator"
  ON service_contacts FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "contacts_entries_delete_admin"
  ON service_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "contacts_notes_select_authenticated" ON service_contact_notes;
DROP POLICY IF EXISTS "contacts_notes_insert_authenticated" ON service_contact_notes;
DROP POLICY IF EXISTS "contacts_notes_update_author_or_admin" ON service_contact_notes;
DROP POLICY IF EXISTS "contacts_notes_delete_author_or_admin" ON service_contact_notes;

CREATE POLICY "contacts_notes_select_authenticated"
  ON service_contact_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_notes_insert_authenticated"
  ON service_contact_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_notes_update_author_or_admin"
  ON service_contact_notes FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "contacts_notes_delete_author_or_admin"
  ON service_contact_notes FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

INSERT INTO service_contact_sections (name, slug, sort_order, created_by)
VALUES
  ('Airbnb', 'airbnb', 10, auth.uid()),
  ('Catering', 'catering', 20, auth.uid()),
  ('Meat', 'meat', 30, auth.uid()),
  ('Restaurants', 'restaurants', 40, auth.uid())
ON CONFLICT (slug) DO NOTHING;

COMMIT;
