-- Migration: Add benchmark WODs table for classic CrossFit workouts
-- This includes "The Girls", Hero WODs, and other benchmark workouts

-- Create benchmark_wods table
CREATE TABLE IF NOT EXISTS benchmark_wods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('girl', 'hero', 'open', 'games', 'benchmark')),
  format TEXT NOT NULL CHECK (format IN ('for_time', 'amrap', 'emom', 'rounds', 'max_reps', 'max_load')),
  time_cap INTEGER, -- in seconds, null if none
  rounds INTEGER, -- number of rounds if fixed
  description TEXT,
  rx_male TEXT, -- prescribed weights/standards for men
  rx_female TEXT, -- prescribed weights/standards for women
  scaling_notes TEXT,
  movements JSONB NOT NULL, -- array of {name, reps, notes}
  tribute_to TEXT, -- for Hero WODs, who it honors
  first_appeared DATE, -- when it was first posted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_benchmark_wods_category ON benchmark_wods(category);

-- Enable RLS (public read, admin write)
ALTER TABLE benchmark_wods ENABLE ROW LEVEL SECURITY;

-- Everyone can read benchmark WODs
CREATE POLICY "Benchmark WODs are viewable by everyone"
  ON benchmark_wods FOR SELECT
  USING (true);

-- =============================================================================
-- THE GIRLS (Original CrossFit Benchmark WODs)
-- =============================================================================

INSERT INTO benchmark_wods (name, category, format, time_cap, rounds, description, rx_male, rx_female, movements) VALUES

-- Original 6 Girls (September 2003)
('Angie', 'girl', 'for_time', NULL, 1, 'For time: 100 pull-ups, 100 push-ups, 100 sit-ups, 100 squats. All reps of each movement must be completed before moving to the next.', 'Bodyweight', 'Bodyweight',
'[{"name": "Pull-ups", "reps": 100}, {"name": "Push-ups", "reps": 100}, {"name": "Sit-ups", "reps": 100}, {"name": "Air Squats", "reps": 100}]'),

('Barbara', 'girl', 'rounds', NULL, 5, '5 rounds with 3 minutes rest between rounds.', 'Bodyweight', 'Bodyweight',
'[{"name": "Pull-ups", "reps": 20}, {"name": "Push-ups", "reps": 30}, {"name": "Sit-ups", "reps": 40}, {"name": "Air Squats", "reps": 50}]'),

('Chelsea', 'girl', 'emom', 1800, 30, 'Every minute on the minute for 30 minutes.', 'Bodyweight', 'Bodyweight',
'[{"name": "Pull-ups", "reps": 5}, {"name": "Push-ups", "reps": 10}, {"name": "Air Squats", "reps": 15}]'),

('Diane', 'girl', 'for_time', NULL, 1, '21-15-9 reps for time.', '225 lb deadlift', '155 lb deadlift',
'[{"name": "Deadlift", "reps": "21-15-9"}, {"name": "Handstand Push-ups", "reps": "21-15-9"}]'),

('Elizabeth', 'girl', 'for_time', NULL, 1, '21-15-9 reps for time.', '135 lb clean', '95 lb clean',
'[{"name": "Squat Clean", "reps": "21-15-9"}, {"name": "Ring Dips", "reps": "21-15-9"}]'),

('Fran', 'girl', 'for_time', NULL, 1, '21-15-9 reps for time. The most famous CrossFit benchmark.', '95 lb thruster', '65 lb thruster',
'[{"name": "Thrusters", "reps": "21-15-9"}, {"name": "Pull-ups", "reps": "21-15-9"}]'),

-- Added 2003-2005
('Grace', 'girl', 'for_time', NULL, 1, '30 clean and jerks for time.', '135 lb', '95 lb',
'[{"name": "Clean and Jerk", "reps": 30}]'),

('Helen', 'girl', 'for_time', NULL, 3, '3 rounds for time.', '53 lb kettlebell', '35 lb kettlebell',
'[{"name": "Run", "reps": "400m"}, {"name": "Kettlebell Swings", "reps": 21}, {"name": "Pull-ups", "reps": 12}]'),

('Annie', 'girl', 'for_time', NULL, 1, '50-40-30-20-10 reps for time.', 'Bodyweight', 'Bodyweight',
'[{"name": "Double Unders", "reps": "50-40-30-20-10"}, {"name": "Sit-ups", "reps": "50-40-30-20-10"}]'),

-- Added 2008-2010
('Eva', 'girl', 'for_time', NULL, 5, '5 rounds for time.', '70 lb (2 pood) kettlebell', '53 lb kettlebell',
'[{"name": "Run", "reps": "800m"}, {"name": "Kettlebell Swings", "reps": 30}, {"name": "Pull-ups", "reps": 30}]'),

('Isabel', 'girl', 'for_time', NULL, 1, '30 snatches for time.', '135 lb', '95 lb',
'[{"name": "Snatch", "reps": 30}]'),

('Jackie', 'girl', 'for_time', NULL, 1, 'For time.', '45 lb thruster', '35 lb thruster',
'[{"name": "Row", "reps": "1000m"}, {"name": "Thrusters", "reps": 50}, {"name": "Pull-ups", "reps": 30}]'),

('Karen', 'girl', 'for_time', NULL, 1, '150 wall ball shots for time.', '20 lb ball to 10 ft', '14 lb ball to 9 ft',
'[{"name": "Wall Ball Shots", "reps": 150}]'),

('Kelly', 'girl', 'for_time', NULL, 5, '5 rounds for time.', '20 lb ball, 24 inch box', '14 lb ball, 20 inch box',
'[{"name": "Run", "reps": "400m"}, {"name": "Box Jumps", "reps": 30}, {"name": "Wall Ball Shots", "reps": 30}]'),

('Linda', 'girl', 'for_time', NULL, 1, '10-9-8-7-6-5-4-3-2-1 reps for time. Also known as "3 Bars of Death".', '1.5x bodyweight DL, 1x BW bench, 0.75x BW clean', '1.25x BW DL, 0.75x BW bench, 0.5x BW clean',
'[{"name": "Deadlift", "reps": "10-9-8-7-6-5-4-3-2-1"}, {"name": "Bench Press", "reps": "10-9-8-7-6-5-4-3-2-1"}, {"name": "Clean", "reps": "10-9-8-7-6-5-4-3-2-1"}]'),

('Lynne', 'girl', 'max_reps', NULL, 5, '5 rounds for max reps. No time component.', 'Bodyweight bench press', 'Bodyweight bench press',
'[{"name": "Bench Press", "reps": "max"}, {"name": "Pull-ups", "reps": "max"}]'),

('Mary', 'girl', 'amrap', 1200, NULL, 'AMRAP in 20 minutes.', 'Bodyweight', 'Bodyweight',
'[{"name": "Handstand Push-ups", "reps": 5}, {"name": "Pistols", "reps": 10}, {"name": "Pull-ups", "reps": 15}]'),

('Nancy', 'girl', 'for_time', NULL, 5, '5 rounds for time.', '95 lb overhead squat', '65 lb overhead squat',
'[{"name": "Run", "reps": "400m"}, {"name": "Overhead Squats", "reps": 15}]'),

('Nicole', 'girl', 'amrap', 1200, NULL, 'AMRAP in 20 minutes. Run 400m then max pull-ups.', 'Bodyweight', 'Bodyweight',
'[{"name": "Run", "reps": "400m"}, {"name": "Pull-ups", "reps": "max"}]'),

-- Additional Girls
('Amanda', 'girl', 'for_time', NULL, 1, '9-7-5 reps for time.', '135 lb squat snatch', '95 lb squat snatch',
'[{"name": "Muscle-ups", "reps": "9-7-5"}, {"name": "Squat Snatch", "reps": "9-7-5"}]'),

('Candy', 'girl', 'for_time', NULL, 5, '5 rounds for time.', 'Bodyweight', 'Bodyweight',
'[{"name": "Pull-ups", "reps": 20}, {"name": "Push-ups", "reps": 40}, {"name": "Air Squats", "reps": 60}]'),

('Cindy', 'girl', 'amrap', 1200, NULL, 'AMRAP in 20 minutes. The classic bodyweight benchmark.', 'Bodyweight', 'Bodyweight',
'[{"name": "Pull-ups", "reps": 5}, {"name": "Push-ups", "reps": 10}, {"name": "Air Squats", "reps": 15}]'),

('Gwen', 'girl', 'max_load', NULL, 3, '15-12-9 reps touch and go. Find max load across 3 sets.', 'Variable', 'Variable',
'[{"name": "Clean and Jerk", "reps": "15-12-9", "notes": "Touch and go, unbroken"}]'),

('Hope', 'girl', 'rounds', NULL, 3, '3 rounds, 1 minute at each station. Fight Gone Bad format.', '75 lb power snatch/thruster', '55 lb power snatch/thruster',
'[{"name": "Burpees", "reps": "1 min"}, {"name": "Power Snatch", "reps": "1 min"}, {"name": "Box Jumps", "reps": "1 min"}, {"name": "Thrusters", "reps": "1 min"}, {"name": "Chest-to-Bar Pull-ups", "reps": "1 min"}]'),

('Maggie', 'girl', 'for_time', NULL, 5, '5 rounds for time.', 'Bodyweight', 'Bodyweight',
'[{"name": "Handstand Push-ups", "reps": 20}, {"name": "Pull-ups", "reps": 40}, {"name": "Pistols", "reps": 60}]');

-- =============================================================================
-- HERO WODs (Named after fallen service members)
-- =============================================================================

INSERT INTO benchmark_wods (name, category, format, time_cap, rounds, description, rx_male, rx_female, movements, tribute_to) VALUES

('Murph', 'hero', 'for_time', NULL, 1, 'For time with 20/14 lb vest. Partition pull-ups, push-ups, squats as needed.', '20 lb vest', '14 lb vest',
'[{"name": "Run", "reps": "1 mile"}, {"name": "Pull-ups", "reps": 100}, {"name": "Push-ups", "reps": 200}, {"name": "Air Squats", "reps": 300}, {"name": "Run", "reps": "1 mile"}]',
'Navy Lieutenant Michael Murphy'),

('DT', 'hero', 'for_time', NULL, 5, '5 rounds for time.', '155 lb', '105 lb',
'[{"name": "Deadlift", "reps": 12}, {"name": "Hang Power Clean", "reps": 9}, {"name": "Push Jerk", "reps": 6}]',
'USAF SSgt Timothy P. Davis'),

('Michael', 'hero', 'for_time', NULL, 5, '5 rounds for time.', '225 lb DL, 24" box', '155 lb DL, 20" box',
'[{"name": "Deadlift", "reps": 15}, {"name": "Box Jumps", "reps": 20}, {"name": "Pull-ups", "reps": 25}]',
'USMC Sgt Michael C. Roy'),

('JT', 'hero', 'for_time', NULL, 1, '21-15-9 reps for time.', 'Bodyweight', 'Bodyweight',
'[{"name": "Handstand Push-ups", "reps": "21-15-9"}, {"name": "Ring Dips", "reps": "21-15-9"}, {"name": "Push-ups", "reps": "21-15-9"}]',
'PO1 Jeff Taylor, USN'),

('Nate', 'hero', 'amrap', 1200, NULL, 'AMRAP in 20 minutes.', '70 lb (2 pood) kettlebell', '53 lb kettlebell',
'[{"name": "Muscle-ups", "reps": 2}, {"name": "Handstand Push-ups", "reps": 4}, {"name": "Kettlebell Swings", "reps": 8}]',
'Navy Chief Special Warfare Operator Nate Hardy'),

('Randy', 'hero', 'for_time', NULL, 1, '75 power snatches for time.', '75 lb', '55 lb',
'[{"name": "Power Snatch", "reps": 75}]',
'Randy Simmons, LAPD SWAT'),

('Josh', 'hero', 'for_time', NULL, 1, 'For time.', '95 lb OHS', '65 lb OHS',
'[{"name": "Overhead Squat", "reps": 21}, {"name": "Pull-ups", "reps": 42}, {"name": "Overhead Squat", "reps": 15}, {"name": "Pull-ups", "reps": 30}, {"name": "Overhead Squat", "reps": 9}, {"name": "Pull-ups", "reps": 18}]',
'Army SSgt Joshua Hager'),

('The Seven', 'hero', 'for_time', NULL, 7, '7 rounds for time.', '135 lb', '95 lb',
'[{"name": "Handstand Push-ups", "reps": 7}, {"name": "Thrusters", "reps": 7}, {"name": "Knees-to-Elbows", "reps": 7}, {"name": "Deadlift", "reps": 7}, {"name": "Burpees", "reps": 7}, {"name": "Kettlebell Swings", "reps": 7}, {"name": "Pull-ups", "reps": 7}]',
'Seven CIA officers killed in Afghanistan'),

('Loredo', 'hero', 'for_time', NULL, 6, '6 rounds for time.', '95 lb thrusters, 24" box', '65 lb thrusters, 20" box',
'[{"name": "Run", "reps": "200m"}, {"name": "Thrusters", "reps": 10}, {"name": "Box Jumps", "reps": 10}]',
'SSgt Edwardo Loredo, U.S. Army'),

('Wittman', 'hero', 'for_time', NULL, 7, '7 rounds for time.', '95 lb push press, 15 lb KB', '65 lb push press, 10 lb KB',
'[{"name": "Kettlebell Windmill", "reps": "15 R"}, {"name": "Kettlebell Windmill", "reps": "15 L"}, {"name": "Push Press", "reps": 50}]',
'SSgt William Wittman, U.S. Army'),

('Luce', 'hero', 'for_time', NULL, 3, '3 rounds for time wearing 20 lb vest.', '155 lb clean, 20 lb vest', '105 lb clean, 14 lb vest',
'[{"name": "Run", "reps": "1000m"}, {"name": "Clean", "reps": 10}, {"name": "Burpees", "reps": 20}]',
'Capt Ronald Luce, U.S. Army'),

('Clovis', 'hero', 'for_time', NULL, 1, 'For time.', '185 lb back squat', '135 lb back squat',
'[{"name": "Run", "reps": "10 miles"}, {"name": "Back Squat", "reps": 150, "notes": "Every time you break, run 400m"}]',
'PO1 Patrick Clovis, USN'),

('Griff', 'hero', 'for_time', NULL, 2, 'For time.', '75 lb barbell', '55 lb barbell',
'[{"name": "Run", "reps": "800m"}, {"name": "Run Backwards", "reps": "400m"}, {"name": "Run", "reps": "800m"}, {"name": "Run Backwards", "reps": "400m"}]',
'SSgt Travis Griffin, USAF');

-- =============================================================================
-- OTHER BENCHMARKS
-- =============================================================================

INSERT INTO benchmark_wods (name, category, format, time_cap, rounds, description, rx_male, rx_female, movements) VALUES

('Fight Gone Bad', 'benchmark', 'rounds', NULL, 3, '3 rounds, 1 minute at each station. 1 minute rest between rounds.', '75 lb push press/thruster, 20 lb wall ball, 20" box', '55 lb, 14 lb, 20" box',
'[{"name": "Wall Ball Shots", "reps": "1 min"}, {"name": "Sumo Deadlift High Pull", "reps": "1 min"}, {"name": "Box Jumps", "reps": "1 min"}, {"name": "Push Press", "reps": "1 min"}, {"name": "Row", "reps": "1 min calories"}]'),

('Filthy Fifty', 'benchmark', 'for_time', NULL, 1, '50 reps of each movement for time.', '24" box, 53 lb KB, 45 lb', '20" box, 35 lb KB, 35 lb',
'[{"name": "Box Jumps", "reps": 50}, {"name": "Jumping Pull-ups", "reps": 50}, {"name": "Kettlebell Swings", "reps": 50}, {"name": "Walking Lunges", "reps": 50}, {"name": "Knees-to-Elbows", "reps": 50}, {"name": "Push Press", "reps": 50}, {"name": "Back Extensions", "reps": 50}, {"name": "Wall Ball Shots", "reps": 50}, {"name": "Burpees", "reps": 50}, {"name": "Double Unders", "reps": 50}]'),

('Baseline', 'benchmark', 'for_time', NULL, 1, 'For time. A great introductory benchmark.', 'Bodyweight', 'Bodyweight',
'[{"name": "Row", "reps": "500m"}, {"name": "Air Squats", "reps": 40}, {"name": "Sit-ups", "reps": 30}, {"name": "Push-ups", "reps": 20}, {"name": "Pull-ups", "reps": 10}]'),

('CrossFit Total', 'benchmark', 'max_load', NULL, 1, 'Sum of best back squat, shoulder press, and deadlift. 3 attempts each.', 'Max load', 'Max load',
'[{"name": "Back Squat", "reps": "1RM"}, {"name": "Shoulder Press", "reps": "1RM"}, {"name": "Deadlift", "reps": "1RM"}]'),

('Kalsu', 'benchmark', 'for_time', NULL, 1, '100 thrusters for time. At the start of each minute, perform 5 burpees.', '135 lb', '95 lb',
'[{"name": "Thrusters", "reps": 100}, {"name": "Burpees", "reps": "5 EMOM"}]'),

('King Kong', 'benchmark', 'for_time', NULL, 3, '3 rounds for time.', '455 lb DL, 250 lb squat clean, 70 lb DB, 2" deficit', '320 lb DL, 175 lb squat clean, 45 lb DB',
'[{"name": "Deadlift", "reps": 1}, {"name": "Muscle-ups", "reps": 2}, {"name": "Squat Clean", "reps": 3}, {"name": "Handstand Push-ups", "reps": 4, "notes": "2 inch deficit"}]');

-- =============================================================================
-- User benchmark scores table (track personal bests)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_benchmark_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  benchmark_wod_id UUID REFERENCES benchmark_wods(id) ON DELETE CASCADE NOT NULL,
  score TEXT NOT NULL, -- time, rounds+reps, or weight
  score_type TEXT NOT NULL CHECK (score_type IN ('time', 'rounds_reps', 'weight', 'reps')),
  score_seconds INTEGER, -- for time-based, total seconds
  score_rounds INTEGER, -- for AMRAP, number of rounds
  score_reps INTEGER, -- for AMRAP, additional reps
  score_weight INTEGER, -- for max load, in lbs
  notes TEXT,
  rx BOOLEAN DEFAULT false, -- did they do it as prescribed?
  performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, benchmark_wod_id, performed_at)
);

-- RLS for user scores
ALTER TABLE user_benchmark_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own benchmark scores"
  ON user_benchmark_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmark scores"
  ON user_benchmark_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own benchmark scores"
  ON user_benchmark_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own benchmark scores"
  ON user_benchmark_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_benchmark_scores_user ON user_benchmark_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benchmark_scores_benchmark ON user_benchmark_scores(benchmark_wod_id);
