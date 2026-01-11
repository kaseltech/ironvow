-- Add image URLs to exercises table for visual demonstrations
-- Images sourced from free-exercise-db (public domain)

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category TEXT; -- strength, stretching, cardio, plyometrics

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);

COMMENT ON COLUMN exercises.image_urls IS 'Array of image URLs for exercise demonstrations';
COMMENT ON COLUMN exercises.category IS 'Exercise category: strength, stretching, cardio, plyometrics, etc.';
