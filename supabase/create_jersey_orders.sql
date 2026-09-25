-- Jersey submissions and distribution tracking.
CREATE TABLE IF NOT EXISTS jersey_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('raising-bulls', 'royal-bulls')),
  print_name TEXT NOT NULL,
  jersey_number TEXT NOT NULL,
  jersey_size TEXT NOT NULL,
  sleeve_type TEXT NOT NULL,
  cap_choice TEXT NOT NULL DEFAULT 'Regular',
  pant_size TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jersey_provided BOOLEAN NOT NULL DEFAULT FALSE,
  pant_provided BOOLEAN NOT NULL DEFAULT FALSE,
  cap_provided BOOLEAN NOT NULL DEFAULT FALSE,
  jersey_provided_at TIMESTAMPTZ,
  pant_provided_at TIMESTAMPTZ,
  cap_provided_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_name, team)
);

ALTER TABLE jersey_orders
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE jersey_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jersey_orders_select_authenticated" ON jersey_orders;
CREATE POLICY "jersey_orders_select_authenticated"
  ON jersey_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "jersey_orders_admin_update" ON jersey_orders;
CREATE POLICY "jersey_orders_admin_update"
  ON jersey_orders FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
  ));

DROP TRIGGER IF EXISTS jersey_orders_updated_at ON jersey_orders;
CREATE TRIGGER jersey_orders_updated_at
  BEFORE UPDATE ON jersey_orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Imported from "Jersey Registration - NC Bulls Cricket Club (Responses)".
INSERT INTO jersey_orders
  (player_name, team, print_name, jersey_number, jersey_size, sleeve_type, cap_choice, pant_size, notes)
VALUES
  ('Siva Prasad Madduri', 'raising-bulls', 'Siva', '4', 'XL', 'Full Sleeves', 'Regular', '34 * 30', ''),
  ('Prasanth Gutta', 'raising-bulls', 'Prasanth', '27', 'L', 'Full Sleeves', 'Regular', '36*32', ''),
  ('Karthikeya addagada', 'raising-bulls', 'Karthik', '20', 'M', 'Half Sleeve', 'Regular', '30x30', ''),
  ('Kumar Gurijala', 'raising-bulls', 'SALAAR', '45', 'L', 'Half Sleeve', 'Regular', '32*32', ''),
  ('Sree Ranjan Kommana', 'raising-bulls', 'Ranjan', '7', 'M', 'Half Sleeve', 'Regular', '32*32', ''),
  ('Harshith Devarapalli', 'raising-bulls', 'Bittu', '9', 'M', 'Half Sleeve', 'Regular', '32x30', ''),
  ('Sudhir G', 'raising-bulls', 'Sudhir', '8', 'L', 'Full Sleeves', 'Regular', '32*30', ''),
  ('Chalapathi Rao Challa', 'raising-bulls', 'CHALLA', '37', 'M', 'Half Sleeve', 'Regular', '32x30', ''),
  ('Ravi Gangineni', 'raising-bulls', 'VRK', '3', 'L', 'Full Sleeves', 'Regular', '34x32', ''),
  ('Sunny Edupuganti', 'raising-bulls', 'Sunny', '18', 'L', 'Half Sleeve', 'Round', '36*30', ''),
  ('Uday Thedlapu', 'raising-bulls', 'UK', '1', 'L', 'Full Sleeves', 'Regular', '32*32', ''),
  ('Phani Jami', 'raising-bulls', 'PJ', '12', 'L', 'Half Sleeve', 'Round', '34*32', ''),
  ('Pramod pullela', 'raising-bulls', 'Pramod', '36', 'M', 'Half Sleeve', 'Regular', '32 x 32', ''),
  ('Shoban Kandala', 'raising-bulls', 'Shoban', '3', 'M', 'Half Sleeve', 'Regular', '32', ''),
  ('Keerthi', 'raising-bulls', 'Kitty', '8', 'M', 'Half Sleeve', 'Regular', '0', 'I dont want cap and pant'),
  ('Sairam Prathik', 'raising-bulls', 'Sai', '27', 'M', 'Half Sleeve', 'Regular', '32', ''),
  ('Sukesh Atla', 'royal-bulls', 'SUKI', '18', 'M', 'Half Sleeve', 'Regular', '30', ''),
  ('Siva Prasad Madduri', 'royal-bulls', 'Siva', '29', 'XL', 'Full Sleeves', 'Round', '34 * 30', ''),
  ('Sricharit Chilpuri', 'royal-bulls', 'Chilpuri', '23', 'XL', 'Full Sleeves', 'Round', '34x32', ''),
  ('Karthik', 'royal-bulls', 'Karthik', '11', 'M', 'Full Sleeves', 'Regular', '34x30', ''),
  ('Nithin Naidu', 'raising-bulls', 'Nithin Naidu', '9', 'L', 'Half Sleeve', 'Regular', '34*32', ''),
  ('Siddarth Reddy Gopidi', 'royal-bulls', 'SID', '9', 'XL', 'Full Sleeves', 'Regular', '32*32', ''),
  ('Aashay Mehta', 'raising-bulls', 'Aashay', '9', 'L', 'Full Sleeves', 'Regular', '34 X 30', ''),
  ('Nishad Patel', 'royal-bulls', 'Nishad', '23', 'M', 'Half Sleeve', 'Regular', '32x30', ''),
  ('Ramu Jagarapu', 'royal-bulls', 'Ramu', '2', 'M', 'Full Sleeves', 'Regular', '32*30', ''),
  ('Venkatesh Pamidi', 'royal-bulls', 'Venkatesh', '18', 'XL', 'Half Sleeve', 'Regular', '38', ''),
  ('Gunasekhar Pothamsetti', 'raising-bulls', 'G', '8', 'L', 'Full Sleeves', 'Regular', '34*32', 'One Extra Half Sleeve Jersey, L Size'),
  ('Yoga Sasidhar Reddy Bhavanam', 'royal-bulls', 'Yoga', '3', 'XXL', 'Half Sleeve', 'Regular', '38x32', ''),
  ('Ramababu Ravuri', 'royal-bulls', 'Ram', '19', 'L', 'Full Sleeves', 'Regular', '32*32', ''),
  ('Aravind', 'royal-bulls', 'Aravind', '27', 'L', 'Half Sleeve', 'Regular', '34*32', ''),
  ('BABLU CHOWDARY', 'royal-bulls', 'BABLU C', '7', 'L', 'Full Sleeves', 'Regular', '32/32', 'FULL HAND T SHIRT'),
  ('Srinivas', 'royal-bulls', 'Srinivas', '99', 'L', 'Full Sleeves', 'Regular', '34*32', ''),
  ('Rohith Reddy', 'royal-bulls', 'Rohith', '13', 'L', 'Full Sleeves', 'Round', '32x32', ''),
  ('Pavan Choday', 'raising-bulls', 'Pavan', '12', 'XXL', 'Half Sleeve', 'Regular', '36*32', ''),
  ('Satvik', 'royal-bulls', 'SATVIK', '18', 'S', 'Half Sleeve', 'Not Needed', '30', ''),
  ('Srinath Pinnaka', 'royal-bulls', 'Srinath', '8', 'L', 'Full Sleeves', 'Regular', '32x32', ''),
  ('Uthej Reddy Nossam', 'royal-bulls', 'Uthej', '77', 'XL', 'Half Sleeve', 'Not Needed', '32 x 32', ''),
  ('Prudhvi Raj', 'royal-bulls', 'PR', '15', 'M', 'Full Sleeves', 'Round', '32 30', ''),
  ('Karunakar Vanguru', 'royal-bulls', 'KK', '9', 'M', 'Full Sleeves', 'Round', '32*30', ''),
  ('Anil konda', 'royal-bulls', 'Anil', '12', 'M', 'Half Sleeve', 'Regular', '32*30', ''),
  ('Hanvika', 'royal-bulls', 'Hanvika', '12', 'XS', 'Half Sleeve', 'Regular', 'No need', 'She is 2 years old XS might be bigger need 18M- 2T'),
  ('Vishwanath Reddy', 'royal-bulls', 'Vishwa', '13', 'XS', 'Half Sleeve', 'Regular', '28 * 28', ''),
  ('NIHARSH VANGURU', 'royal-bulls', 'NISH', '9', 'XS', 'Full Sleeves', 'Round', '3T', 'please design 3 yeards old kid'),
  ('Vivaan Madduri', 'royal-bulls', 'Vivaan', '29', 'XS', 'Half Sleeve', 'Round', 'NA', '8 years old')
ON CONFLICT (player_name, team) DO UPDATE SET
  print_name = EXCLUDED.print_name,
  jersey_number = EXCLUDED.jersey_number,
  jersey_size = EXCLUDED.jersey_size,
  sleeve_type = EXCLUDED.sleeve_type,
  cap_choice = EXCLUDED.cap_choice,
  pant_size = EXCLUDED.pant_size,
  notes = EXCLUDED.notes;