-- Seed allowed_emails from players_contacts.json
-- Run in Supabase → SQL Editor → New Query → Run
-- ON CONFLICT: skips duplicates so it's safe to re-run

INSERT INTO allowed_emails (email, full_name)
VALUES
  ('karthikkumarvr@gmail.com',        'Karthik Vadrevu'),
  ('sivab4usai@gmail.com',            'Siva Prasad Madduri'),
  ('baswanthkadasani@gmail.com',      'Baswanth Kadasani'),
  ('n.mallik99@gmail.com',            'Mallik Nallamalli'),
  ('gkumarswamy1027@gmail.com',       'Kumaraswamy Gurijala'),
  ('aic2318@gmail.com',               'Aminul Chowdhury'),
  ('fic2318@gmail.com',               'Fakhrul Chowdhury'),
  ('j.appalaramu@gmail.com',          'Appalaramu Jagarapu'),
  ('sreeranjan.kommana@gmail.com',    'Sree Ranjan Kommana'),
  ('pullelapramod@gmail.com',         'Pramod Pullela'),
  ('kumar4ster@gmail.com',            'Vinay Kumar Gopal'),
  ('vishye13@gmail.com',              'Viswanath Reddy Eticala'),
  ('karthikaddagada@gmail.com',       'Karthikeya Addagada'),
  ('pamidivenky@gmail.com',           'Venkatesh Pamidi'),
  ('atrk1827@gmail.com',              'Teja Kallam'),
  ('asadkhattak@hotmail.com',         'Asad Khattak'),
  ('souravvarun@gmail.com',           'Raghuvarun Nerella'),
  ('rukeshmannuru95@gmail.com',       'Rukesh Mannuru'),
  ('prasanth.gutta@gmail.com',        'Prasanth Gutta'),
  ('ramc.fusion@gmail.com',           'Sita Rami Reddy Challa'),
  ('uthedlapu@gmail.com',             'Uday Kiran Thedlapu'),
  ('skakkerla1@gmail.com',            'Sachin Kumar'),
  ('atlasukesh@gmail.com',            'Sukesh Atla'),
  ('abhilashreddy1731@gmail.com',     'Abhilash Patlolla'),
  ('srikanthraogundarapu@gmail.com',  'Srikanth Gundarapu'),
  ('srin92@gmail.com',                'Srinath Pinnaka'),
  ('saic3132@gmail.com',              'Sai Charan'),
  ('charith.reddy@yahoo.com',         'Charith'),
  ('siddharthpochampally@gmail.com',  'Sid'),
  ('kalumula.rakesh@gmail.com',       'Rakesh Kalumula'),
  ('uthejmailbox@gmail.com',          'Uthej Reddy Nossam'),
  ('rohanbelide.9@gmail.com',         'Rohan Belide'),
  ('phanikumar.jami@hotmail.com',     'Phani Kumar Jami'),
  ('narendrakumar67073@gmail.com',    'Narendra Bandarupalli')
ON CONFLICT (email) DO NOTHING;
