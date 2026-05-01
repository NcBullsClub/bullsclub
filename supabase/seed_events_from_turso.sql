-- Generated from Turso events on 2026-05-01T04:36:16.463Z
-- Run this in Supabase SQL Editor

INSERT INTO public.events
  (title, slug, description, type, date, time, venue, venue_address, cover_image_url, status, category)
VALUES
('Championship Meetup 2026', 'championship-meetup-2026', 'End-of-season celebration bringing the entire NC Bulls family together. Well recap the season highlights, honor standout performers, and celebrate our journey through the 2026 campaign.', 'social', '2026-07-20', '6:00 PM', 'Cary, NC', NULL, NULL, 'upcoming', 'championship'),
('Website Launch', 'website-launch', 'Launching NC Bulls Cricket Club website/app ', 'social', '2026-05-01', '6:00 PM', 'RTP', NULL, NULL, 'upcoming', 'social'),
('Jersey Curtain Raiser 2026', 'jersey-curtain-raiser-2026', 'The moment weve all been waiting for — the official unveiling of the 2026 NC Bulls jerseys for both Raising Bulls and Royal Bulls. Come celebrate with the team and be the first to see this years kits.', 'social', '2026-03-15', '5:00 PM', 'Cary, NC', NULL, NULL, 'past', 'jersey'),
('Pre-Season Meetup 2026', 'pre-season-meetup-2026', 'Kick off the 2026 season with the full squad! Players, coaches, and supporters come together to discuss the upcoming season, introduce new members, and build team spirit before the games begin.', 'social', '2026-02-22', '4:00 PM', 'Cary, NC', NULL, NULL, 'past', 'pre-season')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  venue = EXCLUDED.venue,
  venue_address = EXCLUDED.venue_address,
  cover_image_url = EXCLUDED.cover_image_url,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  updated_at = NOW();
