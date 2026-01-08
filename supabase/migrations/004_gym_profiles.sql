-- Gym Profiles and Equipment Presets
-- Allows users to create named gym profiles with specific equipment

-- Equipment presets (CrossFit, Hyrox, Commercial, etc.)
CREATE TABLE IF NOT EXISTS equipment_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '🏋️',
  equipment_names TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's gym profiles
CREATE TABLE IF NOT EXISTS gym_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gym_type TEXT DEFAULT 'custom' CHECK (gym_type IN ('commercial', 'crossfit', 'powerlifting', 'hotel', 'custom')),
  equipment_ids UUID[] DEFAULT '{}',
  custom_equipment TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gym_profiles_user_id ON gym_profiles(user_id);

-- RLS policies
ALTER TABLE equipment_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read presets
CREATE POLICY "Equipment presets are viewable by everyone"
  ON equipment_presets FOR SELECT
  USING (true);

-- Users can manage their own gym profiles
CREATE POLICY "Users can view their own gym profiles"
  ON gym_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gym profiles"
  ON gym_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym profiles"
  ON gym_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gym profiles"
  ON gym_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Seed equipment presets
INSERT INTO equipment_presets (name, description, icon, equipment_names) VALUES
(
  'Commercial Gym',
  'Standard equipment found at most commercial gyms like Planet Fitness, LA Fitness, etc.',
  '🏢',
  ARRAY[
    'Dumbbells', 'Barbell', 'EZ Curl Bar', 'Flat Bench', 'Adjustable Bench', 'Incline Bench',
    'Cable Machine', 'Lat Pulldown Machine', 'Leg Press Machine', 'Leg Extension Machine',
    'Leg Curl Machine', 'Smith Machine', 'Chest Press Machine', 'Shoulder Press Machine',
    'Pec Deck / Fly Machine', 'Seated Row Machine', 'Treadmill', 'Stationary Bike',
    'Elliptical', 'Pull-up Bar', 'Dip Station', 'Preacher Curl Bench', 'Ab Bench'
  ]
),
(
  'CrossFit Box',
  'Functional fitness equipment for CrossFit-style workouts',
  '🏋️',
  ARRAY[
    'Barbell', 'Bumper Plates', 'Pull-up Bar', 'Gymnastics Rings', 'Kettlebells',
    'Wall Balls', 'Rower (Concept2)', 'Assault Bike', 'Box (Plyo Box)', 'Jump Rope',
    'Dumbbells', 'Squat Rack / Power Rack', 'GHD (Glute Ham Developer)', 'Parallettes',
    'Ab Mat', 'Resistance Bands', 'Battle Ropes', 'Climbing Rope', 'Slam Ball'
  ]
),
(
  'Hyrox Training',
  'Equipment for Hyrox competition training',
  '🔥',
  ARRAY[
    'Rower (Concept2)', 'Ski Erg', 'Assault Bike', 'Sled', 'Sandbag', 'Wall Balls',
    'Kettlebells', 'Barbell', 'Bumper Plates', 'Pull-up Bar', 'Box (Plyo Box)',
    'Treadmill', 'Farmers Carry Handles', 'Battle Ropes'
  ]
),
(
  'Powerlifting Gym',
  'Specialized equipment for powerlifting training',
  '💪',
  ARRAY[
    'Barbell', 'Olympic Plates', 'Squat Rack / Power Rack', 'Competition Bench',
    'Deadlift Platform', 'Safety Squat Bar', 'Trap Bar / Hex Bar', 'Swiss Bar',
    'Cambered Bar', 'Bands', 'Chains', 'Belt Squat Machine', 'Reverse Hyper',
    'GHD (Glute Ham Developer)', 'Dumbbells', 'Lifting Belt', 'Knee Sleeves'
  ]
),
(
  'Hotel / Travel',
  'Minimal equipment typically found in hotel fitness centers',
  '🏨',
  ARRAY[
    'Dumbbells', 'Treadmill', 'Stationary Bike', 'Elliptical', 'Cable Machine',
    'Flat Bench', 'Yoga Mat', 'Resistance Bands', 'Exercise Ball / Swiss Ball'
  ]
),
(
  'Bodyweight Only',
  'No equipment needed - pure bodyweight training',
  '🤸',
  ARRAY[
    'Pull-up Bar', 'Dip Station', 'Yoga Mat', 'Resistance Bands'
  ]
),
(
  'Olympic Weightlifting',
  'Equipment for Olympic lifting (snatch, clean & jerk)',
  '🥇',
  ARRAY[
    'Barbell', 'Bumper Plates', 'Squat Rack / Power Rack', 'Weightlifting Platform',
    'Jerk Blocks', 'Pulling Blocks', 'Dumbbells', 'Kettlebells', 'Weightlifting Shoes',
    'Lifting Belt', 'Wrist Wraps', 'Knee Sleeves'
  ]
),
(
  'Home Basics',
  'Essential equipment for a basic home gym setup',
  '🏠',
  ARRAY[
    'Adjustable Dumbbells', 'Adjustable Bench', 'Pull-up Bar', 'Resistance Bands',
    'Yoga Mat', 'Kettlebells', 'Jump Rope', 'Ab Wheel'
  ]
);
