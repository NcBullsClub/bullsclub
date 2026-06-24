BEGIN;

DROP POLICY IF EXISTS "contacts_sections_update_admin_or_creator" ON service_contact_sections;
DROP POLICY IF EXISTS "contacts_sections_delete_admin" ON service_contact_sections;

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

COMMIT;
