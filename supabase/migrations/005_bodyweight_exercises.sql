-- Add bodyweight exercises for outdoor workouts

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Bodyweight Legs
  ('Bodyweight Squat', 'bodyweight-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'],
   'squat', true, 'beginner',
   ARRAY['Stand with feet shoulder-width', 'Squat down keeping chest up', 'Drive through heels to stand']),

  ('Jump Squat', 'jump-squat',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Start in squat position', 'Explode up into a jump', 'Land softly and repeat']),

  ('Walking Lunges', 'walking-lunges',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'],
   'squat', true, 'beginner',
   ARRAY['Step forward into lunge', 'Lower back knee toward ground', 'Step through to next lunge']),

  ('Reverse Lunge', 'reverse-lunge',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Step backward into lunge', 'Lower until back knee near floor', 'Push back to start']),

  ('Side Lunge', 'side-lunge',
   ARRAY['quads', 'glutes', 'adductors'], ARRAY['hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Step wide to the side', 'Bend stepping leg, keep other straight', 'Push back to center']),

  ('Step-ups', 'step-ups',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves'],
   'squat', true, 'beginner',
   ARRAY['Step onto elevated surface', 'Drive through front heel', 'Step down with control']),

  ('Wall Sit', 'wall-sit',
   ARRAY['quads'], ARRAY['glutes', 'core'],
   'isolation', false, 'beginner',
   ARRAY['Back flat against wall', 'Slide down to 90 degree knee bend', 'Hold position']),

  ('Single Leg Glute Bridge', 'single-leg-glute-bridge',
   ARRAY['glutes'], ARRAY['hamstrings', 'core'],
   'hinge', true, 'intermediate',
   ARRAY['Lie on back, one leg extended', 'Drive hips up with planted foot', 'Squeeze glute at top']),

  ('Donkey Kicks', 'donkey-kicks',
   ARRAY['glutes'], ARRAY['hamstrings', 'core'],
   'isolation', false, 'beginner',
   ARRAY['On all fours', 'Kick one leg back and up', 'Squeeze glute at top']),

  ('Fire Hydrants', 'fire-hydrants',
   ARRAY['glutes', 'hip_flexors'], ARRAY['core'],
   'isolation', false, 'beginner',
   ARRAY['On all fours', 'Lift knee out to the side', 'Keep hips stable']),

  -- Bodyweight Upper
  ('Diamond Push-ups', 'diamond-push-ups',
   ARRAY['triceps', 'chest'], ARRAY['front_delts'],
   'push', true, 'intermediate',
   ARRAY['Hands together in diamond shape', 'Lower chest to hands', 'Focus on tricep squeeze']),

  ('Pike Push-ups', 'pike-push-ups',
   ARRAY['front_delts', 'triceps'], ARRAY['upper_chest'],
   'push', true, 'intermediate',
   ARRAY['Hips high in pike position', 'Lower head toward ground', 'Push back up']),

  ('Decline Push-ups', 'decline-push-ups',
   ARRAY['upper_chest', 'front_delts'], ARRAY['triceps'],
   'push', true, 'intermediate',
   ARRAY['Feet elevated on bench', 'Lower chest to ground', 'Push back up']),

  ('Wide Push-ups', 'wide-push-ups',
   ARRAY['chest'], ARRAY['front_delts', 'triceps'],
   'push', true, 'beginner',
   ARRAY['Hands wider than shoulders', 'Lower chest to ground', 'Focus on chest stretch']),

  ('Inverted Row', 'inverted-row',
   ARRAY['upper_back', 'lats'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'beginner',
   ARRAY['Hang under bar or rings', 'Pull chest to bar', 'Keep body straight']),

  -- Bodyweight Core
  ('Mountain Climbers', 'mountain-climbers',
   ARRAY['core', 'hip_flexors'], ARRAY['shoulders', 'quads'],
   'isolation', false, 'beginner',
   ARRAY['Start in plank position', 'Drive knees to chest alternately', 'Keep hips low']),

  ('Bicycle Crunches', 'bicycle-crunches',
   ARRAY['abs', 'obliques'], ARRAY['hip_flexors'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, hands behind head', 'Bring elbow to opposite knee', 'Alternate sides']),

  ('Leg Raises', 'leg-raises',
   ARRAY['abs', 'hip_flexors'], ARRAY['core'],
   'isolation', false, 'intermediate',
   ARRAY['Lie flat on back', 'Raise straight legs to ceiling', 'Lower with control']),

  ('Flutter Kicks', 'flutter-kicks',
   ARRAY['abs', 'hip_flexors'], ARRAY['core'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, legs straight', 'Alternate kicking legs up and down', 'Keep lower back pressed down']),

  ('Dead Bug', 'dead-bug',
   ARRAY['core', 'abs'], ARRAY['hip_flexors'],
   'isolation', false, 'beginner',
   ARRAY['Lie on back, arms and legs up', 'Lower opposite arm and leg', 'Keep lower back flat']),

  ('Bird Dog', 'bird-dog',
   ARRAY['core', 'lower_back'], ARRAY['glutes'],
   'isolation', false, 'beginner',
   ARRAY['On all fours', 'Extend opposite arm and leg', 'Hold briefly, alternate']),

  ('Superman', 'superman',
   ARRAY['lower_back', 'glutes'], ARRAY['hamstrings'],
   'isolation', false, 'beginner',
   ARRAY['Lie face down', 'Lift arms and legs off ground', 'Hold briefly at top']),

  ('Side Plank', 'side-plank',
   ARRAY['obliques', 'core'], ARRAY['shoulders'],
   'isolation', false, 'intermediate',
   ARRAY['Lie on side, prop on forearm', 'Lift hips off ground', 'Keep body in straight line']),

  -- Cardio/Plyometric
  ('Burpees', 'burpees',
   ARRAY['quads', 'chest', 'core'], ARRAY['shoulders', 'triceps'],
   'push', true, 'intermediate',
   ARRAY['Squat down, hands on floor', 'Jump feet back to plank', 'Do push-up, jump feet forward, jump up']),

  ('High Knees', 'high-knees',
   ARRAY['hip_flexors', 'quads'], ARRAY['calves', 'core'],
   'isolation', false, 'beginner',
   ARRAY['Run in place', 'Drive knees high toward chest', 'Pump arms']),

  ('Jumping Jacks', 'jumping-jacks',
   ARRAY['calves', 'shoulders'], ARRAY['quads', 'core'],
   'isolation', false, 'beginner',
   ARRAY['Start with feet together, arms at sides', 'Jump feet out while raising arms', 'Jump back to start']),

  ('Box Jumps', 'box-jumps',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Stand facing box or bench', 'Jump up onto surface', 'Step down with control']),

  ('Skater Jumps', 'skater-jumps',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Jump laterally side to side', 'Land on one leg', 'Swing arms for momentum'])

ON CONFLICT (name) DO NOTHING;
