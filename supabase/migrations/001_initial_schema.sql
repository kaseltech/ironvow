-- IronVow Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Extended user profile (supplements Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  height_inches NUMERIC(4,1), -- Store in inches, convert for display
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_units TEXT DEFAULT 'imperial' CHECK (preferred_units IN ('imperial', 'metric')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight goal tracking
CREATE TABLE weight_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT CHECK (goal_type IN ('cut', 'bulk', 'maintain', 'recomp')),
  start_weight NUMERIC(5,1), -- in lbs
  target_weight NUMERIC(5,1),
  started_at DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Body weight log
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC(5,1) NOT NULL, -- in lbs
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_at) -- One entry per day
);

-- ============================================================================
-- INJURIES & LIMITATIONS
-- ============================================================================

CREATE TABLE injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL, -- e.g., 'left_shoulder', 'lower_back'
  description TEXT,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'severe')),
  movements_to_avoid TEXT[], -- e.g., ['overhead_press', 'behind_neck']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EQUIPMENT
-- ============================================================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- 'free_weights', 'machines', 'cardio', 'accessories'
  icon_name TEXT -- for UI display
);

-- User's available equipment
CREATE TABLE user_equipment (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  location TEXT DEFAULT 'home' CHECK (location IN ('home', 'gym')),
  notes TEXT,
  PRIMARY KEY (user_id, equipment_id, location)
);

-- ============================================================================
-- EXERCISE LIBRARY
-- ============================================================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- url-friendly name
  description TEXT,
  instructions TEXT[],
  primary_muscles TEXT[] NOT NULL, -- e.g., ['chest', 'triceps']
  secondary_muscles TEXT[],
  equipment_required UUID[], -- references equipment.id
  movement_pattern TEXT, -- 'push', 'pull', 'hinge', 'squat', 'carry', 'isolation'
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_compound BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise alternatives/substitutions
CREATE TABLE exercise_substitutions (
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  substitute_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  reason TEXT, -- e.g., 'no_equipment', 'shoulder_friendly', 'home_alternative'
  PRIMARY KEY (exercise_id, substitute_id)
);

-- ============================================================================
-- WORKOUTS (Templates)
-- ============================================================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workout_type TEXT, -- 'push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio'
  target_muscles TEXT[],
  estimated_duration INTEGER, -- minutes
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE, -- user bookmarked this
  ai_prompt_context JSONB, -- store the context used to generate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within a workout template
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  target_sets INTEGER DEFAULT 3,
  target_reps INTEGER DEFAULT 10,
  target_weight NUMERIC(5,1), -- suggested weight in lbs
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT, -- AI coaching notes
  is_superset_with UUID REFERENCES workout_exercises(id), -- link supersets
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKOUT SESSIONS (Logged completions)
-- ============================================================================

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL, -- can be null for ad-hoc
  name TEXT NOT NULL, -- copy of workout name or custom
  location TEXT CHECK (location IN ('home', 'gym', 'travel', 'outdoor')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- user satisfaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual sets logged during a session
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'dropset', 'failure')),
  weight NUMERIC(5,1), -- actual weight used (lbs)
  reps INTEGER, -- actual reps performed
  target_weight NUMERIC(5,1), -- what was prescribed
  target_reps INTEGER,
  rpe NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10), -- rate of perceived exertion
  rest_seconds INTEGER, -- actual rest taken
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERSONAL RECORDS
-- ============================================================================

CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  record_type TEXT CHECK (record_type IN ('1rm', '3rm', '5rm', '10rm', 'max_reps', 'max_weight')),
  weight NUMERIC(5,1),
  reps INTEGER,
  estimated_1rm NUMERIC(5,1), -- calculated
  achieved_at DATE DEFAULT CURRENT_DATE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, record_type) -- one record per type per exercise
);

-- ============================================================================
-- MUSCLE STRENGTH TRACKING (for body map)
-- ============================================================================

CREATE TABLE muscle_strength (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL, -- 'chest', 'back', 'shoulders', etc.
  strength_score INTEGER CHECK (strength_score >= 1 AND strength_score <= 100),
  trend TEXT CHECK (trend IN ('improving', 'maintaining', 'declining')),
  last_trained DATE,
  total_volume_30d NUMERIC(10,1), -- weight * reps sum for last 30 days
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muscle_group)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_strength ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own weight goals" ON weight_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weight logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own injuries" ON injuries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own equipment" ON user_equipment FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workout exercises" ON workout_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can manage own sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own set logs" ON set_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_sessions WHERE workout_sessions.id = session_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "Users can manage own PRs" ON personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own muscle strength" ON muscle_strength FOR ALL USING (auth.uid() = user_id);

-- Equipment and exercises are public (read-only for users)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment is public" ON equipment FOR SELECT USING (true);
CREATE POLICY "Exercises are public" ON exercises FOR SELECT USING (true);
CREATE POLICY "Substitutions are public" ON exercise_substitutions FOR SELECT USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, logged_at DESC);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_set_logs_session ON set_logs(session_id);
CREATE INDEX idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_exercises_muscles ON exercises USING GIN(primary_muscles);
CREATE INDEX idx_workouts_user_saved ON workouts(user_id, is_saved) WHERE is_saved = true;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER injuries_updated_at BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate estimated 1RM using Epley formula
CREATE OR REPLACE FUNCTION calculate_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF reps = 1 THEN
    RETURN weight;
  END IF;
  RETURN ROUND(weight * (1 + reps / 30.0), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail auth
  RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
