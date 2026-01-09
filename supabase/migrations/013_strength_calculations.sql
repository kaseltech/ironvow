-- Migration: 013_strength_calculations.sql
-- Purpose: Create views for calculating 1RM, muscle volume, and personal records from set_logs
-- These views power the Progress, Library, and Profile pages

-- =============================================================================
-- VIEW: user_exercise_1rm
-- Calculates estimated 1RM for each exercise the user has performed
-- Uses Epley formula: 1RM = weight × (1 + reps/30)
-- =============================================================================
CREATE OR REPLACE VIEW user_exercise_1rm AS
SELECT DISTINCT ON (ws.user_id, sl.exercise_id)
  ws.user_id,
  sl.exercise_id,
  e.name as exercise_name,
  e.slug as exercise_slug,
  e.primary_muscles,
  e.is_compound,
  sl.weight,
  sl.reps,
  ROUND(sl.weight * (1 + sl.reps::numeric / 30))::integer as estimated_1rm,
  sl.logged_at
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
JOIN exercises e ON sl.exercise_id = e.id
WHERE sl.weight > 0 AND sl.reps > 0 AND sl.exercise_id IS NOT NULL
ORDER BY ws.user_id, sl.exercise_id, (sl.weight * (1 + sl.reps::numeric / 30)) DESC;

-- =============================================================================
-- VIEW: user_muscle_volume
-- Calculates total volume (weight × reps) per muscle group in the last 30 days
-- Also tracks when each muscle was last trained and how many training days
-- =============================================================================
CREATE OR REPLACE VIEW user_muscle_volume AS
SELECT
  ws.user_id,
  muscle,
  SUM(sl.weight * sl.reps)::bigint as total_volume,
  MAX(sl.logged_at) as last_trained,
  COUNT(DISTINCT DATE(sl.logged_at))::integer as training_days
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
JOIN exercises e ON sl.exercise_id = e.id
CROSS JOIN LATERAL UNNEST(e.primary_muscles) as muscle
WHERE sl.logged_at > NOW() - INTERVAL '30 days'
  AND sl.weight > 0
  AND sl.exercise_id IS NOT NULL
GROUP BY ws.user_id, muscle;

-- =============================================================================
-- VIEW: user_personal_records
-- Gets the best estimated 1RM ever achieved for each exercise (all-time PRs)
-- =============================================================================
CREATE OR REPLACE VIEW user_personal_records AS
SELECT DISTINCT ON (ws.user_id, sl.exercise_id)
  ws.user_id,
  sl.exercise_id,
  e.name as exercise_name,
  e.slug as exercise_slug,
  e.primary_muscles,
  e.is_compound,
  sl.weight as pr_weight,
  sl.reps as pr_reps,
  ROUND(sl.weight * (1 + sl.reps::numeric / 30))::integer as estimated_1rm,
  sl.logged_at as achieved_at
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
JOIN exercises e ON sl.exercise_id = e.id
WHERE sl.weight > 0 AND sl.exercise_id IS NOT NULL
ORDER BY ws.user_id, sl.exercise_id, (sl.weight * (1 + sl.reps::numeric / 30)) DESC;

-- =============================================================================
-- VIEW: user_exercise_history
-- Gets all logged sets for each exercise, grouped by session
-- Used for detailed exercise history in the Library page
-- =============================================================================
CREATE OR REPLACE VIEW user_exercise_history AS
SELECT
  ws.user_id,
  sl.exercise_id,
  e.name as exercise_name,
  ws.id as session_id,
  DATE(sl.logged_at) as workout_date,
  sl.set_number,
  sl.weight,
  sl.reps,
  sl.set_type,
  ROUND(sl.weight * (1 + sl.reps::numeric / 30))::integer as estimated_1rm,
  (sl.weight * sl.reps)::integer as set_volume,
  sl.logged_at
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
JOIN exercises e ON sl.exercise_id = e.id
WHERE sl.exercise_id IS NOT NULL
ORDER BY sl.logged_at DESC;

-- =============================================================================
-- VIEW: user_session_summary
-- Summarizes each workout session with total volume, duration, exercise count
-- =============================================================================
CREATE OR REPLACE VIEW user_session_summary AS
SELECT
  ws.id as session_id,
  ws.user_id,
  ws.name as session_name,
  ws.location,
  ws.started_at,
  ws.completed_at,
  ws.duration_seconds,
  ws.rating,
  COUNT(DISTINCT sl.exercise_id)::integer as exercise_count,
  SUM(sl.weight * sl.reps)::bigint as total_volume,
  COUNT(sl.id)::integer as total_sets
FROM workout_sessions ws
LEFT JOIN set_logs sl ON sl.session_id = ws.id
WHERE ws.completed_at IS NOT NULL
GROUP BY ws.id
ORDER BY ws.started_at DESC;

-- =============================================================================
-- Enable RLS on views (inherit from base tables)
-- Views automatically inherit RLS from the underlying tables
-- =============================================================================

-- Grant access to authenticated users
GRANT SELECT ON user_exercise_1rm TO authenticated;
GRANT SELECT ON user_muscle_volume TO authenticated;
GRANT SELECT ON user_personal_records TO authenticated;
GRANT SELECT ON user_exercise_history TO authenticated;
GRANT SELECT ON user_session_summary TO authenticated;
