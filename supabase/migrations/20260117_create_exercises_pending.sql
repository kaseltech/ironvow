-- Create exercises_pending table for AI-generated exercises awaiting review
CREATE TABLE IF NOT EXISTS exercises_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  instructions TEXT[],
  primary_muscles TEXT[] DEFAULT '{}',
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment_required TEXT[] DEFAULT '{}',
  movement_pattern TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  is_compound BOOLEAN DEFAULT false,
  video_url TEXT,
  image_urls TEXT[],
  category TEXT,

  -- Metadata for review
  source TEXT DEFAULT 'ai_swap',  -- 'ai_swap', 'ai_generate', etc.
  source_context JSONB,           -- Original request context (muscles, equipment, etc.)
  swapped_for TEXT,               -- Name of exercise this was suggested to replace
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'merged'
  merged_to UUID REFERENCES exercises(id),  -- If merged with existing exercise
  notes TEXT                       -- Reviewer notes
);

-- Index for quick lookups
CREATE INDEX idx_exercises_pending_status ON exercises_pending(status);
CREATE INDEX idx_exercises_pending_name ON exercises_pending(name);
CREATE INDEX idx_exercises_pending_created ON exercises_pending(created_at DESC);

-- RLS policies
ALTER TABLE exercises_pending ENABLE ROW LEVEL SECURITY;

-- Anyone can read pending exercises (for swap suggestions)
CREATE POLICY "Anyone can read pending exercises"
  ON exercises_pending FOR SELECT
  USING (true);

-- Only service role can insert (from edge function)
CREATE POLICY "Service role can insert pending exercises"
  ON exercises_pending FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can update (for review)
CREATE POLICY "Authenticated users can update pending exercises"
  ON exercises_pending FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE exercises_pending IS 'AI-generated exercises awaiting human review before promotion to main exercises table';
