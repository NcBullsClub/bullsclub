-- ============================================================
-- Fixtures table (replaces src/data/fixtures.json)
-- ============================================================
CREATE TABLE IF NOT EXISTS fixtures (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date          DATE NOT NULL,
  time          TEXT,
  opponent      TEXT NOT NULL,
  team          TEXT NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  venue         TEXT NOT NULL,
  venue_address TEXT,
  format        TEXT DEFAULT 'HT',
  type          TEXT DEFAULT 'Mega Bash',
  division      TEXT,
  umpire1_team  TEXT,
  umpire2_team  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fixtures"   ON fixtures FOR SELECT USING (true);
CREATE POLICY "Admins can manage fixtures" ON fixtures FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ============================================================
-- Umpiring assignments — when OUR teams are assigned to umpire
-- ============================================================
CREATE TABLE IF NOT EXISTS umpiring_assignments (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date           DATE NOT NULL,
  time           TEXT,
  ncb_team       TEXT NOT NULL CHECK (ncb_team IN ('raising-bulls', 'royal-bulls')),
  match_visitor  TEXT NOT NULL,
  match_home     TEXT NOT NULL,
  venue          TEXT,
  division       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE umpiring_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read umpiring_assignments"   ON umpiring_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage umpiring_assignments" ON umpiring_assignments FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ============================================================
-- Umpiring availability — players mark if they can go umpire
-- ============================================================
CREATE TABLE IF NOT EXISTS umpiring_availability (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE,
  umpiring_assignment_id BIGINT REFERENCES umpiring_assignments(id) ON DELETE CASCADE,
  ncb_team               TEXT NOT NULL,
  status                 TEXT NOT NULL CHECK (status IN ('in','out','maybe')),
  notes                  TEXT DEFAULT '',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, umpiring_assignment_id)
);

ALTER TABLE umpiring_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read umpiring_availability"
  ON umpiring_availability FOR SELECT
  USING (true);
CREATE POLICY "Users can upsert their own umpiring_availability"
  ON umpiring_availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own umpiring_availability"
  ON umpiring_availability FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own umpiring_availability"
  ON umpiring_availability FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SEED: Fixtures (all matches from fixtures.json + umpiring)
-- ============================================================
INSERT INTO fixtures (date, time, opponent, team, venue, venue_address, format, type, division, umpire1_team, umpire2_team) VALUES
-- Raising Bulls
('2026-03-22', '1:00 PM',  'NC Jordans',          'raising-bulls', 'Century Fields 3',  '7720 Barefoot Rd, Fuquay-Varina, NC 27526', 'HT', 'Mega Bash', 'D5', 'Hollysprings Hurricanes', 'Hollysprings Hurricanes'),
('2026-03-28', '4:00 PM',  'Knockout Kings',       'raising-bulls', 'RTP 3',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D5', 'Steelers HT',             'Steelers HT'),
('2026-04-05', '1:00 PM',  'Super Rangers',        'raising-bulls', 'RTP 4',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D5', 'Triangle Troopers',       'Triangle Troopers'),
('2026-04-11', '12:45 PM', 'Chargers',             'raising-bulls', 'C R Woods Park',    '417 Commonwealth St, Durham, NC 27703',     'HT', 'Mega Bash', 'D5', 'Cholans-HT',              'Cholans-HT'),
('2026-04-18', '10:00 AM', 'Hit & Fun',            'raising-bulls', 'Bethesda Upper',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D5', 'R3',                      'R3'),
('2026-04-25', '10:00 AM', 'Star Blasters',        'raising-bulls', 'Bethesda Lower',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D5', 'Finishers - HT',          'Finishers - HT'),
('2026-05-02', '10:00 AM', 'Limited Edition',      'raising-bulls', 'RTP 3',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D5', 'Astras - HT',             'Astras - HT'),
('2026-05-09', '1:00 PM',  'Courageous Lions',     'raising-bulls', 'Century Fields 3',  '7720 Barefoot Rd, Fuquay-Varina, NC 27526', 'HT', 'Mega Bash', 'D5', 'Hollysprings HEAT',       'Hollysprings HEAT'),
('2026-05-30', '5:00 PM',  'Fuquay Mavericks',     'raising-bulls', 'Bethesda Lower',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D5', 'Kings-HT',                'Kings-HT'),
('2026-05-31', '5:00 PM',  'Blue Dragons',         'raising-bulls', 'Century Fields 3',  '7720 Barefoot Rd, Fuquay-Varina, NC 27526', 'HT', 'Mega Bash', 'D5', 'Hollysprings Hurricanes',  'Hollysprings HEAT'),
('2026-06-07', '11:00 AM', 'Hickory Boys',         'raising-bulls', 'RTP 1',             '223 E Institute Dr, Durham, NC 27709',      'HT', 'Mega Bash', 'D5', 'Avengers - HT',           'Avengers - HT'),
('2026-06-14', '7:30 PM',  'Triangle Titans',      'raising-bulls', 'RTP 3',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D5', 'United HT',               'United HT'),
('2026-06-21', '7:30 AM',  'Cary Kings',           'raising-bulls', 'RTP 4',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D5', 'POWER RANGERS',           'Carolina Rhinos'),
-- Royal Bulls
('2026-03-14', '12:15 PM', 'CT Titans HT',         'royal-bulls',   'C R Woods Park',    '417 Commonwealth St, Durham, NC 27703',     'HT', 'Mega Bash', 'D9', NULL,                      NULL),
('2026-03-21', '1:00 PM',  'Bhaukal Army',         'royal-bulls',   'Bethesda Upper',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D9', 'Zorians - HT',            'Zorians - HT'),
('2026-03-29', '4:00 PM',  'Markhor',              'royal-bulls',   'Bethesda Lower',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D9', 'The Force - HT',          'The Force - HT'),
('2026-04-04', '4:00 PM',  'Revengers',            'royal-bulls',   'RTP 3',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D9', 'Cary Sirjis',             'Cary Sirjis'),
('2026-04-12', '4:00 PM',  'Alphas',               'royal-bulls',   'Century Fields 3',  '7720 Barefoot Rd, Fuquay-Varina, NC 27526', 'HT', 'Mega Bash', 'D9', 'Hollysprings Hurricanes', 'Hollysprings Hurricanes'),
('2026-04-19', '12:30 PM', 'The Bouys',            'royal-bulls',   'Apex Jaycee Park',  'Apex, NC',                                  'HT', 'Mega Bash', 'D9', 'Mavericks',               'Mavericks'),
('2026-04-26', '1:00 PM',  'Rockers',              'royal-bulls',   'River Forest Park', '1000 Windermere Dr, Durham, NC 27712',      'HT', 'Mega Bash', 'D9', 'Emperors - HT',           'Emperors - HT'),
('2026-05-03', '4:00 PM',  'Royal Bengal Tigers',  'royal-bulls',   'RTP 4',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D9', 'Blue Waves',              'Blue Waves'),
('2026-05-09', '1:00 PM',  'Boys HT',              'royal-bulls',   'RTP 4',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D9', 'Greensboro Cricket Club HT', 'Greensboro Cricket Club HT'),
('2026-05-30', '11:00 AM', 'GOG',                  'royal-bulls',   'Century Fields 3',  '7720 Barefoot Rd, Fuquay-Varina, NC 27526', 'HT', 'Mega Bash', 'D9', 'Apex Blues',              'RTP Tigers'),
('2026-06-06', '8:00 AM',  'Invincible XI',        'royal-bulls',   'Bethesda Lower',    '2009 South Miami Blvd, Durham, NC 27703',   'HT', 'Mega Bash', 'D9', 'Cary Sirjis',             'Cary Sirjis'),
('2026-06-14', '7:30 PM',  'Hyderabad Hunters',    'royal-bulls',   'RTP 4',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D9', 'Gully Boyz',              'Gully Boyz'),
('2026-06-21', '1:30 PM',  'CSK',                  'royal-bulls',   'RTP 3',             '2500 S Tricenter Blvd, Durham, NC 27714',   'HT', 'Mega Bash', 'D9', 'Roaring Lions HT',        'Roaring Lions HT');

-- ============================================================
-- SEED: Umpiring assignments (when NCB teams go umpire others)
-- ============================================================
INSERT INTO umpiring_assignments (date, time, ncb_team, match_visitor, match_home, venue, division) VALUES
-- Royal Bulls umpiring assignments
('2026-03-22', '9:30 AM',  'royal-bulls',   'Mighty Conquerors',  'Zorians - HT',        'CR Woods',          'D8'),
('2026-04-11', '7:00 PM',  'royal-bulls',   'Naughty@40',         'RARE-HT',             'RTP 3',             'D8'),
('2026-05-02', '10:00 AM', 'royal-bulls',   'White Oak Warriors', 'Jaguars',             'Century Fields 3',  'D6'),
('2026-05-10', '4:00 PM',  'royal-bulls',   'Star Blasters',      'Triangle Titans HT',  'Century Fields 3',  'D5'),
('2026-05-16', '4:00 PM',  'royal-bulls',   'The Force - HT',     'Immortals',           'RTP 4',             'D8'),
('2026-06-07', '12:45 PM', 'royal-bulls',   'Guts N Glory',       'Tech Stormers HT',    'CR Woods',          'D7'),
('2026-06-20', '7:30 AM',  'royal-bulls',   'Zenstarz Warriors',  'Falcons',             'RTP 4',             'D7'),
-- Raising Bulls umpiring assignments
('2026-04-12', '1:00 PM',  'raising-bulls', 'DOMINATORZZ',        'NC Trojans',          'RTP 1',             'D3'),
('2026-05-03', '4:00 PM',  'raising-bulls', 'Kings-HT',           'Blasters',            'Bethesda Lower',    'D4'),
('2026-05-10', '1:00 PM',  'raising-bulls', '12th Man HT',        'Brave Wings',         'RTP 3',             'D2'),
('2026-06-06', '8:00 AM',  'raising-bulls', 'Strikers',           'The 11 Stars HT',     'River Forest',      'D4'),
('2026-06-13', '2:00 PM',  'raising-bulls', 'Strikers',           'ORIGIN HUNTERS',      'RTP 1',             'D4'),
('2026-06-20', '8:00 AM',  'raising-bulls', 'Garudas HT',         'Mustangs XI',         'RTP 1',             'D3');
