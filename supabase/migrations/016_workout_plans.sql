-- Migration: 016_workout_plans.sql
-- Purpose: Create tables for weekly workout plans

-- Workout plans (the weekly plan container)
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE, -- Optional: when to start the plan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Individual days within a plan
CREATE TABLE workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 1=Mon...6=Sat
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  muscle_focus TEXT[], -- User-specified muscle targets for this day
  workout_style TEXT, -- Style override for this day
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, day_of_week)
);

-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_days ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plans
CREATE POLICY "Users can view own plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_plan_days
CREATE POLICY "Users can view own plan days"
  ON workout_plan_days FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = plan_id
    AND workout_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own plan days"
  ON workout_plan_days FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = plan_id
    AND workout_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own plan days"
  ON workout_plan_days FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = plan_id
    AND workout_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own plan days"
  ON workout_plan_days FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = plan_id
    AND workout_plans.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_workout_plans_user ON workout_plans(user_id, is_active);
CREATE INDEX idx_workout_plans_active ON workout_plans(user_id) WHERE is_active = true;
CREATE INDEX idx_workout_plan_days_plan ON workout_plan_days(plan_id);
CREATE INDEX idx_workout_plan_days_day ON workout_plan_days(plan_id, day_of_week);

-- Trigger to update updated_at on workout_plans
CREATE OR REPLACE FUNCTION update_workout_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_plan_timestamp();

-- View to get plan with days and workouts
CREATE OR REPLACE VIEW user_workout_plans AS
SELECT
  wp.id as plan_id,
  wp.user_id,
  wp.name as plan_name,
  wp.description,
  wp.start_date,
  wp.is_active,
  wp.created_at,
  wp.updated_at,
  wpd.id as day_id,
  wpd.day_of_week,
  wpd.muscle_focus,
  wpd.workout_style as day_workout_style,
  w.id as workout_id,
  w.name as workout_name,
  w.workout_type,
  w.target_muscles,
  w.estimated_duration
FROM workout_plans wp
LEFT JOIN workout_plan_days wpd ON wpd.plan_id = wp.id
LEFT JOIN workouts w ON w.id = wpd.workout_id
ORDER BY wp.created_at DESC, wpd.day_of_week;

GRANT SELECT ON user_workout_plans TO authenticated;
