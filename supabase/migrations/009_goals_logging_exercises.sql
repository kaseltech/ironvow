-- Phase 5: Goals, AI Logging, and Exercise Expansion
-- 1. Add fitness_goal to profiles
-- 2. Add workout_requests table for AI request/response logging
-- 3. Add Cardio, Mobility, and Bootcamp exercises

-- ============================================================================
-- FITNESS GOAL ON PROFILES
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS fitness_goal TEXT DEFAULT 'general'
CHECK (fitness_goal IN ('cut', 'bulk', 'maintain', 'endurance', 'general'));

COMMENT ON COLUMN profiles.fitness_goal IS 'User fitness goal: cut (fat loss), bulk (muscle gain), maintain, endurance, or general fitness';

-- ============================================================================
-- WORKOUT REQUESTS LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User info
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('structured', 'freeform')),

  -- For structured requests
  workout_style TEXT,
  target_muscles TEXT[],
  duration INTEGER,
  location TEXT,

  -- For freeform requests
  user_prompt TEXT,

  -- Context sent to AI
  user_context JSONB DEFAULT '{}',

  -- AI response
  ai_response JSONB DEFAULT '{}',
  ai_model TEXT,

  -- Generated workout (if successful)
  generated_workout JSONB,

  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Performance
  generation_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding user's requests
CREATE INDEX IF NOT EXISTS idx_workout_requests_user ON workout_requests(user_id, created_at DESC);

-- Index for finding freeform requests to review
CREATE INDEX IF NOT EXISTS idx_workout_requests_freeform ON workout_requests(request_type, created_at DESC)
WHERE request_type = 'freeform';

-- RLS policies
ALTER TABLE workout_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own workout requests"
  ON workout_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (from Edge Function)
-- This is handled by using service role key in Edge Function

-- View for admin to see popular freeform requests
CREATE OR REPLACE VIEW freeform_requests_summary AS
SELECT
  id,
  user_prompt,
  workout_style,
  success,
  created_at,
  generation_time_ms
FROM workout_requests
WHERE request_type = 'freeform'
ORDER BY created_at DESC
LIMIT 100;

-- ============================================================================
-- CARDIO / RUNNING EXERCISES
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Running Intervals
  ('Run/Walk Intervals', 'run-walk-intervals',
   ARRAY['quads', 'hamstrings', 'calves'], ARRAY['glutes', 'core'],
   'cardio', true, 'beginner',
   ARRAY['Alternate running and walking', 'Start with 1:1 ratio (1 min run, 1 min walk)', 'Progress to longer run intervals', 'Great for building endurance']),

  ('Sprint Intervals (30/30)', 'sprint-intervals-30-30',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['30 seconds all-out sprint', '30 seconds rest or walk', 'Repeat for prescribed rounds', 'Maximum effort on sprints']),

  ('Sprint Intervals (60/60)', 'sprint-intervals-60-60',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['60 seconds hard running', '60 seconds recovery jog/walk', 'Maintain consistent pace', 'Build to longer intervals']),

  ('Fartlek Run', 'fartlek-run',
   ARRAY['quads', 'hamstrings', 'calves'], ARRAY['glutes', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Unstructured speed play', 'Vary pace throughout run', 'Sprint to landmarks, recover between', 'Listen to your body']),

  ('Tempo Run', 'tempo-run',
   ARRAY['quads', 'hamstrings', 'calves'], ARRAY['glutes', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Comfortably hard pace', 'Should be able to speak in short phrases', 'Maintain steady effort', 'Builds lactate threshold']),

  ('Zone 2 Easy Run', 'zone-2-easy-run',
   ARRAY['quads', 'hamstrings', 'calves'], ARRAY['glutes'],
   'cardio', true, 'beginner',
   ARRAY['Conversational pace', 'Can hold full conversation', 'Builds aerobic base', 'Recovery-friendly']),

  ('Pyramid Intervals', 'pyramid-intervals',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves', 'core'],
   'cardio', true, 'advanced',
   ARRAY['1-2-3-4-3-2-1 minute hard efforts', 'Equal rest between intervals', 'Build up then back down', 'Tests mental and physical']),

  ('400m Repeats', '400m-repeats',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves'],
   'cardio', true, 'intermediate',
   ARRAY['Run 400m at goal pace', 'Rest 60-90 seconds', 'Repeat for prescribed reps', 'Classic track workout']),

  ('800m Repeats', '800m-repeats',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves', 'core'],
   'cardio', true, 'advanced',
   ARRAY['Run 800m at threshold pace', 'Rest 2-3 minutes', 'Maintain consistent splits', 'Builds speed endurance']),

  ('Mile Repeats', 'mile-repeats',
   ARRAY['quads', 'hamstrings', 'glutes'], ARRAY['calves', 'core'],
   'cardio', true, 'advanced',
   ARRAY['Run 1 mile at tempo pace', 'Rest 3-4 minutes', 'Focus on even pacing', 'Long interval training']),

  ('Stair Climbing', 'stair-climbing',
   ARRAY['quads', 'glutes', 'calves'], ARRAY['hamstrings', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Find stairs or use machine', 'Maintain steady pace', 'Drive through heels', 'Great leg and cardio work']),

  ('Incline Treadmill Walk', 'incline-treadmill-walk',
   ARRAY['glutes', 'calves', 'hamstrings'], ARRAY['quads', 'core'],
   'cardio', true, 'beginner',
   ARRAY['Set incline to 10-15%', 'Walk at moderate pace', 'Dont hold handrails', 'Low impact cardio']),

  -- Bike/Row Intervals
  ('Bike Tabata', 'bike-tabata',
   ARRAY['quads', 'hamstrings'], ARRAY['glutes', 'calves'],
   'cardio', true, 'advanced',
   ARRAY['20 seconds all-out effort', '10 seconds rest', '8 rounds total (4 minutes)', 'Maximum intensity']),

  ('Rowing Intervals', 'rowing-intervals',
   ARRAY['upper_back', 'quads'], ARRAY['lats', 'biceps', 'hamstrings'],
   'cardio', true, 'intermediate',
   ARRAY['500m hard rowing', '1-2 minute rest', 'Focus on power per stroke', 'Full body cardio']),

  ('Assault Bike Intervals', 'assault-bike-intervals',
   ARRAY['quads', 'hamstrings', 'shoulders'], ARRAY['core', 'calves'],
   'cardio', true, 'intermediate',
   ARRAY['30-60 seconds all-out', 'Equal or double rest', 'Push and pull with arms', 'Full body conditioning']);

-- ============================================================================
-- MOBILITY / STRETCHING / RECOVERY EXERCISES
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Dynamic Stretches
  ('Worlds Greatest Stretch', 'worlds-greatest-stretch',
   ARRAY['hip_flexors', 'hamstrings', 'thoracic'], ARRAY['glutes', 'shoulders'],
   'mobility', false, 'beginner',
   ARRAY['Lunge forward, elbow to instep', 'Rotate and reach to sky', 'Return and repeat other side', 'Full body opener']),

  ('Leg Swings (Front to Back)', 'leg-swings-front-back',
   ARRAY['hip_flexors', 'hamstrings'], ARRAY['glutes'],
   'mobility', false, 'beginner',
   ARRAY['Hold wall for balance', 'Swing leg forward and back', 'Keep leg straight', 'Increase range gradually']),

  ('Leg Swings (Side to Side)', 'leg-swings-lateral',
   ARRAY['adductors', 'abductors'], ARRAY['hip_flexors'],
   'mobility', false, 'beginner',
   ARRAY['Hold wall for balance', 'Swing leg across body and out', 'Keep hips square', 'Open up inner thighs']),

  ('Arm Circles', 'arm-circles',
   ARRAY['shoulders'], ARRAY['upper_back'],
   'mobility', false, 'beginner',
   ARRAY['Arms extended to sides', 'Small circles, gradually larger', 'Forward then backward', 'Warm up shoulders']),

  ('Hip Circles', 'hip-circles',
   ARRAY['hip_flexors', 'glutes'], ARRAY['core'],
   'mobility', false, 'beginner',
   ARRAY['Hands on hips', 'Circle hips clockwise then counter', 'Full range of motion', 'Loosen hip joints']),

  ('Thoracic Rotations', 'thoracic-rotations',
   ARRAY['thoracic', 'obliques'], ARRAY['shoulders'],
   'mobility', false, 'beginner',
   ARRAY['On all fours or seated', 'Hand behind head', 'Rotate elbow to sky', 'Open up upper back']),

  ('Cat-Cow Stretch', 'cat-cow-stretch',
   ARRAY['lower_back', 'abs'], ARRAY['thoracic'],
   'mobility', false, 'beginner',
   ARRAY['On all fours', 'Arch back (cow), round back (cat)', 'Move with breath', 'Spinal mobility']),

  ('Thread the Needle', 'thread-the-needle',
   ARRAY['thoracic', 'shoulders'], ARRAY['lats'],
   'mobility', false, 'beginner',
   ARRAY['On all fours', 'Reach one arm under body', 'Rotate and open to sky', 'Upper back mobility']),

  -- Static Stretches
  ('Standing Quad Stretch', 'standing-quad-stretch',
   ARRAY['quads'], ARRAY['hip_flexors'],
   'mobility', false, 'beginner',
   ARRAY['Stand on one leg', 'Pull heel to glute', 'Keep knees together', 'Hold 30-60 seconds']),

  ('Standing Hamstring Stretch', 'standing-hamstring-stretch',
   ARRAY['hamstrings'], ARRAY['calves', 'lower_back'],
   'mobility', false, 'beginner',
   ARRAY['Extend one leg forward on heel', 'Hinge at hips, reach for toes', 'Keep back flat', 'Hold 30-60 seconds']),

  ('Pigeon Pose', 'pigeon-pose',
   ARRAY['glutes', 'hip_flexors'], ARRAY['hamstrings'],
   'mobility', false, 'intermediate',
   ARRAY['Front leg bent, back leg extended', 'Square hips to floor', 'Fold forward for deeper stretch', 'Hold 1-2 minutes each side']),

  ('Figure Four Stretch', 'figure-four-stretch',
   ARRAY['glutes', 'hip_flexors'], ARRAY['lower_back'],
   'mobility', false, 'beginner',
   ARRAY['Lie on back', 'Ankle on opposite knee', 'Pull bottom leg toward chest', 'Stretches piriformis']),

  ('Hip Flexor Stretch (Kneeling)', 'hip-flexor-stretch-kneeling',
   ARRAY['hip_flexors'], ARRAY['quads'],
   'mobility', false, 'beginner',
   ARRAY['Kneel on one knee', 'Push hips forward', 'Keep torso upright', 'Hold 30-60 seconds']),

  ('90/90 Hip Stretch', '90-90-hip-stretch',
   ARRAY['glutes', 'hip_flexors'], ARRAY['adductors'],
   'mobility', false, 'intermediate',
   ARRAY['Both legs at 90 degree angles', 'Front shin parallel to body', 'Lean forward over front leg', 'Deep hip opener']),

  ('Couch Stretch', 'couch-stretch',
   ARRAY['hip_flexors', 'quads'], ARRAY['glutes'],
   'mobility', false, 'intermediate',
   ARRAY['Back foot on wall or couch', 'Front foot forward in lunge', 'Keep torso upright', 'Intense hip flexor stretch']),

  ('Downward Dog', 'downward-dog',
   ARRAY['hamstrings', 'calves', 'shoulders'], ARRAY['lats', 'core'],
   'mobility', false, 'beginner',
   ARRAY['Hands and feet on floor', 'Hips high, heels reaching down', 'Press chest toward thighs', 'Full body stretch']),

  ('Childs Pose', 'childs-pose',
   ARRAY['lower_back', 'lats'], ARRAY['shoulders', 'hips'],
   'mobility', false, 'beginner',
   ARRAY['Knees wide, big toes together', 'Sit back on heels', 'Arms extended or by sides', 'Relaxation and recovery']),

  ('Seated Forward Fold', 'seated-forward-fold',
   ARRAY['hamstrings', 'lower_back'], ARRAY['calves'],
   'mobility', false, 'beginner',
   ARRAY['Legs extended in front', 'Hinge at hips, reach for feet', 'Keep back as flat as possible', 'Hold 1-2 minutes']),

  ('Supine Spinal Twist', 'supine-spinal-twist',
   ARRAY['lower_back', 'obliques'], ARRAY['glutes', 'thoracic'],
   'mobility', false, 'beginner',
   ARRAY['Lie on back', 'Bring one knee across body', 'Keep shoulders down', 'Gentle spinal rotation']),

  ('Chest Doorway Stretch', 'chest-doorway-stretch',
   ARRAY['chest', 'front_delts'], ARRAY['biceps'],
   'mobility', false, 'beginner',
   ARRAY['Arm on doorframe at 90 degrees', 'Step through doorway', 'Feel stretch in chest', 'Hold 30-60 seconds each side']),

  ('Lat Stretch (Wall)', 'lat-stretch-wall',
   ARRAY['lats'], ARRAY['triceps', 'shoulders'],
   'mobility', false, 'beginner',
   ARRAY['Face wall, arms overhead', 'Hands on wall, push hips back', 'Feel stretch through lats', 'Hold 30-60 seconds']),

  -- Foam Rolling / Self-Myofascial Release
  ('Foam Roll Quads', 'foam-roll-quads',
   ARRAY['quads'], ARRAY[]::TEXT[],
   'mobility', false, 'beginner',
   ARRAY['Face down, roller under thighs', 'Roll from hip to knee', 'Pause on tender spots', '1-2 minutes per leg']),

  ('Foam Roll IT Band', 'foam-roll-it-band',
   ARRAY['quads', 'glutes'], ARRAY[]::TEXT[],
   'mobility', false, 'beginner',
   ARRAY['Side lying, roller under outer thigh', 'Roll from hip to knee', 'Can be intense - breathe through it', '1-2 minutes per side']),

  ('Foam Roll Hamstrings', 'foam-roll-hamstrings',
   ARRAY['hamstrings'], ARRAY[]::TEXT[],
   'mobility', false, 'beginner',
   ARRAY['Sit on roller, hands behind', 'Roll from glutes to back of knee', 'Cross one leg over for more pressure', '1-2 minutes per leg']),

  ('Foam Roll Upper Back', 'foam-roll-upper-back',
   ARRAY['upper_back', 'thoracic'], ARRAY['lats'],
   'mobility', false, 'beginner',
   ARRAY['Roller under upper back', 'Hands behind head', 'Roll up and down, extend over roller', '2-3 minutes']),

  ('Foam Roll Lats', 'foam-roll-lats',
   ARRAY['lats'], ARRAY['triceps'],
   'mobility', false, 'beginner',
   ARRAY['Side lying, roller under armpit', 'Arm extended overhead', 'Roll from armpit to mid-back', '1-2 minutes per side']),

  ('Lacrosse Ball Glutes', 'lacrosse-ball-glutes',
   ARRAY['glutes'], ARRAY['hip_flexors'],
   'mobility', false, 'beginner',
   ARRAY['Sit on lacrosse ball', 'Target glute muscles', 'Roll around to find tight spots', '1-2 minutes per side']);

-- ============================================================================
-- MILITARY / BOOTCAMP EXERCISES
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Classic PT Exercises
  ('8-Count Bodybuilders', '8-count-bodybuilders',
   ARRAY['quads', 'chest', 'core'], ARRAY['shoulders', 'triceps', 'glutes'],
   'push', true, 'intermediate',
   ARRAY['Squat, hands on floor (1)', 'Jump feet back to plank (2)', 'Push-up down (3), up (4)', 'Jumping jack legs out (5), in (6)', 'Jump feet to hands (7)', 'Jump up with arms overhead (8)']),

  ('Flutter Kicks', 'flutter-kicks-military',
   ARRAY['abs', 'hip_flexors'], ARRAY['quads'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, hands under glutes', 'Legs straight, 6 inches off ground', 'Alternate kicking up and down', 'Keep lower back pressed down']),

  ('Scissor Kicks', 'scissor-kicks',
   ARRAY['abs', 'hip_flexors', 'adductors'], ARRAY['quads'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, hands under glutes', 'Legs straight, 6 inches off ground', 'Cross legs over each other alternating', 'Keep core tight throughout']),

  ('Hello Dollies', 'hello-dollies',
   ARRAY['abs', 'hip_flexors', 'adductors'], ARRAY['quads'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, legs raised', 'Spread legs apart wide', 'Bring back together', 'Keep legs straight throughout']),

  ('V-Ups', 'v-ups',
   ARRAY['abs', 'hip_flexors'], ARRAY['quads'],
   'isolation', false, 'intermediate',
   ARRAY['Lie flat, arms overhead', 'Simultaneously lift legs and torso', 'Touch toes at top', 'Lower with control']),

  ('Sit-Ups (Military Style)', 'sit-ups-military',
   ARRAY['abs', 'hip_flexors'], ARRAY['quads'],
   'isolation', false, 'beginner',
   ARRAY['Knees bent, feet anchored', 'Hands behind head or crossed on chest', 'Full sit-up, chest to thighs', 'Classic PT movement']),

  ('Diamond Push-Ups (Military)', 'diamond-push-ups-military',
   ARRAY['triceps', 'chest'], ARRAY['shoulders'],
   'push', true, 'intermediate',
   ARRAY['Hands in diamond shape under chest', 'Keep elbows close to body', 'Lower until chest touches hands', 'Press back up explosively']),

  ('Wide Arm Push-Ups', 'wide-arm-push-ups',
   ARRAY['chest'], ARRAY['shoulders', 'triceps'],
   'push', true, 'beginner',
   ARRAY['Hands wider than shoulder width', 'Lower chest to ground', 'Press back up', 'Focus on chest engagement']),

  ('Ranger Push-Ups', 'ranger-push-ups',
   ARRAY['chest', 'triceps'], ARRAY['shoulders', 'core'],
   'push', true, 'advanced',
   ARRAY['Start in push-up position', 'Lower to ground, hands release briefly', 'Press back up explosively', 'Full range, full effort']),

  ('Army Crawl', 'army-crawl',
   ARRAY['core', 'shoulders'], ARRAY['hip_flexors', 'quads'],
   'isolation', true, 'intermediate',
   ARRAY['Lie face down', 'Pull with forearms, push with toes', 'Stay low to ground', 'Tactical movement pattern']),

  ('Fireman Carry', 'fireman-carry',
   ARRAY['quads', 'glutes', 'core'], ARRAY['shoulders', 'traps'],
   'carry', true, 'advanced',
   ARRAY['Partner across shoulders', 'One arm through legs, one over arm', 'Walk or jog with load', 'Functional strength']),

  ('Buddy Carry', 'buddy-carry',
   ARRAY['quads', 'glutes'], ARRAY['core', 'biceps'],
   'carry', true, 'advanced',
   ARRAY['Partner on back piggyback style', 'Or front carry arms under legs', 'Walk or jog prescribed distance', 'Team exercise']),

  ('Overhead Arm Claps', 'overhead-arm-claps',
   ARRAY['shoulders'], ARRAY['upper_back'],
   'isolation', false, 'beginner',
   ARRAY['Arms extended to sides', 'Clap overhead', 'Return to sides', 'Keep arms straight, fast tempo']),

  ('Jumping Jacks (Military Cadence)', 'jumping-jacks-cadence',
   ARRAY['calves', 'shoulders'], ARRAY['quads', 'core'],
   'cardio', false, 'beginner',
   ARRAY['Side straddle hop', 'Arms overhead when feet apart', 'Arms down when feet together', 'Count in cadence']),

  ('Half Jacks', 'half-jacks',
   ARRAY['calves', 'shoulders'], ARRAY['quads'],
   'cardio', false, 'beginner',
   ARRAY['Like jumping jacks but arms to shoulder height', 'Feet still jump out and in', 'Lower impact on shoulders', 'Continuous movement']),

  ('Squat Thrusts', 'squat-thrusts',
   ARRAY['quads', 'core'], ARRAY['shoulders', 'chest'],
   'push', true, 'intermediate',
   ARRAY['Stand, squat, hands on floor', 'Jump feet back to plank', 'Jump feet back to squat', 'Stand up (no jump at top)']),

  ('Up-Downs', 'up-downs',
   ARRAY['quads', 'chest', 'core'], ARRAY['shoulders'],
   'push', true, 'intermediate',
   ARRAY['Sprint in place', 'On command, drop to ground chest down', 'Pop back up immediately', 'Continue sprinting']),

  ('Cherry Pickers', 'cherry-pickers',
   ARRAY['hamstrings', 'lower_back'], ARRAY['glutes'],
   'hinge', false, 'beginner',
   ARRAY['Feet wide, bend at waist', 'Touch ground between feet', 'Touch outside left foot, center, right foot', 'Continuous motion']),

  ('Windmills', 'windmills',
   ARRAY['obliques', 'hamstrings'], ARRAY['shoulders', 'lower_back'],
   'isolation', false, 'beginner',
   ARRAY['Feet wide, arms extended', 'Rotate to touch opposite foot', 'Alternate sides', 'Keep legs straight']),

  ('Iron Mikes', 'iron-mikes',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves'],
   'squat', true, 'intermediate',
   ARRAY['Alternating jump lunges', 'Switch legs in the air', 'Land softly in lunge', 'Continuous movement']),

  ('Star Jumps', 'star-jumps',
   ARRAY['quads', 'shoulders'], ARRAY['calves', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Squat down', 'Explode up, spread arms and legs', 'Make X shape in air', 'Land softly in squat']),

  ('Prone Row', 'prone-row',
   ARRAY['upper_back', 'rear_delts'], ARRAY['biceps'],
   'pull', false, 'beginner',
   ARRAY['Lie face down', 'Arms extended forward', 'Pull elbows back, squeeze shoulder blades', 'Lower and repeat']),

  ('Supermans (Military)', 'supermans-military',
   ARRAY['lower_back', 'glutes'], ARRAY['hamstrings', 'shoulders'],
   'isolation', false, 'beginner',
   ARRAY['Lie face down, arms extended', 'Lift arms, chest, and legs simultaneously', 'Hold briefly at top', 'Lower with control']),

  ('Dive Bomber Push-Ups', 'dive-bomber-push-ups',
   ARRAY['chest', 'shoulders', 'triceps'], ARRAY['core', 'hip_flexors'],
   'push', true, 'advanced',
   ARRAY['Start in downward dog', 'Dive head toward ground, through hands', 'Finish in upward dog', 'Reverse the motion back'])

ON CONFLICT (name) DO NOTHING;
