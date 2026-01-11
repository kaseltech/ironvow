-- Timer presets table for saving custom timer configurations
-- Part of the FlexTimer feature

CREATE TABLE IF NOT EXISTS timer_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('stopwatch', 'countdown', 'tabata', 'emom', 'interval')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_timer_presets_user_id ON timer_presets(user_id);

-- Index for finding favorites
CREATE INDEX IF NOT EXISTS idx_timer_presets_favorite ON timer_presets(user_id, is_favorite) WHERE is_favorite = true;

-- Enable RLS
ALTER TABLE timer_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own timer presets"
  ON timer_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timer presets"
  ON timer_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer presets"
  ON timer_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer presets"
  ON timer_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timer_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_timer_presets_updated_at
  BEFORE UPDATE ON timer_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_timer_presets_updated_at();

-- Comment describing the config JSONB structure
COMMENT ON COLUMN timer_presets.config IS 'JSON config object containing:
- workDuration: number (seconds)
- restDuration: number (seconds)
- setRestDuration: number (seconds)
- countdownDuration: number (seconds)
- emomRoundDuration: number (seconds)
- rounds: number
- sets: number
- preludeEnabled: boolean
- soundEnabled: boolean
- hapticEnabled: boolean
- warningAt: number (seconds before end)';
