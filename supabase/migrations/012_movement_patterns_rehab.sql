-- Migration: Add movement patterns and rehab exercises
-- This enables injury-aware exercise recommendations and rehab workouts

-- =============================================================================
-- 1. ADD MOVEMENT PATTERN COLUMNS TO EXERCISES
-- =============================================================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_patterns TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS contraindications TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rehab_for TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN exercises.movement_patterns IS 'Movement patterns like overhead, impact, spinal_loading, deep_knee_flexion';
COMMENT ON COLUMN exercises.contraindications IS 'Injury types this exercise is bad for: shoulder_impingement, knee_injury, lower_back, cervical';
COMMENT ON COLUMN exercises.rehab_for IS 'Injury types this exercise helps rehab: rotator_cuff, neck_stability, hip_mobility';

-- =============================================================================
-- 2. TAG HIGH-RISK EXERCISES WITH MOVEMENT PATTERNS
-- =============================================================================

-- OVERHEAD movements (shoulder stress, impingement risk)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'overhead')
WHERE name ILIKE '%overhead%'
   OR name ILIKE '%press%' AND (name ILIKE '%shoulder%' OR name ILIKE '%military%' OR name ILIKE '%push press%')
   OR name ILIKE '%jerk%'
   OR name ILIKE '%snatch%'
   OR name ILIKE '%thruster%'
   OR name ILIKE '%hspu%'
   OR name ILIKE '%handstand%'
   OR name ILIKE '%z press%'
   OR name ILIKE '%btn%'
   OR name ILIKE '%behind the neck%';

-- IMPACT/PLYOMETRIC movements (joint stress, knee/ankle risk)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'impact')
WHERE name ILIKE '%jump%'
   OR name ILIKE '%box jump%'
   OR name ILIKE '%burpee%'
   OR name ILIKE '%plyo%'
   OR name ILIKE '%bound%'
   OR name ILIKE '%skip%'
   OR name ILIKE '%hop%'
   OR name ILIKE '%double under%';

-- SPINAL LOADING (axial compression, disc risk)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'spinal_loading')
WHERE name ILIKE '%squat%' AND name NOT ILIKE '%bodyweight%'
   OR name ILIKE '%deadlift%'
   OR name ILIKE '%good morning%'
   OR name ILIKE '%back extension%'
   OR name ILIKE '%rack pull%'
   OR name ILIKE '%shrug%' AND name ILIKE '%barbell%';

-- DEEP KNEE FLEXION (knee stress)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'deep_knee_flexion')
WHERE name ILIKE '%squat%'
   OR name ILIKE '%lunge%'
   OR name ILIKE '%pistol%'
   OR name ILIKE '%leg press%'
   OR name ILIKE '%split squat%'
   OR name ILIKE '%step up%';

-- HIP HINGE (lower back stress if done incorrectly)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'hip_hinge')
WHERE name ILIKE '%deadlift%'
   OR name ILIKE '%rdl%'
   OR name ILIKE '%romanian%'
   OR name ILIKE '%good morning%'
   OR name ILIKE '%swing%'
   OR name ILIKE '%hip thrust%'
   OR name ILIKE '%glute bridge%';

-- ROTATION (disc/spine risk for some)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'rotation')
WHERE name ILIKE '%twist%'
   OR name ILIKE '%rotation%'
   OR name ILIKE '%woodchop%'
   OR name ILIKE '%russian twist%';

-- WRIST LOADING (wrist stress)
UPDATE exercises SET movement_patterns = array_append(movement_patterns, 'wrist_loading')
WHERE name ILIKE '%push-up%'
   OR name ILIKE '%pushup%'
   OR name ILIKE '%front squat%'
   OR name ILIKE '%clean%'
   OR name ILIKE '%handstand%'
   OR name ILIKE '%plank%';

-- =============================================================================
-- 3. SET CONTRAINDICATIONS BASED ON MOVEMENT PATTERNS
-- =============================================================================

-- Shoulder issues → avoid overhead
UPDATE exercises SET contraindications = array_append(contraindications, 'shoulder_impingement')
WHERE 'overhead' = ANY(movement_patterns);

UPDATE exercises SET contraindications = array_append(contraindications, 'shoulder_injury')
WHERE 'overhead' = ANY(movement_patterns);

-- Knee issues → avoid impact and deep flexion
UPDATE exercises SET contraindications = array_append(contraindications, 'knee_injury')
WHERE 'impact' = ANY(movement_patterns) OR 'deep_knee_flexion' = ANY(movement_patterns);

-- Lower back issues → avoid spinal loading, hip hinge, rotation
UPDATE exercises SET contraindications = array_append(contraindications, 'lower_back')
WHERE 'spinal_loading' = ANY(movement_patterns)
   OR 'hip_hinge' = ANY(movement_patterns)
   OR 'rotation' = ANY(movement_patterns);

-- Cervical/neck issues → avoid spinal loading and overhead
UPDATE exercises SET contraindications = array_append(contraindications, 'cervical')
WHERE 'spinal_loading' = ANY(movement_patterns) OR 'overhead' = ANY(movement_patterns);

-- Wrist issues → avoid wrist loading
UPDATE exercises SET contraindications = array_append(contraindications, 'wrist_injury')
WHERE 'wrist_loading' = ANY(movement_patterns);

-- =============================================================================
-- 4. ADD REHAB/STRETCHING EXERCISES (using individual inserts to handle conflicts)
-- =============================================================================

-- Helper function to upsert exercises
DO $$
DECLARE
  rehab_exercises TEXT[][] := ARRAY[
    -- SHOULDER REHAB [name, slug, description, primary_muscles, secondary_muscles, is_compound, difficulty, movement_patterns, rehab_for]
    ARRAY['Band Pull-Aparts', 'band-pull-aparts', 'Pull resistance band apart at chest height, squeezing shoulder blades together', 'rear_delts,rhomboids', 'traps', 'false', 'beginner', 'scapular', 'shoulder_impingement,rotator_cuff,posture'],
    ARRAY['Face Pulls', 'face-pulls', 'Pull cable or band to face level, externally rotating shoulders', 'rear_delts,rhomboids', 'traps,rotator_cuff', 'false', 'beginner', 'scapular', 'shoulder_impingement,rotator_cuff,posture'],
    ARRAY['External Rotation', 'external-rotation', 'Rotate arm outward against resistance, elbow at side', 'rotator_cuff', 'rear_delts', 'false', 'beginner', '', 'rotator_cuff,shoulder_injury'],
    ARRAY['Internal Rotation', 'internal-rotation', 'Rotate arm inward against resistance, elbow at side', 'rotator_cuff', 'subscapularis', 'false', 'beginner', '', 'rotator_cuff,shoulder_injury'],
    ARRAY['Scapular Push-ups', 'scapular-pushups', 'From plank, protract and retract shoulder blades without bending arms', 'serratus_anterior', 'traps', 'false', 'beginner', 'scapular', 'shoulder_impingement,scapular_dyskinesis'],
    ARRAY['Wall Slides', 'wall-slides', 'Slide arms up wall while maintaining contact, improving shoulder mobility', 'shoulders', 'traps', 'false', 'beginner', 'overhead', 'shoulder_impingement,shoulder_mobility'],
    ARRAY['Prone Y Raises', 'prone-y-raises', 'Lying face down, raise arms in Y position to strengthen lower traps', 'lower_traps', 'rhomboids', 'false', 'beginner', 'scapular', 'shoulder_impingement,posture'],
    ARRAY['Prone T Raises', 'prone-t-raises', 'Lying face down, raise arms out to sides to strengthen mid traps', 'mid_traps,rhomboids', 'rear_delts', 'false', 'beginner', 'scapular', 'shoulder_impingement,posture'],
    -- NECK/CERVICAL REHAB
    ARRAY['Chin Tucks', 'chin-tucks', 'Retract chin straight back, creating double chin, to strengthen deep neck flexors', 'neck', '', 'false', 'beginner', '', 'cervical,neck_pain,forward_head_posture'],
    ARRAY['Neck Isometric Holds', 'neck-isometrics', 'Press head against hand resistance in various directions without movement', 'neck', '', 'false', 'beginner', '', 'cervical,neck_pain,neck_stability'],
    ARRAY['Upper Trap Stretch', 'upper-trap-stretch', 'Tilt head to side, gently pulling with hand to stretch upper trapezius', 'traps', 'neck', 'false', 'beginner', 'stretch', 'neck_pain,cervical,tension_headache'],
    ARRAY['Levator Scapulae Stretch', 'levator-scap-stretch', 'Look down and to the side, gently pulling head to stretch levator scapulae', 'levator_scapulae', 'neck', 'false', 'beginner', 'stretch', 'neck_pain,cervical,shoulder_tension'],
    ARRAY['Cervical Rotation Stretch', 'cervical-rotation', 'Gently rotate head side to side to improve neck mobility', 'neck', '', 'false', 'beginner', 'stretch,rotation', 'cervical,neck_mobility'],
    ARRAY['Thoracic Extension on Foam Roller', 'thoracic-extension-foam', 'Lie on foam roller and extend upper back over it', 'thoracic_spine', 'shoulders', 'false', 'beginner', 'stretch', 'thoracic_mobility,posture,cervical'],
    -- LOWER BACK REHAB
    ARRAY['Cat-Cow Stretch', 'cat-cow', 'Alternate between arching and rounding spine on all fours', 'spine', 'core', 'false', 'beginner', 'stretch', 'lower_back,spine_mobility'],
    ARRAY['Bird Dog', 'bird-dog', 'From all fours, extend opposite arm and leg while maintaining stable spine', 'core,lower_back', 'glutes', 'false', 'beginner', '', 'lower_back,core_stability'],
    ARRAY['Dead Bug', 'dead-bug', 'Lying on back, lower opposite arm and leg while maintaining flat back', 'core', 'hip_flexors', 'false', 'beginner', '', 'lower_back,core_stability'],
    ARRAY['Glute Bridge', 'glute-bridge', 'Lying on back, drive hips up by squeezing glutes', 'glutes', 'hamstrings', 'false', 'beginner', '', 'lower_back,glute_activation'],
    ARRAY['Childs Pose', 'childs-pose', 'Kneel and sit back on heels, reaching arms forward', 'lower_back', 'lats,shoulders', 'false', 'beginner', 'stretch', 'lower_back,spine_mobility'],
    ARRAY['Supine Twist', 'supine-twist', 'Lying on back, drop knees to one side for gentle spinal rotation', 'spine,obliques', '', 'false', 'beginner', 'stretch,rotation', 'lower_back,spine_mobility'],
    ARRAY['Pelvic Tilts', 'pelvic-tilts', 'Lying on back, alternate between flattening and arching lower back', 'core,lower_back', '', 'false', 'beginner', '', 'lower_back,pelvic_control'],
    -- KNEE REHAB
    ARRAY['Terminal Knee Extension', 'terminal-knee-extension', 'With band around knee, extend from slight bend to straight', 'quads', '', 'false', 'beginner', '', 'knee_injury,quad_activation'],
    ARRAY['Straight Leg Raise', 'straight-leg-raise', 'Lying on back, raise straight leg to strengthen quads without knee bend', 'quads,hip_flexors', '', 'false', 'beginner', '', 'knee_injury,post_surgery'],
    ARRAY['Clamshells', 'clamshells', 'Lying on side, open knees like a clamshell to strengthen hip abductors', 'glute_medius', 'hip_abductors', 'false', 'beginner', '', 'knee_injury,hip_stability,it_band'],
    ARRAY['Wall Sit', 'wall-sit', 'Sit against wall with knees at 90 degrees, hold position', 'quads', 'glutes', 'false', 'beginner', '', 'knee_injury,quad_strength'],
    ARRAY['Step Downs', 'step-downs', 'Stand on step, slowly lower one foot to ground and return', 'quads,glutes', '', 'false', 'beginner', 'controlled', 'knee_injury,eccentric_control'],
    -- HIP MOBILITY
    ARRAY['90/90 Hip Stretch', 'ninety-ninety-stretch', 'Sit with both legs at 90 degrees, rotate between internal and external', 'hip_rotators', 'glutes', 'false', 'beginner', 'stretch', 'hip_mobility,piriformis'],
    ARRAY['Pigeon Pose', 'pigeon-pose', 'One leg forward bent, back leg extended, fold forward over front leg', 'glutes,hip_rotators', 'hip_flexors', 'false', 'beginner', 'stretch', 'hip_mobility,piriformis,sciatica'],
    ARRAY['Hip Flexor Stretch Kneeling', 'kneeling-hip-flexor-stretch', 'Kneel on one knee, push hips forward to stretch hip flexor', 'hip_flexors', 'quads', 'false', 'beginner', 'stretch', 'hip_mobility,lower_back,anterior_pelvic_tilt'],
    ARRAY['Frog Stretch', 'frog-stretch', 'On all fours, widen knees and sit back to stretch inner thighs', 'adductors', 'hip_flexors', 'false', 'beginner', 'stretch', 'hip_mobility,groin'],
    ARRAY['Worlds Greatest Stretch', 'worlds-greatest-stretch', 'Lunge with rotation, opening chest to sky', 'hip_flexors,thoracic_spine', 'adductors,hamstrings', 'true', 'beginner', 'stretch,rotation', 'hip_mobility,thoracic_mobility,warmup'],
    -- GENERAL MOBILITY/STRETCHING
    ARRAY['Thread the Needle', 'thread-the-needle', 'On all fours, thread arm under body and rotate thoracic spine', 'thoracic_spine', 'shoulders', 'false', 'beginner', 'stretch,rotation', 'thoracic_mobility,shoulder_mobility'],
    ARRAY['Foam Roll Thoracic Spine', 'foam-roll-thoracic', 'Roll upper back on foam roller to release tension', 'thoracic_spine', '', 'false', 'beginner', 'myofascial', 'thoracic_mobility,posture'],
    ARRAY['Foam Roll IT Band', 'foam-roll-it-band', 'Roll outer thigh on foam roller', 'it_band', '', 'false', 'beginner', 'myofascial', 'it_band,knee_injury'],
    ARRAY['Foam Roll Lats', 'foam-roll-lats', 'Roll side of back on foam roller', 'lats', '', 'false', 'beginner', 'myofascial', 'shoulder_mobility,overhead_mobility'],
    ARRAY['Doorway Chest Stretch', 'doorway-chest-stretch', 'Place forearm on doorframe and lean through to stretch chest', 'chest', 'front_delts', 'false', 'beginner', 'stretch', 'posture,shoulder_mobility,chest_tightness'],
    ARRAY['Couch Stretch', 'couch-stretch', 'Kneel with back foot on couch/wall to deeply stretch hip flexor and quad', 'hip_flexors,quads', '', 'false', 'intermediate', 'stretch', 'hip_mobility,anterior_pelvic_tilt'],
    ARRAY['Bretzel Stretch', 'bretzel-stretch', 'Lying twist combining hip flexor, quad, and thoracic rotation', 'hip_flexors,quads,thoracic_spine', '', 'true', 'intermediate', 'stretch,rotation', 'hip_mobility,thoracic_mobility']
  ];
  ex TEXT[];
BEGIN
  FOREACH ex SLICE 1 IN ARRAY rehab_exercises
  LOOP
    BEGIN
      INSERT INTO exercises (name, slug, description, primary_muscles, secondary_muscles, is_compound, difficulty, movement_patterns, rehab_for)
      VALUES (
        ex[1],
        ex[2],
        ex[3],
        CASE WHEN ex[4] = '' THEN ARRAY[]::TEXT[] ELSE string_to_array(ex[4], ',') END,
        CASE WHEN ex[5] = '' THEN ARRAY[]::TEXT[] ELSE string_to_array(ex[5], ',') END,
        ex[6]::boolean,
        ex[7],
        CASE WHEN ex[8] = '' THEN ARRAY[]::TEXT[] ELSE string_to_array(ex[8], ',') END,
        CASE WHEN ex[9] = '' THEN ARRAY[]::TEXT[] ELSE string_to_array(ex[9], ',') END
      );
    EXCEPTION WHEN unique_violation THEN
      -- Update existing exercise by name or slug
      UPDATE exercises SET
        movement_patterns = CASE WHEN ex[8] = '' THEN movement_patterns ELSE string_to_array(ex[8], ',') END,
        rehab_for = CASE WHEN ex[9] = '' THEN rehab_for ELSE string_to_array(ex[9], ',') END
      WHERE name = ex[1] OR slug = ex[2];
    END;
  END LOOP;
END $$;

-- =============================================================================
-- 5. CREATE INDEX FOR EFFICIENT FILTERING
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_exercises_movement_patterns ON exercises USING GIN (movement_patterns);
CREATE INDEX IF NOT EXISTS idx_exercises_contraindications ON exercises USING GIN (contraindications);
CREATE INDEX IF NOT EXISTS idx_exercises_rehab_for ON exercises USING GIN (rehab_for);

-- =============================================================================
-- 6. UPDATE INJURIES TABLE TO USE PATTERN-BASED APPROACH
-- =============================================================================

-- Add column for contraindication patterns (instead of just movement names)
ALTER TABLE injuries ADD COLUMN IF NOT EXISTS contraindication_patterns TEXT[] DEFAULT '{}';

COMMENT ON COLUMN injuries.contraindication_patterns IS 'Movement patterns to avoid: overhead, impact, spinal_loading, deep_knee_flexion, rotation, hip_hinge';
