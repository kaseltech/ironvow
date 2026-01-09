-- Comprehensive Exercise Library Expansion
-- Phase 4: CrossFit, HIIT, Hyrox, and Strength exercises

-- ============================================================================
-- CROSSFIT / OLYMPIC LIFTING
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Olympic Lifts
  ('Clean', 'clean',
   ARRAY['quads', 'glutes', 'traps'], ARRAY['hamstrings', 'core', 'shoulders'],
   'pull', true, 'advanced',
   ARRAY['Bar over mid-foot', 'First pull to knee, second pull explosive', 'Catch in front squat position', 'Stand to complete']),

  ('Power Clean', 'power-clean',
   ARRAY['quads', 'glutes', 'traps'], ARRAY['hamstrings', 'core'],
   'pull', true, 'advanced',
   ARRAY['Start with bar on floor', 'Explosive pull, shrug and pull under', 'Catch above parallel', 'Stand to finish']),

  ('Hang Clean', 'hang-clean',
   ARRAY['quads', 'glutes', 'traps'], ARRAY['hamstrings', 'core'],
   'pull', true, 'intermediate',
   ARRAY['Start from hang position (above knee)', 'Explosive hip extension', 'Pull under and catch in squat', 'Stand to complete']),

  ('Clean and Jerk', 'clean-and-jerk',
   ARRAY['quads', 'glutes', 'shoulders'], ARRAY['traps', 'core', 'triceps'],
   'push', true, 'advanced',
   ARRAY['Clean bar to shoulders', 'Dip and drive', 'Split or power jerk overhead', 'Recover feet together']),

  ('Snatch', 'snatch',
   ARRAY['quads', 'glutes', 'traps', 'shoulders'], ARRAY['hamstrings', 'core'],
   'pull', true, 'advanced',
   ARRAY['Wide grip on bar', 'Explosive pull from floor', 'Pull under into overhead squat', 'Stand with bar overhead']),

  ('Power Snatch', 'power-snatch',
   ARRAY['quads', 'glutes', 'traps', 'shoulders'], ARRAY['hamstrings', 'core'],
   'pull', true, 'advanced',
   ARRAY['Wide grip on bar', 'Explosive pull from floor', 'Catch overhead above parallel', 'Lock out and stand']),

  ('Hang Snatch', 'hang-snatch',
   ARRAY['quads', 'glutes', 'shoulders'], ARRAY['traps', 'core'],
   'pull', true, 'advanced',
   ARRAY['Start from hang position', 'Explosive hip extension', 'Pull under, catch overhead', 'Stand to complete']),

  ('Push Press', 'push-press',
   ARRAY['shoulders', 'triceps'], ARRAY['quads', 'core'],
   'push', true, 'intermediate',
   ARRAY['Bar at front rack', 'Slight dip with knees', 'Drive through legs to press', 'Lock out overhead']),

  ('Push Jerk', 'push-jerk',
   ARRAY['shoulders', 'triceps'], ARRAY['quads', 'core'],
   'push', true, 'advanced',
   ARRAY['Bar at front rack', 'Dip and drive explosively', 'Drop under bar', 'Lock out and stand']),

  ('Split Jerk', 'split-jerk',
   ARRAY['shoulders', 'triceps'], ARRAY['quads', 'core'],
   'push', true, 'advanced',
   ARRAY['Bar at front rack', 'Dip and drive', 'Split feet front and back', 'Recover to standing']),

  -- CrossFit Skill Movements
  ('Muscle-up', 'muscle-up',
   ARRAY['lats', 'chest', 'triceps'], ARRAY['biceps', 'core', 'shoulders'],
   'pull', true, 'advanced',
   ARRAY['Start hanging from rings or bar', 'Aggressive pull-up with kip', 'Transition over to dip', 'Press to lockout']),

  ('Ring Muscle-up', 'ring-muscle-up',
   ARRAY['lats', 'chest', 'triceps'], ARRAY['biceps', 'core'],
   'pull', true, 'advanced',
   ARRAY['Start in hang on rings', 'Kip and pull aggressively', 'Turn over into false grip dip', 'Lock out at top']),

  ('Bar Muscle-up', 'bar-muscle-up',
   ARRAY['lats', 'chest', 'triceps'], ARRAY['biceps', 'core'],
   'pull', true, 'advanced',
   ARRAY['Start hanging from pull-up bar', 'Aggressive kipping pull', 'Hip to bar, pull over', 'Press to lockout']),

  ('Kipping Pull-up', 'kipping-pull-up',
   ARRAY['lats'], ARRAY['biceps', 'core', 'shoulders'],
   'pull', true, 'intermediate',
   ARRAY['Start in active hang', 'Swing into arch and hollow', 'Use hip drive to pull', 'Chin over bar']),

  ('Butterfly Pull-up', 'butterfly-pull-up',
   ARRAY['lats'], ARRAY['biceps', 'core'],
   'pull', true, 'advanced',
   ARRAY['Circular kipping motion', 'Continuous rhythm', 'Chin over bar each rep', 'High skill requirement']),

  ('Chest-to-Bar Pull-up', 'chest-to-bar-pull-up',
   ARRAY['lats', 'upper_back'], ARRAY['biceps', 'core'],
   'pull', true, 'intermediate',
   ARRAY['Kipping or strict motion', 'Pull until chest touches bar', 'Full range of motion', 'Control descent']),

  ('Ring Dips', 'ring-dips',
   ARRAY['triceps', 'chest'], ARRAY['front_delts', 'core'],
   'push', true, 'intermediate',
   ARRAY['Support position on rings', 'Turn rings out at top', 'Dip to 90 degrees', 'Press to lockout']),

  ('Handstand Push-up', 'handstand-push-up',
   ARRAY['shoulders', 'triceps'], ARRAY['upper_chest', 'core'],
   'push', true, 'advanced',
   ARRAY['Kick up to wall', 'Lower head to floor', 'Press back up', 'Maintain tight core']),

  ('Strict Handstand Push-up', 'strict-handstand-push-up',
   ARRAY['shoulders', 'triceps'], ARRAY['upper_chest', 'core'],
   'push', true, 'advanced',
   ARRAY['Wall-supported handstand', 'Lower under control', 'Press without kip', 'Full lockout']),

  ('Kipping Handstand Push-up', 'kipping-handstand-push-up',
   ARRAY['shoulders', 'triceps'], ARRAY['quads', 'core'],
   'push', true, 'advanced',
   ARRAY['Wall-supported handstand', 'Lower head to floor', 'Kip with legs to press', 'Lock out overhead']),

  ('Toes-to-Bar', 'toes-to-bar',
   ARRAY['abs', 'hip_flexors'], ARRAY['lats', 'grip'],
   'isolation', false, 'intermediate',
   ARRAY['Hang from pull-up bar', 'Kip and raise legs', 'Touch toes to bar', 'Control descent']),

  ('Knees-to-Elbows', 'knees-to-elbows',
   ARRAY['abs', 'hip_flexors'], ARRAY['lats', 'grip'],
   'isolation', false, 'intermediate',
   ARRAY['Hang from pull-up bar', 'Raise knees to elbows', 'Use kip for rhythm', 'Control descent']),

  -- CrossFit WOD Staples
  ('Thrusters', 'thrusters',
   ARRAY['quads', 'shoulders'], ARRAY['glutes', 'triceps', 'core'],
   'push', true, 'intermediate',
   ARRAY['Front squat with barbell', 'Drive out of squat', 'Press overhead in one motion', 'Full lockout']),

  ('Dumbbell Thrusters', 'dumbbell-thrusters',
   ARRAY['quads', 'shoulders'], ARRAY['glutes', 'triceps', 'core'],
   'push', true, 'intermediate',
   ARRAY['Dumbbells at shoulders', 'Squat to depth', 'Drive up and press', 'Lock out overhead']),

  ('Wall Balls', 'wall-balls',
   ARRAY['quads', 'shoulders'], ARRAY['glutes', 'core'],
   'push', true, 'beginner',
   ARRAY['Hold med ball at chest', 'Squat to depth', 'Stand and throw to target', 'Catch and repeat']),

  ('Box Jump Overs', 'box-jump-overs',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Face the box', 'Jump and land on box', 'Step or jump down other side', 'Turn and repeat']),

  ('Double Unders', 'double-unders',
   ARRAY['calves', 'shoulders'], ARRAY['forearms', 'core'],
   'cardio', false, 'intermediate',
   ARRAY['Jump higher than normal', 'Spin rope twice per jump', 'Stay on balls of feet', 'Keep wrists relaxed']),

  ('Rope Climb', 'rope-climb',
   ARRAY['lats', 'biceps', 'grip'], ARRAY['core', 'forearms'],
   'pull', true, 'advanced',
   ARRAY['Jump and grab rope high', 'Use J-hook or S-wrap', 'Climb using legs', 'Controlled descent']),

  ('Legless Rope Climb', 'legless-rope-climb',
   ARRAY['lats', 'biceps', 'grip'], ARRAY['core'],
   'pull', true, 'advanced',
   ARRAY['Hang from rope, legs straight', 'Pull with arms only', 'Hand over hand to top', 'Controlled descent']),

  ('Pistol Squat', 'pistol-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'],
   'squat', true, 'advanced',
   ARRAY['Balance on one leg', 'Extend other leg forward', 'Squat to full depth', 'Drive back up']),

  ('GHD Sit-up', 'ghd-sit-up',
   ARRAY['abs', 'hip_flexors'], ARRAY['quads'],
   'isolation', false, 'intermediate',
   ARRAY['Lock feet in GHD', 'Lower back over pad', 'Sit up explosively', 'Touch floor behind']),

  ('GHD Hip Extension', 'ghd-hip-extension',
   ARRAY['hamstrings', 'glutes'], ARRAY['lower_back'],
   'hinge', true, 'intermediate',
   ARRAY['Face down on GHD', 'Lower torso toward floor', 'Squeeze glutes to rise', 'Full hip extension']);

-- ============================================================================
-- HIIT / CONDITIONING
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Cardio Conditioning
  ('Assault Bike', 'assault-bike',
   ARRAY['quads', 'hamstrings'], ARRAY['shoulders', 'core', 'calves'],
   'cardio', true, 'beginner',
   ARRAY['Push and pull handles', 'Drive legs simultaneously', 'Maintain steady pace or intervals', 'Full body cardio']),

  ('Ski Erg', 'ski-erg',
   ARRAY['lats', 'triceps'], ARRAY['core', 'shoulders'],
   'pull', true, 'beginner',
   ARRAY['Stand facing machine', 'Pull handles down and back', 'Hinge at hips slightly', 'Return to start']),

  ('Rower', 'rower',
   ARRAY['upper_back', 'quads'], ARRAY['lats', 'biceps', 'hamstrings', 'glutes'],
   'pull', true, 'beginner',
   ARRAY['Drive with legs first', 'Lean back and pull to chest', 'Arms away, body forward', 'Legs bend last']),

  ('Echo Bike', 'echo-bike',
   ARRAY['quads', 'hamstrings'], ARRAY['shoulders', 'core'],
   'cardio', true, 'beginner',
   ARRAY['Similar to assault bike', 'Push and pull arms', 'Pedal with legs', 'Great for intervals']),

  ('Battle Ropes', 'battle-ropes',
   ARRAY['shoulders', 'core'], ARRAY['forearms', 'lats'],
   'isolation', false, 'beginner',
   ARRAY['Hold rope ends', 'Create waves alternating or together', 'Keep core tight', 'Various patterns possible']),

  ('Battle Rope Waves', 'battle-rope-waves',
   ARRAY['shoulders'], ARRAY['core', 'forearms'],
   'isolation', false, 'beginner',
   ARRAY['Alternate arms up and down', 'Keep consistent rhythm', 'Slight squat stance', 'Full range of motion']),

  ('Battle Rope Slams', 'battle-rope-slams',
   ARRAY['shoulders', 'core'], ARRAY['lats'],
   'push', false, 'intermediate',
   ARRAY['Raise both rope ends overhead', 'Slam down explosively', 'Slight jump optional', 'Reset and repeat']),

  ('Bear Crawl', 'bear-crawl',
   ARRAY['shoulders', 'core'], ARRAY['quads', 'hip_flexors'],
   'isolation', true, 'beginner',
   ARRAY['On all fours, knees hovering', 'Move opposite hand and foot', 'Keep back flat', 'Forward, backward, or lateral']),

  ('Crab Walk', 'crab-walk',
   ARRAY['triceps', 'shoulders'], ARRAY['core', 'glutes'],
   'isolation', true, 'beginner',
   ARRAY['Sit with hands behind', 'Lift hips off ground', 'Walk forward or backward', 'Keep hips elevated']),

  ('Inchworm', 'inchworm',
   ARRAY['core', 'hamstrings'], ARRAY['shoulders', 'chest'],
   'isolation', false, 'beginner',
   ARRAY['Start standing', 'Fold forward, walk hands out', 'To plank position', 'Walk feet to hands, stand']),

  ('Sprint Intervals', 'sprint-intervals',
   ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['calves', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Maximum effort sprints', 'Short distance (50-100m)', 'Full recovery between', 'Focus on form']),

  ('Hill Sprints', 'hill-sprints',
   ARRAY['quads', 'glutes', 'calves'], ARRAY['hamstrings', 'core'],
   'cardio', true, 'intermediate',
   ARRAY['Find steep incline', 'Sprint to top', 'Walk down for recovery', 'Repeat for sets']),

  ('Shuttle Runs', 'shuttle-runs',
   ARRAY['quads', 'hamstrings'], ARRAY['calves', 'core'],
   'cardio', true, 'beginner',
   ARRAY['Set up markers', 'Sprint to first, touch ground', 'Return to start', 'Continue to each marker']),

  ('Lateral Shuffle', 'lateral-shuffle',
   ARRAY['quads', 'adductors'], ARRAY['glutes', 'calves'],
   'isolation', false, 'beginner',
   ARRAY['Athletic stance', 'Shuffle side to side', 'Stay low', 'Quick feet']),

  -- HIIT Specific
  ('Squat Jumps', 'squat-jumps',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Squat to parallel', 'Explode upward', 'Land softly', 'Immediately squat again']),

  ('Lunge Jumps', 'lunge-jumps',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves'],
   'squat', true, 'intermediate',
   ARRAY['Start in lunge position', 'Jump and switch legs', 'Land in opposite lunge', 'Continue alternating']),

  ('Tuck Jumps', 'tuck-jumps',
   ARRAY['quads', 'hip_flexors'], ARRAY['calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Jump explosively', 'Tuck knees to chest', 'Land softly', 'Reset and repeat']),

  ('Broad Jumps', 'broad-jumps',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Swing arms back', 'Jump forward for distance', 'Land in athletic stance', 'Reset and repeat']),

  ('Plyo Push-ups', 'plyo-push-ups',
   ARRAY['chest', 'triceps'], ARRAY['shoulders', 'core'],
   'push', true, 'advanced',
   ARRAY['Standard push-up descent', 'Explode up, hands leave ground', 'Clap optional', 'Land softly and repeat']),

  ('Burpee Box Jump', 'burpee-box-jump',
   ARRAY['quads', 'chest'], ARRAY['shoulders', 'core', 'calves'],
   'push', true, 'advanced',
   ARRAY['Perform burpee facing box', 'Jump onto box', 'Step down', 'Repeat']),

  ('Devil Press', 'devil-press',
   ARRAY['quads', 'shoulders', 'core'], ARRAY['chest', 'triceps', 'glutes'],
   'push', true, 'advanced',
   ARRAY['Burpee with dumbbells', 'Snatch dumbbells overhead', 'Touch together at top', 'Lower and repeat']),

  ('Man Makers', 'man-makers',
   ARRAY['quads', 'shoulders', 'core'], ARRAY['chest', 'triceps', 'back'],
   'push', true, 'advanced',
   ARRAY['Burpee with dumbbell row each side', 'Clean dumbbells to shoulders', 'Thruster to overhead', 'Lower and repeat']);

-- ============================================================================
-- HYROX SPECIFIC
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  ('Sled Push', 'sled-push',
   ARRAY['quads', 'glutes'], ARRAY['calves', 'core', 'shoulders'],
   'push', true, 'intermediate',
   ARRAY['Low handle position', 'Drive through legs', 'Keep arms extended', 'Short quick steps']),

  ('Sled Pull', 'sled-pull',
   ARRAY['upper_back', 'biceps'], ARRAY['grip', 'core'],
   'pull', true, 'intermediate',
   ARRAY['Face sled, grab rope', 'Pull hand over hand', 'Sit back for leverage', 'Keep rhythm']),

  ('Farmers Carry', 'farmers-carry',
   ARRAY['grip', 'traps'], ARRAY['core', 'forearms'],
   'carry', true, 'beginner',
   ARRAY['Heavy weight in each hand', 'Walk with purpose', 'Keep shoulders back', 'Brace core']),

  ('Sandbag Carry', 'sandbag-carry',
   ARRAY['core', 'shoulders'], ARRAY['quads', 'biceps'],
   'carry', true, 'intermediate',
   ARRAY['Bear hug sandbag to chest', 'Walk with short steps', 'Keep bag tight to body', 'Breathe and brace']),

  ('Sandbag Lunges', 'sandbag-lunges',
   ARRAY['quads', 'glutes'], ARRAY['core', 'shoulders'],
   'squat', true, 'intermediate',
   ARRAY['Sandbag on shoulder or bear hug', 'Step forward into lunge', 'Drive through front heel', 'Alternate legs']),

  ('Sandbag Shoulder', 'sandbag-shoulder',
   ARRAY['quads', 'glutes', 'shoulders'], ARRAY['core', 'biceps'],
   'squat', true, 'intermediate',
   ARRAY['Squat and grip sandbag', 'Explosively lift to shoulder', 'Drop and repeat', 'Alternate shoulders']),

  ('Sandbag Clean', 'sandbag-clean',
   ARRAY['quads', 'glutes', 'upper_back'], ARRAY['core', 'biceps'],
   'pull', true, 'intermediate',
   ARRAY['Straddle sandbag', 'Explosively pull to chest', 'Catch in bear hug', 'Stand tall']),

  ('Sandbag Over Shoulder', 'sandbag-over-shoulder',
   ARRAY['quads', 'glutes', 'core'], ARRAY['upper_back', 'biceps'],
   'pull', true, 'intermediate',
   ARRAY['Squat and grip sandbag', 'Explosive hip extension', 'Pull up and over shoulder', 'Turn and repeat']),

  ('Burpee Broad Jump', 'burpee-broad-jump',
   ARRAY['quads', 'chest'], ARRAY['shoulders', 'core', 'glutes'],
   'push', true, 'intermediate',
   ARRAY['Perform standard burpee', 'Broad jump forward at top', 'Land and immediately drop', 'Continue forward']),

  ('Rowing 1000m', 'rowing-1000m',
   ARRAY['upper_back', 'quads'], ARRAY['lats', 'biceps', 'hamstrings'],
   'pull', true, 'intermediate',
   ARRAY['Standard rowing technique', 'Pace for 1000m distance', 'Push with legs, pull with arms', 'Maintain stroke rate']),

  ('Ski Erg 1000m', 'ski-erg-1000m',
   ARRAY['lats', 'triceps'], ARRAY['core', 'shoulders'],
   'pull', true, 'intermediate',
   ARRAY['Ski erg technique', 'Pace for 1000m distance', 'Full arm extension', 'Powerful pulls']),

  ('Kettlebell Swing', 'kettlebell-swing',
   ARRAY['glutes', 'hamstrings'], ARRAY['core', 'shoulders'],
   'hinge', true, 'beginner',
   ARRAY['Hinge at hips', 'Swing bell between legs', 'Drive hips forward', 'Bell to chest height']),

  ('Russian Kettlebell Swing', 'russian-kettlebell-swing',
   ARRAY['glutes', 'hamstrings'], ARRAY['core', 'shoulders'],
   'hinge', true, 'beginner',
   ARRAY['Hinge at hips', 'Swing bell between legs', 'Drive hips to eye level', 'Control descent']),

  ('American Kettlebell Swing', 'american-kettlebell-swing',
   ARRAY['glutes', 'hamstrings', 'shoulders'], ARRAY['core'],
   'hinge', true, 'intermediate',
   ARRAY['Same as Russian but overhead', 'Full hip extension', 'Bell travels overhead', 'Arms locked at top']),

  ('Kettlebell Snatch', 'kettlebell-snatch',
   ARRAY['glutes', 'shoulders'], ARRAY['hamstrings', 'core'],
   'hinge', true, 'advanced',
   ARRAY['Swing bell between legs', 'Explosive hip drive', 'Pull bell overhead in one motion', 'Lock out at top']),

  ('Kettlebell Clean', 'kettlebell-clean',
   ARRAY['glutes', 'biceps'], ARRAY['hamstrings', 'core'],
   'hinge', true, 'intermediate',
   ARRAY['Swing bell between legs', 'Pull to rack position', 'Bell rests on forearm', 'Stand tall']),

  ('Kettlebell Clean and Press', 'kettlebell-clean-and-press',
   ARRAY['glutes', 'shoulders'], ARRAY['triceps', 'core'],
   'push', true, 'intermediate',
   ARRAY['Clean to rack', 'Press overhead', 'Lower to rack', 'Return to hang']);

-- ============================================================================
-- STRENGTH / 5x5 FOCUSED
-- ============================================================================

INSERT INTO exercises (name, slug, primary_muscles, secondary_muscles, movement_pattern, is_compound, difficulty, instructions) VALUES
  -- Squat Variations
  ('Low Bar Back Squat', 'low-bar-back-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'lower_back', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Bar on rear delts', 'More hip hinge', 'Great for heavy loads', 'Keep chest up']),

  ('High Bar Back Squat', 'high-bar-back-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Bar on upper traps', 'More upright torso', 'Deep squat friendly', 'Drive through heels']),

  ('Pause Squat', 'pause-squat',
   ARRAY['quads', 'glutes'], ARRAY['core', 'hamstrings'],
   'squat', true, 'advanced',
   ARRAY['Squat to depth', 'Pause 2-3 seconds at bottom', 'No bounce', 'Drive up explosively']),

  ('Box Squat', 'box-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Sit back to box', 'Brief pause on box', 'Drive through heels', 'Stand explosively']),

  ('Safety Bar Squat', 'safety-bar-squat',
   ARRAY['quads', 'glutes'], ARRAY['upper_back', 'core'],
   'squat', true, 'intermediate',
   ARRAY['Bar sits on shoulders', 'Hold handles in front', 'Squat to depth', 'More upper back demand']),

  ('Zercher Squat', 'zercher-squat',
   ARRAY['quads', 'glutes'], ARRAY['biceps', 'core'],
   'squat', true, 'advanced',
   ARRAY['Bar in elbow crease', 'Hold tight to chest', 'Squat to depth', 'Very challenging']),

  -- Deadlift Variations
  ('Sumo Deadlift', 'sumo-deadlift',
   ARRAY['glutes', 'quads', 'hamstrings'], ARRAY['lower_back', 'traps'],
   'hinge', true, 'intermediate',
   ARRAY['Wide stance, toes out', 'Grip inside knees', 'Push floor away', 'Lockout with hips']),

  ('Conventional Deadlift', 'conventional-deadlift',
   ARRAY['lower_back', 'glutes', 'hamstrings'], ARRAY['traps', 'quads', 'forearms'],
   'hinge', true, 'advanced',
   ARRAY['Hip-width stance', 'Arms outside legs', 'Drive through floor', 'Lock hips and knees']),

  ('Deficit Deadlift', 'deficit-deadlift',
   ARRAY['lower_back', 'glutes', 'hamstrings'], ARRAY['quads', 'traps'],
   'hinge', true, 'advanced',
   ARRAY['Stand on elevated surface', 'Increases range of motion', 'Same technique as conventional', 'Builds starting strength']),

  ('Block Pull', 'block-pull',
   ARRAY['lower_back', 'glutes', 'traps'], ARRAY['hamstrings'],
   'hinge', true, 'intermediate',
   ARRAY['Bar starts elevated', 'Reduced range of motion', 'Focus on lockout', 'Good for heavy partials']),

  ('Trap Bar Deadlift', 'trap-bar-deadlift',
   ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['lower_back', 'traps'],
   'hinge', true, 'beginner',
   ARRAY['Stand inside trap bar', 'Grip handles at sides', 'More upright position', 'Drive through heels']),

  ('Stiff Leg Deadlift', 'stiff-leg-deadlift',
   ARRAY['hamstrings', 'lower_back'], ARRAY['glutes'],
   'hinge', true, 'intermediate',
   ARRAY['Minimal knee bend', 'Hinge at hips', 'Feel hamstring stretch', 'Dont round back']),

  ('Snatch Grip Deadlift', 'snatch-grip-deadlift',
   ARRAY['upper_back', 'hamstrings', 'glutes'], ARRAY['traps', 'lower_back'],
   'hinge', true, 'advanced',
   ARRAY['Wide snatch grip', 'Increases range of motion', 'Great for upper back', 'Keep lats tight']),

  -- Bench Press Variations
  ('Pause Bench Press', 'pause-bench-press',
   ARRAY['chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'intermediate',
   ARRAY['Lower bar to chest', 'Pause 2-3 seconds', 'No bounce', 'Press explosively']),

  ('Close Grip Bench', 'close-grip-bench',
   ARRAY['triceps', 'chest'], ARRAY['front_delts'],
   'push', true, 'intermediate',
   ARRAY['Shoulder-width grip', 'Elbows closer to body', 'Lower to lower chest', 'Press through triceps']),

  ('Wide Grip Bench Press', 'wide-grip-bench-press',
   ARRAY['chest'], ARRAY['front_delts', 'triceps'],
   'push', true, 'intermediate',
   ARRAY['Grip wider than standard', 'More chest emphasis', 'Touch mid-chest', 'Control descent']),

  ('Floor Press', 'floor-press',
   ARRAY['triceps', 'chest'], ARRAY['front_delts'],
   'push', true, 'intermediate',
   ARRAY['Lie flat on floor', 'Limited range of motion', 'Triceps touch floor', 'Press to lockout']),

  ('Spoto Press', 'spoto-press',
   ARRAY['chest'], ARRAY['triceps', 'front_delts'],
   'push', true, 'advanced',
   ARRAY['Lower bar to 1 inch above chest', 'Pause without touching', 'Press explosively', 'Builds control']),

  ('Larsen Press', 'larsen-press',
   ARRAY['chest'], ARRAY['triceps', 'front_delts', 'core'],
   'push', true, 'advanced',
   ARRAY['Legs straight off bench', 'No leg drive allowed', 'Pure upper body', 'Requires tight core']),

  -- Overhead Press Variations
  ('Strict Press', 'strict-press',
   ARRAY['front_delts', 'side_delts'], ARRAY['triceps', 'core'],
   'push', true, 'intermediate',
   ARRAY['Bar at collar bone', 'No leg drive', 'Press straight up', 'Lock out overhead']),

  ('Behind the Neck Press', 'behind-neck-press',
   ARRAY['side_delts', 'front_delts'], ARRAY['triceps', 'traps'],
   'push', true, 'advanced',
   ARRAY['Bar starts behind head', 'Requires good mobility', 'Press straight up', 'Use lighter weight']),

  ('Z Press', 'z-press',
   ARRAY['shoulders'], ARRAY['triceps', 'core'],
   'push', true, 'advanced',
   ARRAY['Seated on floor, legs straight', 'Press from floor', 'No back support', 'Extremely challenging core']),

  ('Pin Press', 'pin-press',
   ARRAY['shoulders', 'triceps'], ARRAY['chest'],
   'push', true, 'intermediate',
   ARRAY['Bar starts on safety pins', 'Press from dead stop', 'No stretch reflex', 'Builds starting strength']),

  -- Row Variations
  ('Pendlay Row', 'pendlay-row',
   ARRAY['upper_back', 'lats'], ARRAY['biceps', 'lower_back'],
   'pull', true, 'intermediate',
   ARRAY['Bar starts on floor each rep', 'Torso parallel to floor', 'Explosive pull', 'Lower with control']),

  ('Seal Row', 'seal-row',
   ARRAY['upper_back', 'lats'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'intermediate',
   ARRAY['Lie face down on elevated bench', 'Row from hanging position', 'No lower back involvement', 'Pure back work']),

  ('Meadows Row', 'meadows-row',
   ARRAY['lats', 'upper_back'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'intermediate',
   ARRAY['Landmine row stance', 'Perpendicular to bar', 'Row to hip', 'Great lat stretch']),

  ('Kroc Row', 'kroc-row',
   ARRAY['lats', 'upper_back'], ARRAY['biceps', 'grip'],
   'pull', true, 'advanced',
   ARRAY['Heavy dumbbell row', 'Controlled body English allowed', 'High reps with heavy weight', 'Grip builder']),

  ('T-Bar Row', 't-bar-row',
   ARRAY['upper_back', 'lats'], ARRAY['biceps', 'rear_delts'],
   'pull', true, 'intermediate',
   ARRAY['Straddle landmine or T-bar', 'Pull to chest', 'Squeeze shoulder blades', 'Control descent']),

  -- Accessory Strength
  ('Good Mornings', 'good-mornings',
   ARRAY['hamstrings', 'lower_back'], ARRAY['glutes'],
   'hinge', true, 'intermediate',
   ARRAY['Bar on upper back', 'Hinge at hips', 'Slight knee bend', 'Feel hamstring stretch']),

  ('Reverse Hyper', 'reverse-hyper',
   ARRAY['glutes', 'hamstrings'], ARRAY['lower_back'],
   'hinge', false, 'intermediate',
   ARRAY['Lie face down on machine', 'Swing legs up and back', 'Squeeze glutes at top', 'Control descent']),

  ('Belt Squat', 'belt-squat',
   ARRAY['quads', 'glutes'], ARRAY['hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Weight attached to belt', 'No spinal loading', 'Squat to depth', 'Pure leg work']),

  ('Hack Squat', 'hack-squat',
   ARRAY['quads'], ARRAY['glutes', 'hamstrings'],
   'squat', true, 'beginner',
   ARRAY['Back against pad', 'Feet forward on platform', 'Squat to depth', 'Drive through heels']),

  ('Leg Press Calf Raise', 'leg-press-calf-raise',
   ARRAY['calves'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Feet at bottom of platform', 'Push through toes', 'Full range of motion', 'Pause at top']),

  ('Seated Calf Raise', 'seated-calf-raise',
   ARRAY['calves'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Knees under pad', 'Press through balls of feet', 'Pause at top', 'Full stretch at bottom']),

  ('Standing Calf Raise', 'standing-calf-raise',
   ARRAY['calves'], ARRAY[]::TEXT[],
   'isolation', false, 'beginner',
   ARRAY['Shoulders under pad', 'Rise on toes', 'Pause at top', 'Full stretch at bottom'])

ON CONFLICT (name) DO NOTHING;
