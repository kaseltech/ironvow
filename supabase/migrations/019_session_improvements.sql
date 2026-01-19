-- Add workout_data JSONB column to store the full workout configuration
-- This allows session recovery on app refresh/crash
ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS workout_data JSONB;

-- Add bookmarked column to workouts for saving favorite workouts
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;

-- Add deload_suggested column to track when deloads were recommended
ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS deload_suggested BOOLEAN DEFAULT FALSE;

-- Add adherence tracking to workout_plan_days
ALTER TABLE workout_plan_days
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE workout_plan_days
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES workout_sessions(id);

-- Create index for faster active session lookup
CREATE INDEX IF NOT EXISTS idx_workout_sessions_active
ON workout_sessions(user_id, completed_at)
WHERE completed_at IS NULL;

-- Create index for bookmarked workouts
CREATE INDEX IF NOT EXISTS idx_workouts_bookmarked
ON workouts(user_id, is_bookmarked)
WHERE is_bookmarked = TRUE;

-- Update user_workout_plans view to include adherence tracking fields
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
  wpd.completed_at as day_completed_at,
  wpd.session_id as day_session_id,
  w.id as workout_id,
  w.name as workout_name,
  w.workout_type,
  w.target_muscles,
  w.estimated_duration
FROM workout_plans wp
LEFT JOIN workout_plan_days wpd ON wpd.plan_id = wp.id
LEFT JOIN workouts w ON w.id = wpd.workout_id
ORDER BY wp.created_at DESC, wpd.day_of_week;
