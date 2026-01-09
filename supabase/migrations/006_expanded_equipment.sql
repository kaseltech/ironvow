-- Expanded Equipment Library
-- Adds comprehensive equipment for all gym types and workout styles

-- ============================================================================
-- ADDITIONAL EQUIPMENT ITEMS
-- ============================================================================

-- Additional Specialty Barbells
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Olympic Barbell (20kg/45lb)', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Womens Olympic Barbell (15kg/35lb)', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Training Barbell (15kg)', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Cambered Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Buffalo Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Axle Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Log Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Football Bar / Multi-Grip Bar', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Curl Bar (Fixed Weight)', 'free_weights', 'barbell'),
  (gen_random_uuid(), 'Tricep Bar', 'free_weights', 'barbell')
ON CONFLICT (name) DO NOTHING;

-- Plate Varieties
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Competition Bumper Plates', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Training Bumper Plates', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Calibrated Plates (IPF)', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Standard Weight Plates (1")', 'free_weights', 'weight'),
  (gen_random_uuid(), 'Change Plates (0.5-2.5kg)', 'free_weights', 'weight')
ON CONFLICT (name) DO NOTHING;

-- Dumbbells & Kettlebells
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Hex Dumbbells', 'free_weights', 'dumbbell'),
  (gen_random_uuid(), 'Round Dumbbells', 'free_weights', 'dumbbell'),
  (gen_random_uuid(), 'Loadable Dumbbells', 'free_weights', 'dumbbell'),
  (gen_random_uuid(), 'Competition Kettlebells', 'free_weights', 'kettlebell'),
  (gen_random_uuid(), 'Cast Iron Kettlebells', 'free_weights', 'kettlebell'),
  (gen_random_uuid(), 'Adjustable Kettlebell', 'free_weights', 'kettlebell')
ON CONFLICT (name) DO NOTHING;

-- Cable & Pulley Systems
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Dual Adjustable Pulley', 'machines', 'cable'),
  (gen_random_uuid(), 'Cable Crossover Station', 'machines', 'cable'),
  (gen_random_uuid(), 'Single Cable Column', 'machines', 'cable'),
  (gen_random_uuid(), 'Functional Trainer', 'machines', 'cable'),
  (gen_random_uuid(), 'Cable Attachments (Various)', 'accessories', 'cable'),
  (gen_random_uuid(), 'Tricep Rope', 'accessories', 'cable'),
  (gen_random_uuid(), 'Lat Bar', 'accessories', 'cable'),
  (gen_random_uuid(), 'D-Handle', 'accessories', 'cable'),
  (gen_random_uuid(), 'V-Bar', 'accessories', 'cable'),
  (gen_random_uuid(), 'Straight Bar Attachment', 'accessories', 'cable'),
  (gen_random_uuid(), 'Ankle Strap', 'accessories', 'cable')
ON CONFLICT (name) DO NOTHING;

-- Machines (Comprehensive Commercial Gym)
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Hack Squat Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Pendulum Squat', 'machines', 'machine'),
  (gen_random_uuid(), 'V-Squat Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Belt Squat Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Standing Calf Raise Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Seated Calf Raise Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Hip Adductor Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Hip Abductor Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Glute Kickback Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Hip Thrust Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Reverse Hyper Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Back Extension Bench (45 Degree)', 'machines', 'machine'),
  (gen_random_uuid(), 'T-Bar Row Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Chest Supported Row Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Iso-Lateral Row Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Iso-Lateral Chest Press', 'machines', 'machine'),
  (gen_random_uuid(), 'Incline Chest Press Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Decline Chest Press Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Rear Delt / Pec Deck Combo', 'machines', 'machine'),
  (gen_random_uuid(), 'Lateral Raise Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Seated Dip Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Assisted Dip/Chin Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Preacher Curl Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Bicep Curl Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Tricep Extension Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Ab Crunch Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Torso Rotation Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Vertical Leg Press', 'machines', 'machine'),
  (gen_random_uuid(), '45-Degree Leg Press', 'machines', 'machine'),
  (gen_random_uuid(), 'Lying Leg Curl Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Seated Leg Curl Machine', 'machines', 'machine'),
  (gen_random_uuid(), 'Standing Leg Curl Machine', 'machines', 'machine')
ON CONFLICT (name) DO NOTHING;

-- CrossFit / Functional Fitness Equipment
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Wall Ball (Various Weights)', 'functional', 'ball'),
  (gen_random_uuid(), 'D-Ball / Atlas Stone', 'functional', 'ball'),
  (gen_random_uuid(), 'Soft Plyo Box', 'functional', 'box'),
  (gen_random_uuid(), 'Wood Plyo Box', 'functional', 'box'),
  (gen_random_uuid(), 'Steel Plyo Box', 'functional', 'box'),
  (gen_random_uuid(), 'Stackable Plyo Boxes', 'functional', 'box'),
  (gen_random_uuid(), 'Climbing Rope', 'functional', 'rope'),
  (gen_random_uuid(), 'AbMat', 'functional', 'mat'),
  (gen_random_uuid(), 'GHD Machine', 'functional', 'machine'),
  (gen_random_uuid(), 'Reverse Hyper', 'functional', 'machine'),
  (gen_random_uuid(), 'Pegboard', 'functional', 'board'),
  (gen_random_uuid(), 'Pull-up Rig', 'functional', 'rig'),
  (gen_random_uuid(), 'Squat Rig', 'functional', 'rig'),
  (gen_random_uuid(), 'Monster Rig', 'functional', 'rig'),
  (gen_random_uuid(), 'Yoke', 'functional', 'yoke'),
  (gen_random_uuid(), 'Farmers Walk Handles', 'functional', 'handles'),
  (gen_random_uuid(), 'Log Clean & Press', 'functional', 'log'),
  (gen_random_uuid(), 'Circus Dumbbell', 'functional', 'dumbbell')
ON CONFLICT (name) DO NOTHING;

-- Hyrox / Competition Equipment
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Push Sled', 'functional', 'sled'),
  (gen_random_uuid(), 'Pull Sled', 'functional', 'sled'),
  (gen_random_uuid(), 'Prowler Sled', 'functional', 'sled'),
  (gen_random_uuid(), 'Tank Sled (Torque)', 'functional', 'sled'),
  (gen_random_uuid(), 'Sandbag (Various Weights)', 'functional', 'bag'),
  (gen_random_uuid(), 'Sandbag Lunges Bag', 'functional', 'bag'),
  (gen_random_uuid(), 'Ski Erg (Concept2)', 'cardio', 'ski'),
  (gen_random_uuid(), 'BikeErg (Concept2)', 'cardio', 'bike'),
  (gen_random_uuid(), 'RowErg (Concept2)', 'cardio', 'rowing'),
  (gen_random_uuid(), 'Echo Bike', 'cardio', 'bike'),
  (gen_random_uuid(), 'Assault AirRunner', 'cardio', 'treadmill'),
  (gen_random_uuid(), 'Curved Treadmill', 'cardio', 'treadmill'),
  (gen_random_uuid(), 'SkiErg Wall Mount', 'cardio', 'ski')
ON CONFLICT (name) DO NOTHING;

-- HIIT / Circuit Training Equipment
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Tire (Flip Tire)', 'functional', 'tire'),
  (gen_random_uuid(), 'Sledgehammer', 'functional', 'hammer'),
  (gen_random_uuid(), 'Agility Ladder', 'accessories', 'ladder'),
  (gen_random_uuid(), 'Agility Cones', 'accessories', 'cones'),
  (gen_random_uuid(), 'Speed Hurdles', 'accessories', 'hurdles'),
  (gen_random_uuid(), 'Reaction Ball', 'accessories', 'ball'),
  (gen_random_uuid(), 'BOSU Ball', 'accessories', 'ball'),
  (gen_random_uuid(), 'Stability Ball (Swiss Ball)', 'accessories', 'ball'),
  (gen_random_uuid(), 'Landmine Base', 'accessories', 'landmine'),
  (gen_random_uuid(), 'Landmine Handle', 'accessories', 'landmine'),
  (gen_random_uuid(), 'Core Sliders', 'accessories', 'sliders'),
  (gen_random_uuid(), 'Mini Bands (Loop Bands)', 'accessories', 'bands'),
  (gen_random_uuid(), 'Long Resistance Bands', 'accessories', 'bands'),
  (gen_random_uuid(), 'Speed Rope (Weighted)', 'accessories', 'jumprope'),
  (gen_random_uuid(), 'Double Under Rope', 'accessories', 'jumprope')
ON CONFLICT (name) DO NOTHING;

-- Racks & Platforms
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Competition Power Rack', 'racks', 'rack'),
  (gen_random_uuid(), 'Full Power Cage', 'racks', 'rack'),
  (gen_random_uuid(), 'Combo Rack (Competition)', 'racks', 'rack'),
  (gen_random_uuid(), 'Mono Lift', 'racks', 'rack'),
  (gen_random_uuid(), 'Deadlift Platform', 'platforms', 'platform'),
  (gen_random_uuid(), 'Weightlifting Platform', 'platforms', 'platform'),
  (gen_random_uuid(), 'Combo Platform (Squat + DL)', 'platforms', 'platform'),
  (gen_random_uuid(), 'Jerk Blocks', 'platforms', 'blocks'),
  (gen_random_uuid(), 'Pulling Blocks', 'platforms', 'blocks'),
  (gen_random_uuid(), 'Crash Pads / Mats', 'platforms', 'mat')
ON CONFLICT (name) DO NOTHING;

-- Benches (Additional)
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Competition Bench (IPF Spec)', 'benches', 'bench'),
  (gen_random_uuid(), 'Wide Pad Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Incline Bench (Fixed)', 'benches', 'bench'),
  (gen_random_uuid(), 'Decline Bench (Fixed)', 'benches', 'bench'),
  (gen_random_uuid(), 'FID Bench (Flat/Incline/Decline)', 'benches', 'bench'),
  (gen_random_uuid(), 'Hip Thrust Bench', 'benches', 'bench'),
  (gen_random_uuid(), 'Sissy Squat Bench', 'benches', 'bench')
ON CONFLICT (name) DO NOTHING;

-- Calisthenics / Street Workout
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Parallel Bars (Outdoor)', 'bodyweight', 'dip'),
  (gen_random_uuid(), 'High Bar', 'bodyweight', 'pullup'),
  (gen_random_uuid(), 'Low Bar', 'bodyweight', 'pullup'),
  (gen_random_uuid(), 'Swedish Stall Bars', 'bodyweight', 'bars'),
  (gen_random_uuid(), 'Monkey Bars', 'bodyweight', 'bars'),
  (gen_random_uuid(), 'Muscle Up Bar', 'bodyweight', 'pullup'),
  (gen_random_uuid(), 'Ring Straps', 'bodyweight', 'rings'),
  (gen_random_uuid(), 'Handstand Canes', 'bodyweight', 'canes')
ON CONFLICT (name) DO NOTHING;

-- Personal Accessories
INSERT INTO equipment (id, name, category, icon_name) VALUES
  (gen_random_uuid(), 'Weightlifting Shoes', 'accessories', 'shoes'),
  (gen_random_uuid(), 'Deadlift Slippers', 'accessories', 'shoes'),
  (gen_random_uuid(), 'Squat Shoes', 'accessories', 'shoes'),
  (gen_random_uuid(), 'Lever Belt', 'accessories', 'belt'),
  (gen_random_uuid(), 'Prong Belt', 'accessories', 'belt'),
  (gen_random_uuid(), 'Velcro Belt', 'accessories', 'belt'),
  (gen_random_uuid(), 'Elbow Sleeves', 'accessories', 'sleeves'),
  (gen_random_uuid(), 'Elbow Wraps', 'accessories', 'wraps'),
  (gen_random_uuid(), 'Hip Circle Band', 'accessories', 'bands'),
  (gen_random_uuid(), 'Chalk / Liquid Chalk', 'accessories', 'chalk'),
  (gen_random_uuid(), 'Wrist Wraps', 'accessories', 'wraps'),
  (gen_random_uuid(), 'Figure 8 Straps', 'accessories', 'straps')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- EXPAND AND ADD EQUIPMENT PRESETS
-- ============================================================================

-- Delete existing presets to recreate with expanded lists
DELETE FROM equipment_presets;

-- Large Commercial Gym (Planet Fitness, LA Fitness, Equinox, etc.)
INSERT INTO equipment_presets (name, description, icon, equipment_names) VALUES
(
  'Large Commercial Gym',
  'Full-service gym with extensive equipment (Equinox, Lifetime, LA Fitness)',
  '🏢',
  ARRAY[
    -- Free Weights
    'Dumbbells', 'Hex Dumbbells', 'Barbell', 'Olympic Barbell (20kg/45lb)', 'EZ Curl Bar',
    'Weight Plates', 'Kettlebells', 'Cast Iron Kettlebells',
    -- Benches
    'Flat Bench', 'Adjustable Bench', 'Incline Bench (Fixed)', 'Decline Bench (Fixed)',
    'Preacher Curl Bench', 'Hip Thrust Bench',
    -- Racks
    'Squat Rack', 'Power Rack', 'Smith Machine', 'Half Rack',
    -- Cable Systems
    'Cable Machine', 'Cable Crossover Station', 'Functional Trainer', 'Dual Adjustable Pulley',
    'Tricep Rope', 'Lat Bar', 'D-Handle', 'V-Bar', 'Straight Bar Attachment', 'Ankle Strap',
    -- Pull Equipment
    'Pull-up Bar', 'Lat Pulldown Machine', 'Assisted Dip/Chin Machine',
    -- Chest Machines
    'Chest Press Machine', 'Iso-Lateral Chest Press', 'Incline Chest Press Machine', 'Pec Deck',
    -- Back Machines
    'Seated Row Machine', 'T-Bar Row Machine', 'Chest Supported Row Machine', 'Iso-Lateral Row Machine',
    -- Shoulder Machines
    'Shoulder Press Machine', 'Lateral Raise Machine', 'Rear Delt / Pec Deck Combo',
    -- Arm Machines
    'Preacher Curl Machine', 'Bicep Curl Machine', 'Tricep Extension Machine', 'Seated Dip Machine',
    -- Leg Machines
    'Leg Press', '45-Degree Leg Press', 'Hack Squat Machine', 'Leg Extension Machine',
    'Leg Curl Machine', 'Lying Leg Curl Machine', 'Seated Leg Curl Machine',
    'Hip Adductor Machine', 'Hip Abductor Machine', 'Glute Kickback Machine',
    'Standing Calf Raise Machine', 'Seated Calf Raise Machine',
    -- Core
    'Ab Crunch Machine', 'Back Extension Bench (45 Degree)', 'Ab Bench', 'Roman Chair / GHD',
    -- Cardio
    'Treadmill', 'Stationary Bike', 'Elliptical', 'Stair Climber', 'Rowing Machine',
    -- Accessories
    'Resistance Bands', 'Foam Roller', 'Medicine Ball', 'Yoga Mat', 'Plyo Box', 'Dip Station'
  ]
),

-- Basic Commercial Gym (Planet Fitness style - no heavy free weights)
(
  'Basic Commercial Gym',
  'Limited free weights, machine-focused (Planet Fitness, Anytime Fitness)',
  '🏋️',
  ARRAY[
    'Dumbbells', 'Adjustable Bench', 'Flat Bench',
    'Smith Machine', 'Cable Machine',
    'Lat Pulldown Machine', 'Seated Row Machine',
    'Chest Press Machine', 'Shoulder Press Machine', 'Pec Deck',
    'Leg Press', 'Leg Extension Machine', 'Leg Curl Machine',
    'Hip Adductor Machine', 'Hip Abductor Machine',
    'Preacher Curl Machine', 'Tricep Extension Machine',
    'Ab Crunch Machine',
    'Treadmill', 'Stationary Bike', 'Elliptical', 'Stair Climber',
    'Resistance Bands', 'Yoga Mat'
  ]
),

-- CrossFit Box (Expanded)
(
  'CrossFit Box',
  'Functional fitness equipment for CrossFit-style WODs',
  '🏋️',
  ARRAY[
    -- Barbells & Weights
    'Barbell', 'Olympic Barbell (20kg/45lb)', 'Womens Olympic Barbell (15kg/35lb)',
    'Bumper Plates', 'Training Bumper Plates', 'Change Plates (0.5-2.5kg)',
    -- Free Weights
    'Dumbbells', 'Kettlebells', 'Competition Kettlebells',
    -- Racks & Rigs
    'Squat Rack', 'Pull-up Rig', 'Monster Rig',
    -- Gymnastics
    'Pull-up Bar', 'Gymnastics Rings', 'Parallettes', 'Pegboard', 'Climbing Rope',
    -- Conditioning
    'Wall Ball (Various Weights)', 'Slam Ball', 'D-Ball / Atlas Stone',
    'Rower (Concept2)', 'RowErg (Concept2)', 'Assault Bike', 'Echo Bike',
    'Ski Erg', 'BikeErg (Concept2)',
    -- Boxes & Platforms
    'Plyo Box', 'Wood Plyo Box', 'Soft Plyo Box',
    -- Equipment
    'GHD Machine', 'AbMat', 'Jump Rope', 'Double Under Rope', 'Speed Rope (Weighted)',
    'Resistance Bands', 'Pull-up Assist Bands', 'Mini Bands (Loop Bands)',
    'Battle Ropes', 'Sandbag (Various Weights)',
    -- Strongman
    'Yoke', 'Farmers Walk Handles', 'Tire (Flip Tire)', 'Push Sled', 'Prowler Sled'
  ]
),

-- Hyrox Training Center
(
  'Hyrox Training',
  'Equipment for Hyrox competition training and functional racing',
  '🔥',
  ARRAY[
    -- Cardio (Hyrox specific)
    'RowErg (Concept2)', 'Ski Erg', 'Ski Erg (Concept2)', 'SkiErg Wall Mount',
    'Echo Bike', 'Assault Bike', 'Assault AirRunner', 'Curved Treadmill', 'Treadmill',
    -- Sled Work
    'Push Sled', 'Pull Sled', 'Prowler Sled', 'Tank Sled (Torque)',
    -- Carries
    'Farmers Walk Handles', 'Sandbag (Various Weights)', 'Sandbag Lunges Bag',
    -- Wall Balls & Strength
    'Wall Ball (Various Weights)', 'Kettlebells', 'Barbell', 'Bumper Plates',
    -- Boxes
    'Plyo Box', 'Soft Plyo Box',
    -- General
    'Pull-up Bar', 'Battle Ropes', 'Jump Rope', 'Resistance Bands'
  ]
),

-- Powerlifting Gym (Expanded)
(
  'Powerlifting Gym',
  'Specialized equipment for serious powerlifting training',
  '💪',
  ARRAY[
    -- Barbells
    'Barbell', 'Olympic Barbell (20kg/45lb)', 'Safety Squat Bar', 'Trap Bar / Hex Bar',
    'Swiss Bar', 'Football Bar / Multi-Grip Bar', 'Cambered Bar', 'Buffalo Bar',
    -- Plates
    'Olympic Plates', 'Calibrated Plates (IPF)', 'Bumper Plates', 'Change Plates (0.5-2.5kg)',
    -- Racks & Platforms
    'Squat Rack', 'Power Rack', 'Competition Power Rack', 'Mono Lift', 'Combo Rack (Competition)',
    'Deadlift Platform', 'Combo Platform (Squat + DL)',
    -- Benches
    'Flat Bench', 'Competition Bench (IPF Spec)', 'Wide Pad Bench', 'Adjustable Bench',
    -- Accessories Machines
    'Belt Squat Machine', 'Reverse Hyper Machine', 'GHD Machine', 'Lat Pulldown Machine',
    'Cable Machine', 'Leg Press', 'Leg Curl Machine',
    -- Bands & Chains
    'Resistance Bands', 'Long Resistance Bands', 'Chains',
    -- Personal Gear
    'Lifting Belt', 'Lever Belt', 'Prong Belt',
    'Knee Sleeves', 'Elbow Sleeves', 'Wrist Wraps', 'Lifting Straps',
    'Chalk / Liquid Chalk', 'Weightlifting Shoes', 'Squat Shoes', 'Deadlift Slippers',
    -- Assistance
    'Dumbbells', 'Pull-up Bar', 'Dip Station'
  ]
),

-- Olympic Weightlifting Gym
(
  'Olympic Weightlifting',
  'Equipment for Olympic lifting (snatch, clean & jerk)',
  '🥇',
  ARRAY[
    -- Barbells
    'Barbell', 'Olympic Barbell (20kg/45lb)', 'Womens Olympic Barbell (15kg/35lb)',
    'Training Barbell (15kg)',
    -- Plates
    'Bumper Plates', 'Competition Bumper Plates', 'Training Bumper Plates',
    'Change Plates (0.5-2.5kg)',
    -- Platforms & Racks
    'Squat Rack', 'Weightlifting Platform', 'Jerk Blocks', 'Pulling Blocks',
    'Crash Pads / Mats',
    -- Assistance
    'Dumbbells', 'Kettlebells', 'Pull-up Bar',
    'GHD Machine', 'Back Extension Bench (45 Degree)',
    -- Personal Gear
    'Lifting Belt', 'Weightlifting Shoes', 'Knee Sleeves',
    'Wrist Wraps', 'Chalk / Liquid Chalk'
  ]
),

-- Strength Training / 5x5 Focus
(
  'Strength Training (5x5)',
  'Essential equipment for Starting Strength, StrongLifts, and linear progression programs',
  '🎯',
  ARRAY[
    -- Core Equipment
    'Barbell', 'Olympic Barbell (20kg/45lb)', 'Weight Plates', 'Olympic Plates',
    'Squat Rack', 'Power Rack',
    'Flat Bench', 'Adjustable Bench',
    -- Assistance
    'Dumbbells', 'EZ Curl Bar', 'Pull-up Bar', 'Dip Station',
    'Cable Machine', 'Lat Pulldown Machine',
    -- Accessories
    'Lifting Belt', 'Chalk / Liquid Chalk', 'Resistance Bands'
  ]
),

-- HIIT / Circuit Training
(
  'HIIT / Circuit Training',
  'Equipment for high-intensity interval training and circuit workouts',
  '⚡',
  ARRAY[
    -- Cardio
    'Treadmill', 'Assault Bike', 'Echo Bike', 'Rowing Machine', 'Jump Rope',
    'Speed Rope (Weighted)', 'Stationary Bike', 'Spin Bike',
    -- Free Weights
    'Dumbbells', 'Kettlebells', 'Medicine Ball', 'Slam Ball', 'Wall Ball (Various Weights)',
    -- Bodyweight
    'Pull-up Bar', 'Plyo Box', 'Soft Plyo Box', 'TRX/Suspension Trainer', 'Dip Station',
    -- Accessories
    'Battle Ropes', 'Agility Ladder', 'Agility Cones', 'Speed Hurdles',
    'BOSU Ball', 'Stability Ball (Swiss Ball)', 'Core Sliders',
    'Resistance Bands', 'Mini Bands (Loop Bands)', 'Sandbag (Various Weights)',
    -- Floor
    'Yoga Mat', 'Ab Wheel'
  ]
),

-- Calisthenics / Street Workout
(
  'Calisthenics / Street Workout',
  'Equipment for bodyweight strength and skill training',
  '🤸',
  ARRAY[
    -- Bars
    'Pull-up Bar', 'High Bar', 'Low Bar', 'Muscle Up Bar',
    'Parallel Bars (Outdoor)', 'Dip Station', 'Monkey Bars',
    -- Rings & Straps
    'Gymnastics Rings', 'Ring Straps', 'TRX/Suspension Trainer',
    -- Other
    'Parallettes', 'Push-up Handles', 'Swedish Stall Bars', 'Handstand Canes',
    -- Accessories
    'Resistance Bands', 'Pull-up Assist Bands', 'Yoga Mat',
    'Weight Vest', 'Dip Belt'
  ]
),

-- Hotel / Travel (Expanded)
(
  'Hotel / Travel Gym',
  'Typical equipment found in hotel fitness centers',
  '🏨',
  ARRAY[
    'Dumbbells', 'Adjustable Bench', 'Flat Bench',
    'Cable Machine', 'Smith Machine',
    'Treadmill', 'Stationary Bike', 'Elliptical',
    'Lat Pulldown Machine', 'Chest Press Machine',
    'Leg Press', 'Leg Extension Machine', 'Leg Curl Machine',
    'Yoga Mat', 'Resistance Bands', 'Stability Ball (Swiss Ball)'
  ]
),

-- Home Gym (Comprehensive)
(
  'Full Home Gym',
  'Well-equipped home/garage gym setup',
  '🏠',
  ARRAY[
    -- Free Weights
    'Barbell', 'Olympic Barbell (20kg/45lb)', 'EZ Curl Bar',
    'Dumbbells', 'Adjustable Dumbbells', 'Hex Dumbbells',
    'Kettlebells', 'Weight Plates', 'Bumper Plates', 'Olympic Plates',
    -- Rack & Bench
    'Power Rack', 'Squat Rack', 'Half Rack',
    'Adjustable Bench', 'Flat Bench', 'FID Bench (Flat/Incline/Decline)',
    -- Pull Equipment
    'Pull-up Bar', 'Wall-Mounted Pull-up Bar', 'Lat Pulldown Machine', 'Cable Machine',
    'Dip Station', 'Gymnastics Rings',
    -- Cardio
    'Rower (Concept2)', 'Air Bike / Assault Bike', 'Spin Bike', 'Treadmill (Folding)',
    -- Accessories
    'Resistance Bands', 'Foam Roller', 'Jump Rope', 'Ab Wheel', 'Medicine Ball',
    'Plyo Box', 'Yoga Mat', 'Landmine Attachment', 'Lifting Belt'
  ]
),

-- Home Basics (Minimal)
(
  'Home Basics',
  'Essential equipment for a minimal home gym',
  '🏡',
  ARRAY[
    'Adjustable Dumbbells', 'Kettlebells',
    'Adjustable Bench', 'Pull-up Bar',
    'Resistance Bands', 'Yoga Mat', 'Jump Rope', 'Ab Wheel'
  ]
),

-- Bodyweight Only
(
  'Bodyweight Only',
  'No equipment needed - pure bodyweight training',
  '🧘',
  ARRAY[
    'Pull-up Bar', 'Dip Station', 'Parallettes',
    'Yoga Mat', 'Resistance Bands', 'Ab Wheel'
  ]
),

-- Outdoor / Park
(
  'Outdoor / Park Workout',
  'Equipment commonly found at outdoor fitness areas',
  '🌳',
  ARRAY[
    'Pull-up Bar', 'Parallel Bars (Outdoor)', 'Monkey Bars',
    'Low Bar', 'High Bar',
    'Resistance Bands', 'Jump Rope',
    'Yoga Mat'
  ]
);

-- Add gym_type for new categories
ALTER TABLE gym_profiles
DROP CONSTRAINT IF EXISTS gym_profiles_gym_type_check;

ALTER TABLE gym_profiles
ADD CONSTRAINT gym_profiles_gym_type_check
CHECK (gym_type IN ('commercial', 'crossfit', 'powerlifting', 'olympic', 'hotel', 'home', 'hiit', 'calisthenics', 'outdoor', 'custom'));
