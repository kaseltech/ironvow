#!/usr/bin/env node

/**
 * Import exercises from free-exercise-db
 * Source: https://github.com/yuhonas/free-exercise-db (Public Domain)
 *
 * Usage: node scripts/import-exercises.js
 *
 * This generates SQL that can be run against Supabase
 */

const https = require('https');
const fs = require('fs');

const EXERCISE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// Map equipment names to our equipment table names
const equipmentMap = {
  'body only': null,
  'barbell': 'barbell',
  'dumbbell': 'dumbbells',
  'cable': 'cable machine',
  'machine': 'machine',
  'kettlebells': 'kettlebells',
  'bands': 'resistance bands',
  'medicine ball': 'medicine ball',
  'exercise ball': 'stability ball',
  'foam roll': 'foam roller',
  'e-z curl bar': 'ez curl bar',
  'other': null,
  'null': null,
};

// Map difficulty levels
const difficultyMap = {
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'expert': 'advanced',
};

// Map force to movement pattern
const forceToPattern = {
  'push': 'push',
  'pull': 'pull',
  'static': 'isolation',
  null: null,
};

// Normalize muscle names to match our schema
const muscleMap = {
  'abdominals': 'core',
  'abductors': 'abductors',
  'adductors': 'adductors',
  'biceps': 'biceps',
  'calves': 'calves',
  'chest': 'chest',
  'forearms': 'forearms',
  'glutes': 'glutes',
  'hamstrings': 'hamstrings',
  'lats': 'lats',
  'lower back': 'lower back',
  'middle back': 'upper back',
  'neck': 'traps',
  'quadriceps': 'quads',
  'shoulders': 'shoulders',
  'traps': 'traps',
  'triceps': 'triceps',
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function arrayToSQL(arr) {
  if (!arr || arr.length === 0) return 'NULL';
  const escaped = arr.map(s => s.replace(/'/g, "''")).join("','");
  return `ARRAY['${escaped}']`;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching exercises from free-exercise-db...');
  const exercises = await fetchJSON(EXERCISE_DB_URL);
  console.log(`Found ${exercises.length} exercises`);

  let sql = `-- Auto-generated exercise import from free-exercise-db
-- Source: https://github.com/yuhonas/free-exercise-db (Public Domain)
-- Generated: ${new Date().toISOString()}

-- Run migration 017_exercise_images.sql first!

`;

  let importCount = 0;
  let skipCount = 0;

  for (const ex of exercises) {
    const slug = slugify(ex.name);
    const name = ex.name;

    // Map muscles
    const primaryMuscles = (ex.primaryMuscles || [])
      .map(m => muscleMap[m.toLowerCase()] || m.toLowerCase())
      .filter(Boolean);

    const secondaryMuscles = (ex.secondaryMuscles || [])
      .map(m => muscleMap[m.toLowerCase()] || m.toLowerCase())
      .filter(Boolean);

    // Build image URLs
    const imageUrls = (ex.images || []).map(img => `${IMAGE_BASE_URL}/${img}`);

    // Map other fields
    const difficulty = difficultyMap[ex.level] || 'intermediate';
    const movementPattern = forceToPattern[ex.force] || null;
    const isCompound = ex.mechanic === 'compound';
    const category = ex.category || null;
    const instructions = ex.instructions || [];

    if (primaryMuscles.length === 0) {
      skipCount++;
      continue;
    }

    sql += `
INSERT INTO exercises (name, slug, instructions, primary_muscles, secondary_muscles, movement_pattern, difficulty, is_compound, image_urls, category)
VALUES (
  ${escapeSQL(name)},
  ${escapeSQL(slug)},
  ${arrayToSQL(instructions)},
  ${arrayToSQL(primaryMuscles)},
  ${arrayToSQL(secondaryMuscles)},
  ${escapeSQL(movementPattern)},
  ${escapeSQL(difficulty)},
  ${isCompound},
  ${arrayToSQL(imageUrls)},
  ${escapeSQL(category)}
)
ON CONFLICT (slug) DO UPDATE SET
  instructions = EXCLUDED.instructions,
  image_urls = EXCLUDED.image_urls,
  category = EXCLUDED.category;
`;
    importCount++;
  }

  console.log(`Generated SQL for ${importCount} exercises (${skipCount} skipped - no primary muscles)`);

  // Write to file
  const outputPath = 'supabase/migrations/018_import_exercises.sql';
  fs.writeFileSync(outputPath, sql);
  console.log(`Written to ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Review the generated SQL');
  console.log('2. Run: /opt/homebrew/bin/supabase db push');
}

main().catch(console.error);
