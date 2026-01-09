/**
 * Strength Standards by Experience Level
 *
 * Standards are expressed as multipliers of body weight.
 * Based on training age:
 * - Beginner: <1 year of consistent training
 * - Intermediate: 1-3 years
 * - Advanced: 3+ years
 */

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Strength standards as body weight multipliers
// Format: { male: { beginner, intermediate, advanced }, female: { ... } }
export const STRENGTH_STANDARDS: Record<string, {
  male: Record<ExperienceLevel, number>;
  female: Record<ExperienceLevel, number>;
  slug: string;
  aliases: string[];
}> = {
  // Big 4 compound lifts
  'Squat': {
    slug: 'barbell-back-squat',
    aliases: ['squat', 'back squat', 'barbell squat'],
    male: { beginner: 0.75, intermediate: 1.25, advanced: 1.75 },
    female: { beginner: 0.5, intermediate: 0.85, advanced: 1.25 },
  },
  'Bench Press': {
    slug: 'barbell-bench-press',
    aliases: ['bench', 'bench press', 'barbell bench'],
    male: { beginner: 0.5, intermediate: 1.0, advanced: 1.5 },
    female: { beginner: 0.25, intermediate: 0.6, advanced: 1.0 },
  },
  'Deadlift': {
    slug: 'barbell-deadlift',
    aliases: ['deadlift', 'conventional deadlift'],
    male: { beginner: 1.0, intermediate: 1.5, advanced: 2.0 },
    female: { beginner: 0.75, intermediate: 1.15, advanced: 1.6 },
  },
  'Overhead Press': {
    slug: 'barbell-overhead-press',
    aliases: ['ohp', 'overhead press', 'military press', 'shoulder press'],
    male: { beginner: 0.35, intermediate: 0.65, advanced: 1.0 },
    female: { beginner: 0.2, intermediate: 0.45, advanced: 0.7 },
  },

  // Secondary compounds
  'Barbell Row': {
    slug: 'barbell-row',
    aliases: ['bent over row', 'pendlay row'],
    male: { beginner: 0.5, intermediate: 0.85, advanced: 1.25 },
    female: { beginner: 0.35, intermediate: 0.6, advanced: 0.9 },
  },
  'Front Squat': {
    slug: 'barbell-front-squat',
    aliases: ['front squat'],
    male: { beginner: 0.6, intermediate: 1.0, advanced: 1.4 },
    female: { beginner: 0.4, intermediate: 0.7, advanced: 1.0 },
  },
  'Romanian Deadlift': {
    slug: 'romanian-deadlift',
    aliases: ['rdl', 'romanian deadlift', 'stiff leg deadlift'],
    male: { beginner: 0.6, intermediate: 1.0, advanced: 1.4 },
    female: { beginner: 0.5, intermediate: 0.85, advanced: 1.2 },
  },
  'Hip Thrust': {
    slug: 'barbell-hip-thrust',
    aliases: ['hip thrust', 'glute bridge'],
    male: { beginner: 0.75, intermediate: 1.25, advanced: 1.75 },
    female: { beginner: 0.75, intermediate: 1.5, advanced: 2.0 },
  },
};

// Major lifts to feature on Progress page (in order)
export const MAJOR_LIFTS = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

// Map experience level enum to label
export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/**
 * Calculate the expected 1RM for a lift based on body weight and experience
 */
export function getExpected1RM(
  liftName: string,
  bodyWeightLbs: number,
  experienceLevel: ExperienceLevel,
  gender: 'male' | 'female' = 'male'
): number | null {
  const standard = STRENGTH_STANDARDS[liftName];
  if (!standard) return null;

  const multiplier = standard[gender]?.[experienceLevel];
  if (multiplier === undefined) return null;

  return Math.round(bodyWeightLbs * multiplier);
}

/**
 * Calculate a strength score (0-100) based on how close to the expected standard
 * Score interpretation:
 * - 0-40: Below beginner (needs work)
 * - 40-60: Beginner level
 * - 60-80: Intermediate level
 * - 80-100: Advanced level
 * - 100+: Elite
 */
export function calculateStrengthScore(
  actual1RM: number,
  liftName: string,
  bodyWeightLbs: number,
  experienceLevel: ExperienceLevel,
  gender: 'male' | 'female' = 'male'
): number {
  const standard = STRENGTH_STANDARDS[liftName];
  if (!standard || !bodyWeightLbs) return 0;

  const genderStandards = standard[gender];

  // Calculate absolute thresholds
  const beginnerThreshold = bodyWeightLbs * genderStandards.beginner;
  const intermediateThreshold = bodyWeightLbs * genderStandards.intermediate;
  const advancedThreshold = bodyWeightLbs * genderStandards.advanced;

  // Score ranges:
  // 0-40: 0 to beginner
  // 40-60: beginner to expected for your level
  // 60-80: expected to next level
  // 80-100: next level to elite

  // For experience-relative scoring:
  const expected = getExpected1RM(liftName, bodyWeightLbs, experienceLevel, gender) || intermediateThreshold;

  if (actual1RM <= 0) return 0;
  if (actual1RM >= advancedThreshold * 1.2) return 100; // Elite cap

  // Calculate as percentage of expected for their level
  const percentOfExpected = (actual1RM / expected) * 100;

  // Map to 0-100 scale centered around 60 (meeting expectations)
  // 50% of expected = 30, 100% = 60, 150% = 90
  const score = 30 + (percentOfExpected * 0.6);

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Get a descriptive label for a strength score
 */
export function getStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: 'Advanced', color: '#4ADE80' };
  if (score >= 60) return { label: 'Intermediate', color: '#C9A75A' };
  if (score >= 40) return { label: 'Beginner', color: '#FB923C' };
  return { label: 'Developing', color: '#F87171' };
}

/**
 * Find the matching standard for an exercise name
 * Handles variations in naming (e.g., "Barbell Bench Press" matches "Bench Press")
 */
export function findStandardForExercise(exerciseName: string): string | null {
  const normalizedName = exerciseName.toLowerCase();

  for (const [standardName, standard] of Object.entries(STRENGTH_STANDARDS)) {
    // Check direct match
    if (standardName.toLowerCase() === normalizedName) {
      return standardName;
    }

    // Check aliases
    if (standard.aliases.some(alias => normalizedName.includes(alias))) {
      return standardName;
    }

    // Check slug
    if (standard.slug && normalizedName.includes(standard.slug.replace(/-/g, ' '))) {
      return standardName;
    }
  }

  return null;
}

/**
 * Calculate overall strength level across major lifts
 */
export function calculateOverallStrengthLevel(
  prs: { exercise_name: string; estimated_1rm: number }[],
  bodyWeightLbs: number,
  experienceLevel: ExperienceLevel,
  gender: 'male' | 'female' = 'male'
): {
  overallScore: number;
  level: string;
  liftScores: { lift: string; score: number; expected: number; actual: number }[];
} {
  const liftScores: { lift: string; score: number; expected: number; actual: number }[] = [];

  for (const majorLift of MAJOR_LIFTS) {
    const pr = prs.find(p => {
      const standard = findStandardForExercise(p.exercise_name);
      return standard === majorLift;
    });

    const expected = getExpected1RM(majorLift, bodyWeightLbs, experienceLevel, gender) || 0;
    const actual = pr?.estimated_1rm || 0;
    const score = pr
      ? calculateStrengthScore(pr.estimated_1rm, majorLift, bodyWeightLbs, experienceLevel, gender)
      : 0;

    liftScores.push({ lift: majorLift, score, expected, actual });
  }

  // Average of scored lifts (only those with data)
  const scoredLifts = liftScores.filter(l => l.actual > 0);
  const overallScore = scoredLifts.length > 0
    ? Math.round(scoredLifts.reduce((sum, l) => sum + l.score, 0) / scoredLifts.length)
    : 0;

  const { label: level } = getStrengthLabel(overallScore);

  return { overallScore, level, liftScores };
}
