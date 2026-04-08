-- Sponsor Inquiries — businesses interested in sponsoring NC Bulls Cricket Club
-- Run in Supabase → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS public.sponsor_inquiries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name  TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  mobile        TEXT        NOT NULL,
  brand_name    TEXT        NOT NULL,
  tier_interest TEXT        NOT NULL DEFAULT 'open' CHECK (tier_interest IN ('gold', 'silver', 'bronze', 'event', 'open')),
  message       TEXT,
  status        TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'declined')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID        REFERENCES auth.users(id)
);

ALTER TABLE public.sponsor_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (including visitors) can submit an inquiry
CREATE POLICY "sponsor_inquiries_public_insert"
  ON public.sponsor_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

-- Admins and superadmins can read all inquiries
CREATE POLICY "sponsor_inquiries_admin_select"
  ON public.sponsor_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admins and superadmins can update status
CREATE POLICY "sponsor_inquiries_admin_update"
  ON public.sponsor_inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );
