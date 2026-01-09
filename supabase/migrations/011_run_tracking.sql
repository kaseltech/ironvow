-- Migration: Add run tracking tables
-- Stores GPS-tracked run sessions with route data

-- Run sessions table
CREATE TABLE IF NOT EXISTS run_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT, -- Optional name for the run
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Total elapsed time
  distance_meters REAL, -- Total distance in meters
  average_pace_seconds_per_km REAL, -- Average pace
  fastest_pace_seconds_per_km REAL, -- Best split pace
  calories_burned INTEGER,
  elevation_gain_meters REAL,
  weather_conditions TEXT, -- Optional weather note
  notes TEXT,
  route_data JSONB, -- Array of {lat, lng, timestamp, altitude, speed}
  splits JSONB, -- Array of {km, time_seconds, pace_seconds_per_km}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE run_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own runs
CREATE POLICY "Users can manage own run sessions"
  ON run_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_sessions_user_date ON run_sessions(user_id, started_at DESC);

-- Run goals table (optional targets)
CREATE TABLE IF NOT EXISTS run_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('distance', 'time', 'pace', 'frequency')),
  target_value REAL NOT NULL, -- Distance in km, time in minutes, pace in sec/km, or runs per week
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE run_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own run goals"
  ON run_goals FOR ALL
  USING (auth.uid() = user_id);
