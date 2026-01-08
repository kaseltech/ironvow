-- Add more garage gym equipment
-- Run this migration after deploying

-- Additional Free Weights
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Adjustable Dumbbells', 'free_weights', 'dumbbell'),
  (gen_random_uuid(), 'Trap Bar / Hex Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Safety Squat Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Swiss Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Bumper Plates', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Olympic Plates', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Fractional Plates', 'free_weights', 'weight');

-- Racks & Stands
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Half Rack', 'racks', 'rack'),
  (gen_random_uuid(), 'Squat Stands', 'racks', 'rack'),
  (gen_random_uuid(), 'Landmine Attachment', 'racks', 'rack'),
  (gen_random_uuid(), 'Dip Attachment', 'racks', 'rack'),
  (gen_random_uuid(), 'Safety Arms / Spotter Arms', 'racks', 'rack'),
  (gen_random_uuid(), 'J-Hooks', 'racks', 'rack');

-- Additional Benches
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Decline Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Preacher Curl Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Roman Chair / GHD', 'benches', 'bench'),
  (gen_random_uuid(), 'Utility Bench', 'benches', 'bench');

-- Bodyweight Equipment
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Gymnastics Rings', 'bodyweight', 'rings'),
  (gen_random_uuid(), 'Wall-Mounted Pull-up Bar', 'bodyweight', 'pullup'),
  (gen_random_uuid(), 'Parallettes', 'bodyweight', 'dip'),
  (gen_random_uuid(), 'Push-up Handles', 'bodyweight', 'pushup');

-- Conditioning & Accessories
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Battle Ropes', 'accessories', 'rope'),
  (gen_random_uuid(), 'Slam Ball', 'accessories', 'ball'),
  (gen_random_uuid(), 'Sandbag', 'accessories', 'bag'),
  (gen_random_uuid(), 'Yoga Mat', 'accessories', 'mat'),
  (gen_random_uuid(), 'Exercise Ball / Swiss Ball', 'accessories', 'ball'),
  (gen_random_uuid(), 'Pull-up Assist Bands', 'accessories', 'bands'),
  (gen_random_uuid(), 'Weight Vest', 'accessories', 'vest'),
  (gen_random_uuid(), 'Lifting Belt', 'accessories', 'belt'),
  (gen_random_uuid(), 'Wrist Wraps', 'accessories', 'wraps'),
  (gen_random_uuid(), 'Knee Sleeves', 'accessories', 'sleeves'),
  (gen_random_uuid(), 'Lifting Straps', 'accessories', 'straps'),
  (gen_random_uuid(), 'Fat Gripz', 'accessories', 'grips');

-- Cardio Equipment for Home
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Air Bike / Assault Bike', 'cardio', 'bike'),
  (gen_random_uuid(), 'Spin Bike', 'cardio', 'bike'),
  (gen_random_uuid(), 'Rower (Concept2)', 'cardio', 'rowing'),
  (gen_random_uuid(), 'Ski Erg', 'cardio', 'ski'),
  (gen_random_uuid(), 'Treadmill (Folding)', 'cardio', 'treadmill');

-- Add custom_equipment column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_equipment TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.custom_equipment IS 'User-defined custom equipment items that AI can use for workout generation';
