-- Seed 15 famous Mumbai locations + realistic sensory_reports.
-- Safe to re-run: clears only these fixed demo UUIDs first.

BEGIN;

DELETE FROM sensory_reports WHERE location_id IN (
  '11111111-1111-1111-1111-111111111101'::uuid,
  '11111111-1111-1111-1111-111111111102'::uuid,
  '11111111-1111-1111-1111-111111111103'::uuid,
  '11111111-1111-1111-1111-111111111104'::uuid,
  '11111111-1111-1111-1111-111111111105'::uuid,
  '11111111-1111-1111-1111-111111111106'::uuid,
  '11111111-1111-1111-1111-111111111107'::uuid,
  '11111111-1111-1111-1111-111111111108'::uuid,
  '11111111-1111-1111-1111-111111111109'::uuid,
  '11111111-1111-1111-1111-11111111110a'::uuid,
  '11111111-1111-1111-1111-11111111110b'::uuid,
  '11111111-1111-1111-1111-11111111110c'::uuid,
  '11111111-1111-1111-1111-11111111110d'::uuid,
  '11111111-1111-1111-1111-11111111110e'::uuid,
  '11111111-1111-1111-1111-11111111110f'::uuid
);

DELETE FROM locations WHERE id IN (
  '11111111-1111-1111-1111-111111111101'::uuid,
  '11111111-1111-1111-1111-111111111102'::uuid,
  '11111111-1111-1111-1111-111111111103'::uuid,
  '11111111-1111-1111-1111-111111111104'::uuid,
  '11111111-1111-1111-1111-111111111105'::uuid,
  '11111111-1111-1111-1111-111111111106'::uuid,
  '11111111-1111-1111-1111-111111111107'::uuid,
  '11111111-1111-1111-1111-111111111108'::uuid,
  '11111111-1111-1111-1111-111111111109'::uuid,
  '11111111-1111-1111-1111-11111111110a'::uuid,
  '11111111-1111-1111-1111-11111111110b'::uuid,
  '11111111-1111-1111-1111-11111111110c'::uuid,
  '11111111-1111-1111-1111-11111111110d'::uuid,
  '11111111-1111-1111-1111-11111111110e'::uuid,
  '11111111-1111-1111-1111-11111111110f'::uuid
);

INSERT INTO locations (id, name, category, lat, lng) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Juhu Beach', 'beach', 19.0880, 72.8260),
  ('11111111-1111-1111-1111-111111111102', 'Marine Drive', 'landmark', 18.9442, 72.8238),
  ('11111111-1111-1111-1111-111111111103', 'Bandra Bandstand', 'beach', 19.0503, 72.8194),
  ('11111111-1111-1111-1111-111111111104', 'Gateway of India', 'landmark', 18.9218, 72.8347),
  ('11111111-1111-1111-1111-111111111105', 'Siddhivinayak Temple', 'temple', 19.0170, 72.8308),
  ('11111111-1111-1111-1111-111111111106', 'Dharavi', 'market', 19.0453, 72.8554),
  ('11111111-1111-1111-1111-111111111107', 'Colaba Causeway', 'market', 18.9067, 72.8067),
  ('11111111-1111-1111-1111-111111111108', 'Worli Sea Face', 'landmark', 19.0097, 72.8153),
  ('11111111-1111-1111-1111-111111111109', 'Powai Lake', 'park', 19.1274, 72.9063),
  ('11111111-1111-1111-1111-11111111110a', 'Carter Road Bandra', 'beach', 19.0595, 72.8268),
  ('11111111-1111-1111-1111-11111111110b', 'Mahim Nature Park', 'park', 19.0267, 72.8394),
  ('11111111-1111-1111-1111-11111111110c', 'Sanjay Gandhi National Park entrance', 'park', 19.2140, 72.9108),
  ('11111111-1111-1111-1111-11111111110d', 'Dadar Flower Market', 'market', 19.0178, 72.8422),
  ('11111111-1111-1111-1111-11111111110e', 'Linking Road Bandra', 'market', 19.0637, 72.8349),
  ('11111111-1111-1111-1111-11111111110f', 'Shivaji Park', 'park', 19.0269, 72.8378);

-- sensory_reports: varied sound/lighting/crowd, fragrance, time_of_day, timestamps (IST-ish)
INSERT INTO sensory_reports (
  location_id, sound_level, lighting, crowd_level, fragrance, time_of_day,
  notes, confirmed_by, created_at
) VALUES
  ('11111111-1111-1111-1111-111111111101', 'quiet', 'natural', 'empty', 'fragrance-free', 'early-morning', 'Calm sunrise walk', 2, '2026-04-01 07:15:00+05:30'),
  ('11111111-1111-1111-1111-111111111101', 'low-hum', 'natural', 'spaced-out', 'fragrance-free', 'morning', 'Families arrive', 0, '2026-04-02 10:30:00+05:30'),
  ('11111111-1111-1111-1111-111111111101', 'loud', 'bright-fluorescent', 'crowded', 'strong-scents', 'evening', 'Weekend bustle', 1, '2026-04-03 18:45:00+05:30'),

  ('11111111-1111-1111-1111-111111111102', 'low-hum', 'dim', 'spaced-out', 'fragrance-free', 'night', 'Sea breeze, soft lights', 3, '2026-04-01 21:00:00+05:30'),
  ('11111111-1111-1111-1111-111111111102', 'quiet', 'natural', 'empty', 'fragrance-free', 'early-morning', 'Almost empty', 0, '2026-04-04 06:40:00+05:30'),

  ('11111111-1111-1111-1111-111111111103', 'low-hum', 'natural', 'spaced-out', 'fragrance-free', 'afternoon', 'Walkers and dogs', 1, '2026-04-02 14:20:00+05:30'),
  ('11111111-1111-1111-1111-111111111103', 'loud', 'natural', 'crowded', 'fragrance-free', 'evening', 'Street performers', 0, '2026-04-05 17:10:00+05:30'),

  ('11111111-1111-1111-1111-111111111104', 'loud', 'bright-fluorescent', 'crowded', 'strong-scents', 'morning', 'Tourist crowds', 4, '2026-04-01 10:00:00+05:30'),
  ('11111111-1111-1111-1111-111111111104', 'low-hum', 'natural', 'crowded', 'fragrance-free', 'afternoon', 'Better than peak morning', 0, '2026-04-03 15:00:00+05:30'),

  ('11111111-1111-1111-1111-111111111105', 'quiet', 'dim', 'crowded', 'fragrance-free', 'morning', 'Quiet inside queue area loud outside', 2, '2026-04-02 09:00:00+05:30'),
  ('11111111-1111-1111-1111-111111111105', 'low-hum', 'flickering', 'spaced-out', 'fragrance-free', 'evening', 'Some generator lights nearby', 0, '2026-04-04 18:30:00+05:30'),

  ('11111111-1111-1111-1111-111111111106', 'loud', 'dim', 'crowded', 'strong-scents', 'afternoon', 'Busy lanes', 1, '2026-04-01 13:30:00+05:30'),
  ('11111111-1111-1111-1111-111111111106', 'sudden-noises', 'bright-fluorescent', 'crowded', 'strong-scents', 'morning', 'Vendors, horns', 0, '2026-04-02 08:45:00+05:30'),

  ('11111111-1111-1111-1111-111111111107', 'loud', 'bright-fluorescent', 'crowded', 'strong-scents', 'evening', 'Shopping peak', 0, '2026-04-03 19:00:00+05:30'),
  ('11111111-1111-1111-1111-111111111107', 'low-hum', 'natural', 'spaced-out', 'fragrance-free', 'early-morning', 'Shops mostly closed', 0, '2026-04-05 07:30:00+05:30'),

  ('11111111-1111-1111-1111-111111111108', 'low-hum', 'natural', 'spaced-out', 'fragrance-free', 'afternoon', 'Open sky, sea wind', 2, '2026-04-02 16:00:00+05:30'),
  ('11111111-1111-1111-1111-111111111108', 'quiet', 'dim', 'empty', 'fragrance-free', 'night', 'Very peaceful late night', 0, '2026-04-01 22:15:00+05:30'),

  ('11111111-1111-1111-1111-111111111109', 'quiet', 'natural', 'spaced-out', 'fragrance-free', 'morning', 'Birdsong, joggers', 1, '2026-04-01 08:30:00+05:30'),
  ('11111111-1111-1111-1111-111111111109', 'low-hum', 'natural', 'crowded', 'fragrance-free', 'evening', 'Weekend families', 0, '2026-04-06 17:45:00+05:30'),

  ('11111111-1111-1111-1111-11111111110a', 'low-hum', 'natural', 'spaced-out', 'fragrance-free', 'afternoon', 'Sea wall walk', 0, '2026-04-02 15:20:00+05:30'),
  ('11111111-1111-1111-1111-11111111110a', 'loud', 'natural', 'crowded', 'fragrance-free', 'evening', 'Cafés busy', 0, '2026-04-04 18:00:00+05:30'),

  ('11111111-1111-1111-1111-11111111110b', 'quiet', 'natural', 'empty', 'fragrance-free', 'early-morning', 'Birders paradise', 0, '2026-04-03 06:50:00+05:30'),
  ('11111111-1111-1111-1111-11111111110b', 'low-hum', 'dim', 'spaced-out', 'fragrance-free', 'morning', 'Shaded trails', 0, '2026-04-05 09:15:00+05:30'),

  ('11111111-1111-1111-1111-11111111110c', 'quiet', 'natural', 'spaced-out', 'fragrance-free', 'morning', 'Forest entry calm early', 3, '2026-04-01 09:00:00+05:30'),
  ('11111111-1111-1111-1111-11111111110c', 'low-hum', 'natural', 'crowded', 'fragrance-free', 'afternoon', 'School trip buses', 0, '2026-04-07 14:00:00+05:30'),

  ('11111111-1111-1111-1111-11111111110d', 'loud', 'bright-fluorescent', 'crowded', 'strong-scents', 'early-morning', 'Auction energy', 5, '2026-04-02 06:30:00+05:30'),
  ('11111111-1111-1111-1111-11111111110d', 'sudden-noises', 'dim', 'crowded', 'strong-scents', 'morning', 'Loading trucks', 0, '2026-04-03 10:10:00+05:30'),

  ('11111111-1111-1111-1111-11111111110e', 'loud', 'bright-fluorescent', 'crowded', 'strong-scents', 'afternoon', 'Street shopping buzz', 0, '2026-04-02 15:45:00+05:30'),
  ('11111111-1111-1111-1111-11111111110e', 'low-hum', 'dim', 'spaced-out', 'fragrance-free', 'night', 'Quieter after 9', 0, '2026-04-05 21:30:00+05:30'),

  ('11111111-1111-1111-1111-11111111110f', 'quiet', 'natural', 'spaced-out', 'fragrance-free', 'evening', 'Cricket winding down', 2, '2026-04-03 18:20:00+05:30'),
  ('11111111-1111-1111-1111-11111111110f', 'low-hum', 'natural', 'crowded', 'fragrance-free', 'morning', 'Walking track busy', 0, '2026-04-01 07:45:00+05:30');

COMMIT;
