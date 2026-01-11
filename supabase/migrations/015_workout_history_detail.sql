-- Migration: 015_workout_history_detail.sql
-- Purpose: Create view for fetching detailed workout session data with exercises and sets

-- View for fetching session details with exercises and sets (for expandable history cards)
CREATE OR REPLACE VIEW user_session_detail AS
SELECT
  ws.id as session_id,
  ws.user_id,
  ws.workout_id,
  ws.name as session_name,
  ws.location,
  ws.started_at,
  ws.completed_at,
  ws.duration_seconds,
  ws.notes as session_notes,
  ws.rating,
  sl.id as set_log_id,
  sl.exercise_id,
  e.name as exercise_name,
  e.slug as exercise_slug,
  e.primary_muscles,
  e.secondary_muscles,
  sl.set_number,
  sl.set_type,
  sl.weight,
  sl.reps,
  sl.target_weight,
  sl.target_reps,
  sl.rpe,
  sl.rest_seconds,
  sl.notes as set_notes,
  sl.logged_at,
  COALESCE((sl.weight * sl.reps)::integer, 0) as set_volume
FROM workout_sessions ws
LEFT JOIN set_logs sl ON sl.session_id = ws.id
LEFT JOIN exercises e ON sl.exercise_id = e.id
WHERE ws.completed_at IS NOT NULL
ORDER BY ws.started_at DESC, e.name, sl.set_number;

-- Grant access (RLS is handled by the underlying tables)
GRANT SELECT ON user_session_detail TO authenticated;

-- Add index for faster lookups by session_id
CREATE INDEX IF NOT EXISTS idx_set_logs_session_exercise ON set_logs(session_id, exercise_id, set_number);
