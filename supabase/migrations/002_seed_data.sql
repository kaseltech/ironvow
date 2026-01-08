-- IronVow Seed Data
-- Equipment and Exercise Library

-- ============================================================================
-- EQUIPMENT
-- ============================================================================

INSERT INTO equipment (id, name, category, icon_name) VALUES
  -- Free Weights
  (gen_random_uuid(), 'Dumbbells', 'free_weights', 'dumbbell'),
  (gen_random_uuid(), 'Barbell', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Kettlebell', 'free_weights', 'kettlebell'),
  (gen_random_uuid(), 'EZ Curl Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Weight Plates', 'free_weights', 'weight'),

  -- Benches & Racks
  (gen_random_uuid(), 'Flat Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Adjustable Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Squat Rack', 'racks', 'rack'),
  (gen_random_uuid(), 'Power Rack', 'racks', 'rack'),
  (gen_random_uuid(), 'Smith Machine', 'machines', 'machine'),

  -- Pull Equipment
  (gen_random_uuid(), 'Pull-up Bar', 'bodyweight', 'pullup'),
  (gen_random_uuid(), 'Lat Pulldown Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Cable Machine', 'machines', 'cable'),
  (gen_random_uuid(), 'Rowing Machine', 'cardio', 'rowing'),

  -- Machines
  (gen_random_uuid(), 'Leg Press', 'machines', 'machine'),
  (gen_random_uuid(), 'Leg Curl Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Leg Extension Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Chest Press Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Shoulder Press Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Pec Deck', 'machines', 'machine'),

  -- Cardio
  (gen_random_uuid(), 'Treadmill', 'cardio', 'treadmill'),
  (gen_random_uuid(), 'Stationary Bike', 'cardio', 'bike'),
  (gen_random_uuid(), 'Elliptical', 'cardio', 'elliptical'),
  (gen_random_uuid(), 'Stair Climber', 'cardio', 'stairs'),

  -- Accessories
  (gen_random_uuid(), 'Resistance Bands', 'accessories', 'bands'),
  (gen_random_uuid(), 'Jump Rope', 'accessories', 'jumprope'),
  (gen_random_uuid(), 'Foam Roller', 'accessories', 'roller'),
  (gen_random_uuid(), 'Medicine Ball', 'accessories', 'ball'),
  (gen_random_uuid(), 'Plyo Box', 'accessories', 'box'),
  (gen_random_uuid(), 'TRX/Suspension Trainer', 'accessories', 'trx'),
  (gen_random_uuid(), 'Ab Wheel', 'accessories', 'wheel'),
  (gen_random_uuid(), 'Dip Station', 'bodyweight', 'dip');

-- ============================================================================
-- EXERCISES - CHEST
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Barbell Bench Press', 'barbell-bench-press',
   ARRAY['chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Lie flat on bench with eyes under bar', 'Grip bar slightly wider than shoulders', 'Unrack and lower to mid-chest', 'Press up explosively']),

  ('Incline Barbell Bench Press', 'incline-barbell-bench-press',
   ARRAY['upper_chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Set bench to 30-45 degree incline', 'Lower bar to upper chest', 'Press up and slightly back']),

  ('Dumbbell Bench Press', 'dumbbell-bench-press',
   ARRAY['chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'beginner',
   ARRAY['Hold dumbbells at chest level', 'Press up while bringing dumbbells together', 'Lower with control']),

  ('Incline Dumbbell Press', 'incline-dumbbell-press',
   ARRAY['upper_chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'beginner',
   ARRAY['Set bench to 30-45 degrees', 'Press dumbbells up and together', 'Focus on upper chest squeeze']),

  ('Dumbbell Flyes', 'dumbbell-flyes',
   ARRAY['chest'], ARRAY['front_delts'],
   'isolation', false, 'beginner',
   ARRAY['Start with arms extended above chest', 'Lower in wide arc with slight elbow bend', 'Squeeze chest to return']),

  ('Cable Crossover', 'cable-crossover',
   ARRAY['chest'], ARRAY['front_delts'],
   'isolation', false, 'intermediate',
   ARRAY['Set cables at high position', 'Step forward, slight lean', 'Bring hands together in arc motion']),

  ('Push-ups', 'push-ups',
   ARRAY['chest'], ARRAY['triceps', 'front_delts', 'core'],
   'push', true, 'beginner',
   ARRAY['Hands slightly wider than shoulders', 'Body in straight line', 'Lower chest to floor', 'Push back up']),

  ('Dips (Chest)', 'dips-chest',
   ARRAY['chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Lean forward on dip bars', 'Lower until upper arms parallel', 'Keep elbows flared slightly']);

-- ============================================================================
-- EXERCISES - BACK
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Barbell Row', 'barbell-row',
   ARRAY['lats', 'upper_back'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'intermediate',
   ARRAY['Hinge at hips, back flat', 'Pull bar to lower chest/upper abs', 'Squeeze shoulder blades together']),

  ('Dumbbell Row', 'dumbbell-row',
   ARRAY['lats', 'upper_back'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'beginner',
   ARRAY['One hand and knee on bench', 'Pull dumbbell to hip', 'Keep elbow close to body']),

  ('Pull-ups', 'pull-ups',
   ARRAY['lats'], ARRAY['biceps', 'upper_back'],
   'pull', true, 'intermediate',
   ARRAY['Grip bar slightly wider than shoulders', 'Pull until chin over bar', 'Lower with control']),

  ('Chin-ups', 'chin-ups',
   ARRAY['lats', 'biceps'], ARRAY['upper_back'],
   'pull', true, 'intermediate',
   ARRAY['Underhand grip, shoulder width', 'Pull until chin over bar', 'Focus on bicep engagement']),

  ('Lat Pulldown', 'lat-pulldown',
   ARRAY['lats'], ARRAY['biceps', 'upper_back'],
   'pull', true, 'beginner',
   ARRAY['Sit with thighs secured', 'Pull bar to upper chest', 'Lean back slightly, chest up']),

  ('Seated Cable Row', 'seated-cable-row',
   ARRAY['upper_back', 'lats'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'beginner',
   ARRAY['Sit upright, feet on platform', 'Pull handle to midsection', 'Squeeze shoulder blades']),

  ('Deadlift', 'deadlift',
   ARRAY['lower_back', 'glutes', 'hamstrings'], ARRAY['traps', 'forearms', 'core'],
   'hinge', true, 'advanced',
   ARRAY['Bar over mid-foot', 'Hinge and grip bar', 'Drive through floor, extend hips', 'Lock out standing tall']),

  ('Romanian Deadlift', 'romanian-deadlift',
   ARRAY['hamstrings', 'lower_back'], ARRAY['glutes'],
   'hinge', true, 'intermediate',
   ARRAY['Start standing with bar', 'Push hips back, slight knee bend', 'Lower until hamstring stretch', 'Drive hips forward to return']),

  ('Face Pulls', 'face-pulls',
   ARRAY['rear_delts', 'upper_back'], ARRAY['traps'],
   'pull', false, 'beginner',
   ARRAY['Cable at face height', 'Pull to face, elbows high', 'Externally rotate at end']);

-- ============================================================================
-- EXERCISES - SHOULDERS
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Overhead Press', 'overhead-press',
   ARRAY['front_delts', 'side_delts'], ARRAY['triceps', 'upper_chest'],
   'push', true, 'intermediate',
   ARRAY['Bar at collar bone', 'Press straight up', 'Lock out overhead', 'Lower with control']),

  ('Dumbbell Shoulder Press', 'dumbbell-shoulder-press',
   ARRAY['front_delts', 'side_delts'], ARRAY['triceps'],
   'push', true, 'beginner',
   ARRAY['Dumbbells at shoulder height', 'Press up and together', 'Lower to starting position']),

  ('Lateral Raises', 'lateral-raises',
   ARRAY['side_delts'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Arms at sides, slight elbow bend', 'Raise to shoulder height', 'Control the descent']),

  ('Front Raises', 'front-raises',
   ARRAY['front_delts'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Arms in front of thighs', 'Raise to shoulder height', 'Alternate or both together']),

  ('Rear Delt Flyes', 'rear-delt-flyes',
   ARRAY['rear_delts'], ARRAY['upper_back'],
   'isolation', false, 'beginner',
   ARRAY['Bend forward at hips', 'Raise arms out to sides', 'Squeeze shoulder blades']),

  ('Arnold Press', 'arnold-press',
   ARRAY['front_delts', 'side_delts'], ARRAY['triceps'],
   'push', true, 'intermediate',
   ARRAY['Start with palms facing you', 'Rotate as you press up', 'Reverse on the way down']),

  ('Upright Row', 'upright-row',
   ARRAY['side_delts', 'traps'], ARRAY['biceps'],
   'pull', true, 'intermediate',
   ARRAY['Narrow grip on bar', 'Pull up to chin, elbows high', 'Control the descent']);

-- ============================================================================
-- EXERCISES - ARMS
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Barbell Curl', 'barbell-curl',
   ARRAY['biceps'], ARRAY['forearms'],
   'isolation', false, 'beginner',
   ARRAY['Shoulder-width grip', 'Curl to shoulders', 'Keep elbows stationary']),

  ('Dumbbell Curl', 'dumbbell-curl',
   ARRAY['biceps'], ARRAY['forearms'],
   'isolation', false, 'beginner',
   ARRAY['Arms at sides, palms forward', 'Curl up, squeeze at top', 'Lower with control']),

  ('Hammer Curls', 'hammer-curls',
   ARRAY['biceps', 'forearms'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Neutral grip (palms facing in)', 'Curl up, maintain grip', 'Works brachialis']),

  ('Preacher Curl', 'preacher-curl',
   ARRAY['biceps'], ARRAY[]::TEXT[],
   'isolation', false, 'intermediate',
   ARRAY['Arms on preacher pad', 'Curl up, squeeze bicep', 'Full stretch at bottom']),

  ('Tricep Pushdown', 'tricep-pushdown',
   ARRAY['triceps'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Cable at high position', 'Push down until arms straight', 'Keep elbows at sides']),

  ('Skull Crushers', 'skull-crushers',
   ARRAY['triceps'], ARRAY[]::TEXT[],
   'isolation', false, 'intermediate',
   ARRAY['Lie flat, arms extended', 'Lower bar to forehead', 'Extend back up']),

  ('Overhead Tricep Extension', 'overhead-tricep-extension',
   ARRAY['triceps'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Dumbbell overhead, both hands', 'Lower behind head', 'Extend back up']),

  ('Dips (Triceps)', 'dips-triceps',
   ARRAY['triceps'], ARRAY['chest', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Upright body position', 'Lower until 90 degrees', 'Keep elbows close to body']),

  ('Close-Grip Bench Press', 'close-grip-bench-press',
   ARRAY['triceps'], ARRAY['chest', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Hands shoulder-width or closer', 'Lower to lower chest', 'Press up, focus on triceps']);

-- ============================================================================
-- EXERCISES - LEGS
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Barbell Squat', 'barbell-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core', 'lower_back'],
   'squat', true, 'intermediate',
   ARRAY['Bar on upper back', 'Feet shoulder-width', 'Squat to parallel or below', 'Drive through heels']),

  ('Front Squat', 'front-squat',
   ARRAY['quads'], ARRAY['glutes', 'core'],
   'squat', true, 'advanced',
   ARRAY['Bar on front delts', 'Elbows high', 'More upright torso', 'Squat deep']),

  ('Goblet Squat', 'goblet-squat',
   ARRAY['quads', 'glutes'], ARRAY['core'],
   'squat', true, 'beginner',
   ARRAY['Hold dumbbell at chest', 'Squat between legs', 'Stay upright']),

  ('Leg Press', 'leg-press',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Feet shoulder-width on platform', 'Lower until 90 degrees', 'Press through heels']),

  ('Lunges', 'lunges',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Step forward', 'Lower until back knee near floor', 'Drive through front heel']),

  ('Bulgarian Split Squat', 'bulgarian-split-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings'],
   'squat', true, 'intermediate',
   ARRAY['Rear foot elevated on bench', 'Lower until thigh parallel', 'Focus on front leg']),

  ('Leg Extension', 'leg-extension',
   ARRAY['quads'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Sit with pad on shins', 'Extend legs fully', 'Squeeze quads at top']),

  ('Leg Curl', 'leg-curl',
   ARRAY['hamstrings'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Lie face down', 'Curl heels to glutes', 'Control the descent']),

  ('Calf Raises', 'calf-raises',
   ARRAY['calves'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Stand on edge of step', 'Lower heels below platform', 'Rise up on toes']),

  ('Hip Thrust', 'hip-thrust',
   ARRAY['glutes'], ARRAY['hamstrings'],
   'hinge', true, 'intermediate',
   ARRAY['Upper back on bench', 'Bar across hips', 'Drive hips up, squeeze glutes', 'Lower with control']),

  ('Glute Bridge', 'glute-bridge',
   ARRAY['glutes'], ARRAY['hamstrings'],
   'hinge', true, 'beginner',
   ARRAY['Lie on back, knees bent', 'Drive hips up', 'Squeeze glutes at top']);

-- ============================================================================
-- EXERCISES - CORE
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Plank', 'plank',
   ARRAY['core'], ARRAY['shoulders'],
   'isolation', false, 'beginner',
   ARRAY['Forearms on ground', 'Body in straight line', 'Hold position', 'Dont let hips sag']),

  ('Crunches', 'crunches',
   ARRAY['abs'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, knees bent', 'Curl shoulders off ground', 'Squeeze abs at top']),

  ('Hanging Leg Raise', 'hanging-leg-raise',
   ARRAY['abs', 'hip_flexors'], ARRAY[]::TEXT[],
   'isolation', false, 'intermediate',
   ARRAY['Hang from bar', 'Raise legs to parallel', 'Lower with control']),

  ('Cable Woodchop', 'cable-woodchop',
   ARRAY['obliques', 'core'], ARRAY[]::TEXT[],
   'isolation', false, 'intermediate',
   ARRAY['Cable at high or low position', 'Rotate through core', 'Control the movement']),

  ('Ab Wheel Rollout', 'ab-wheel-rollout',
   ARRAY['core'], ARRAY['shoulders', 'lats'],
   'isolation', false, 'advanced',
   ARRAY['Kneel with wheel in front', 'Roll out keeping core tight', 'Roll back to start']),

  ('Russian Twist', 'russian-twist',
   ARRAY['obliques'], ARRAY['abs'],
   'isolation', false, 'beginner',
   ARRAY['Sit with knees bent, lean back', 'Rotate side to side', 'Touch weight to floor each side']);

-- ============================================================================
-- EXERCISES - CARDIO
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Treadmill Running', 'treadmill-running',
   ARRAY['cardio'], ARRAY['quads', 'calves', 'hamstrings'],
   'cardio', false, 'beginner',
   ARRAY['Set speed and incline', 'Maintain steady pace', 'Use arms naturally']),

  ('Stationary Bike', 'stationary-bike',
   ARRAY['cardio'], ARRAY['quads', 'hamstrings'],
   'cardio', false, 'beginner',
   ARRAY['Adjust seat height', 'Maintain steady cadence', 'Increase resistance for challenge']),

  ('Rowing Machine', 'rowing-machine',
   ARRAY['cardio', 'upper_back'], ARRAY['lats', 'biceps', 'legs'],
   'cardio', true, 'beginner',
   ARRAY['Drive with legs first', 'Pull handle to chest', 'Extend arms, bend knees to return']),

  ('Jump Rope', 'jump-rope',
   ARRAY['cardio', 'calves'], ARRAY['shoulders', 'forearms'],
   'cardio', false, 'beginner',
   ARRAY['Jump just high enough to clear rope', 'Land softly on balls of feet', 'Keep elbows close to body']),

  ('Burpees', 'burpees',
   ARRAY['cardio', 'chest'], ARRAY['shoulders', 'quads', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Drop to push-up position', 'Perform push-up', 'Jump feet to hands', 'Jump up with arms overhead']);
