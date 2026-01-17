import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// FUZZY MATCHING UTILITIES FOR HYBRID AI
// =============================================================================

// Normalize exercise name for matching
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/[-_]/g, ' ')          // Replace hyphens/underscores with spaces
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\(.*?\)/g, '')        // Remove parenthetical notes
    .replace(/\b(the|a|an)\b/g, '') // Remove articles
    .replace(/\bdb\b/g, 'dumbbell') // Common abbreviations
    .replace(/\bbb\b/g, 'barbell')
    .replace(/\bkb\b/g, 'kettlebell')
    .replace(/\bohp\b/g, 'overhead press')
    .replace(/\brdl\b/g, 'romanian deadlift')
    .trim();
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeExerciseName(str1);
  const s2 = normalizeExerciseName(str2);

  // Exact match
  if (s1 === s2) return 1.0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length * 0.9; // Partial match bonus
  }

  // Word-based matching
  const words1 = new Set(s1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let matchingWords = 0;
  for (const word of words1) {
    if (words2.has(word)) matchingWords++;
    // Also check for partial word matches
    else {
      for (const w2 of words2) {
        if (word.includes(w2) || w2.includes(word)) {
          matchingWords += 0.5;
          break;
        }
      }
    }
  }

  const totalWords = Math.max(words1.size, words2.size);
  return matchingWords / totalWords * 0.85;
}

// Find best matching exercise from database
interface ExerciseMatch {
  exercise: any;
  score: number;
}

function findBestMatch(aiExerciseName: string, dbExercises: any[]): ExerciseMatch | null {
  const MATCH_THRESHOLD = 0.5; // Minimum score to consider a match

  let bestMatch: ExerciseMatch | null = null;

  for (const ex of dbExercises) {
    // Check against name and slug
    const nameScore = calculateSimilarity(aiExerciseName, ex.name);
    const slugScore = ex.slug ? calculateSimilarity(aiExerciseName, ex.slug.replace(/-/g, ' ')) : 0;
    const score = Math.max(nameScore, slugScore);

    if (score >= MATCH_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { exercise: ex, score };
    }
  }

  return bestMatch;
}

// Known bodyweight exercises (no equipment needed) - for outdoor filtering
const bodyweightExercises = new Set([
  'push-ups', 'pull-ups', 'chin-ups', 'dips-chest', 'dips-triceps',
  'lunges', 'bulgarian-split-squat', 'calf-raises', 'glute-bridge',
  'plank', 'crunches', 'russian-twist', 'hanging-leg-raise',
  'burpees', 'mountain-climbers', 'jumping-jacks', 'high-knees',
  'jump-squat', 'box-jumps', 'step-ups', 'walking-lunges',
  'pike-push-ups', 'diamond-push-ups', 'decline-push-ups', 'wide-push-ups',
  'bodyweight-squat', 'pistol-squat', 'sissy-squat',
  'inverted-row', 'australian-pull-ups', 'leg-raises',
  'flutter-kicks', 'bicycle-crunches', 'dead-bug', 'bird-dog',
  'superman', 'reverse-lunge', 'side-lunge', 'skater-jumps',
  'wall-sit', 'single-leg-glute-bridge', 'donkey-kicks', 'fire-hydrants',
  'side-plank',
]);

// Helper to check if exercise is bodyweight-compatible
function isBodyweightExercise(ex: any): boolean {
  const name = ex.name.toLowerCase();
  const slug = (ex.slug || '').toLowerCase();

  // Check explicit bodyweight set
  if (bodyweightExercises.has(slug)) return true;

  // Check name patterns that indicate bodyweight
  const bodyweightPatterns = [
    'bodyweight', 'push-up', 'push up', 'pushup',
    'pull-up', 'pull up', 'pullup', 'chin-up', 'chin up',
    'lunge', 'squat', 'plank', 'crunch', 'sit-up', 'sit up',
    'dip', 'burpee', 'mountain climber', 'jumping jack',
    'leg raise', 'flutter kick', 'bicycle', 'dead bug', 'bird dog',
    'glute bridge', 'hip bridge', 'superman', 'calf raise',
    'step-up', 'step up', 'box jump', 'jump squat',
    'stretch', 'hold', // for mobility/stretches
  ];

  if (bodyweightPatterns.some(p => name.includes(p))) return true;

  // Check equipment_required - if empty or only bodyweight/none, it's bodyweight
  const equipReq = ex.equipment_required || [];
  if (equipReq.length === 0) return true;
  if (equipReq.every((eq: string) => eq === 'none' || eq === 'bodyweight' || eq === 'body only')) return true;

  // Legacy checks
  return name.includes('bodyweight') ||
    name.includes('push-up') ||
    name.includes('pull-up') ||
    name.includes('lunge') ||
    ex.name.toLowerCase().includes('plank') ||
    ex.name.toLowerCase().includes('crunch') ||
    ex.name.toLowerCase().includes('squat') && !ex.name.toLowerCase().includes('barbell') && !ex.name.toLowerCase().includes('goblet');
}

// Workout style determines programming approach
type WorkoutStyle = 'traditional' | 'strength' | 'hiit' | 'circuit' | 'wod' | 'cardio' | 'yoga' | 'mobility' | 'rehab';

// Fitness goal affects programming (from user profile)
type FitnessGoal = 'cut' | 'bulk' | 'maintain' | 'endurance' | 'general';

// =============================================================================
// RX WEIGHT SUGGESTION SYSTEM
// =============================================================================

// User context for weight calculations
interface UserWeightContext {
  gender: 'male' | 'female' | 'other' | null;
  bodyWeightLbs: number | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

// RX weights by exercise category - values in lbs for intermediate male
// These get adjusted based on gender and experience level
const RX_WEIGHTS: Record<string, { male: number; female: number; isBodyweightPercent?: boolean }> = {
  // Major barbell compounds - body weight percentages
  'barbell-squat': { male: 0.75, female: 0.5, isBodyweightPercent: true },
  'barbell-back-squat': { male: 0.75, female: 0.5, isBodyweightPercent: true },
  'barbell-front-squat': { male: 0.6, female: 0.4, isBodyweightPercent: true },
  'barbell-deadlift': { male: 0.85, female: 0.55, isBodyweightPercent: true },
  'conventional-deadlift': { male: 0.85, female: 0.55, isBodyweightPercent: true },
  'sumo-deadlift': { male: 0.85, female: 0.55, isBodyweightPercent: true },
  'barbell-bench-press': { male: 0.65, female: 0.35, isBodyweightPercent: true },
  'barbell-overhead-press': { male: 0.45, female: 0.25, isBodyweightPercent: true },
  'barbell-row': { male: 0.55, female: 0.35, isBodyweightPercent: true },
  'bent-over-row': { male: 0.55, female: 0.35, isBodyweightPercent: true },
  'pendlay-row': { male: 0.55, female: 0.35, isBodyweightPercent: true },

  // Barbell compounds - fixed weights
  'barbell-curl': { male: 65, female: 35 },
  'barbell-shrug': { male: 135, female: 75 },
  'romanian-deadlift': { male: 135, female: 75 },
  'barbell-hip-thrust': { male: 135, female: 95 },
  'barbell-lunge': { male: 95, female: 55 },

  // Dumbbell exercises - per dumbbell
  'dumbbell-bench-press': { male: 50, female: 25 },
  'dumbbell-shoulder-press': { male: 40, female: 20 },
  'dumbbell-row': { male: 50, female: 25 },
  'dumbbell-curl': { male: 25, female: 12 },
  'hammer-curl': { male: 25, female: 12 },
  'dumbbell-lateral-raise': { male: 15, female: 8 },
  'dumbbell-front-raise': { male: 15, female: 8 },
  'dumbbell-fly': { male: 30, female: 15 },
  'dumbbell-tricep-extension': { male: 25, female: 12 },
  'dumbbell-goblet-squat': { male: 45, female: 25 },
  'dumbbell-lunge': { male: 30, female: 15 },
  'dumbbell-romanian-deadlift': { male: 45, female: 25 },
  'dumbbell-shrug': { male: 60, female: 30 },

  // Kettlebell exercises
  'kettlebell-swing': { male: 53, female: 35 },
  'kettlebell-goblet-squat': { male: 44, female: 26 },
  'kettlebell-clean': { male: 44, female: 26 },
  'kettlebell-snatch': { male: 44, female: 26 },
  'kettlebell-turkish-getup': { male: 35, female: 18 },

  // Cable exercises
  'cable-fly': { male: 30, female: 15 },
  'cable-crossover': { male: 30, female: 15 },
  'tricep-pushdown': { male: 50, female: 25 },
  'cable-curl': { male: 40, female: 20 },
  'face-pull': { male: 40, female: 20 },
  'lat-pulldown': { male: 100, female: 55 },
  'cable-row': { male: 80, female: 45 },
  'seated-cable-row': { male: 80, female: 45 },

  // Machine exercises
  'leg-press': { male: 270, female: 160 },
  'leg-extension': { male: 90, female: 50 },
  'leg-curl': { male: 70, female: 40 },
  'chest-press-machine': { male: 100, female: 50 },
  'shoulder-press-machine': { male: 70, female: 35 },
  'pec-deck': { male: 80, female: 40 },
  'hack-squat': { male: 180, female: 100 },

  // Smith machine
  'smith-machine-squat': { male: 135, female: 75 },
  'smith-machine-bench': { male: 115, female: 55 },

  // EZ bar
  'ez-bar-curl': { male: 55, female: 30 },
  'ez-bar-skull-crusher': { male: 45, female: 25 },
  'ez-bar-preacher-curl': { male: 45, female: 25 },

  // Bodyweight exercises - use 0 to indicate bodyweight
  'pull-up': { male: 0, female: 0 },
  'chin-up': { male: 0, female: 0 },
  'push-up': { male: 0, female: 0 },
  'dip': { male: 0, female: 0 },
  'bodyweight-squat': { male: 0, female: 0 },
  'lunge': { male: 0, female: 0 },
  'plank': { male: 0, female: 0 },
  'burpee': { male: 0, female: 0 },
};

// Experience level multipliers
const EXPERIENCE_MULTIPLIERS = {
  beginner: 0.6,
  intermediate: 1.0,
  advanced: 1.3,
};

// Calculate suggested weight for an exercise
function calculateSuggestedWeight(
  exercise: any,
  userContext: UserWeightContext
): number | null {
  const slug = exercise.slug?.toLowerCase() || '';
  const name = exercise.name?.toLowerCase() || '';

  // Try to find RX weight by slug first, then by partial name match
  let rxWeight = RX_WEIGHTS[slug];

  if (!rxWeight) {
    // Try matching by keywords in name
    for (const [key, value] of Object.entries(RX_WEIGHTS)) {
      const keyWords = key.split('-');
      if (keyWords.every(word => name.includes(word) || slug.includes(word))) {
        rxWeight = value;
        break;
      }
    }
  }

  // If still no match, estimate based on exercise characteristics
  if (!rxWeight) {
    return estimateWeightByCategory(exercise, userContext);
  }

  // Determine base weight
  const isMale = userContext.gender === 'male' || userContext.gender === null;
  let baseWeight: number;

  if (rxWeight.isBodyweightPercent && userContext.bodyWeightLbs) {
    // Calculate as percentage of body weight
    const percent = isMale ? rxWeight.male : rxWeight.female;
    baseWeight = Math.round(userContext.bodyWeightLbs * percent);
  } else {
    // Use fixed weight
    baseWeight = isMale ? rxWeight.male : rxWeight.female;
  }

  // If bodyweight exercise (0), return null to indicate no weight needed
  if (baseWeight === 0) {
    return null;
  }

  // Apply experience multiplier
  const multiplier = EXPERIENCE_MULTIPLIERS[userContext.experienceLevel] || 1.0;
  let suggestedWeight = Math.round(baseWeight * multiplier);

  // Round to nearest 5 lbs for convenience
  suggestedWeight = Math.round(suggestedWeight / 5) * 5;

  // Ensure minimum weight
  return Math.max(suggestedWeight, 5);
}

// Estimate weight based on exercise category when no specific RX exists
function estimateWeightByCategory(
  exercise: any,
  userContext: UserWeightContext
): number | null {
  const name = exercise.name?.toLowerCase() || '';
  const equipment = exercise.equipment_required || [];
  const isCompound = exercise.is_compound;
  const isMale = userContext.gender === 'male' || userContext.gender === null;

  // Bodyweight exercises
  if (equipment.length === 0 || equipment.includes('bodyweight') || equipment.includes('none')) {
    if (name.includes('pull-up') || name.includes('push-up') || name.includes('dip') ||
        name.includes('plank') || name.includes('crunch') || name.includes('squat') ||
        name.includes('lunge') || name.includes('burpee')) {
      return null; // Bodyweight
    }
  }

  // Estimate based on equipment type
  let baseWeight: number;

  if (equipment.includes('barbell')) {
    baseWeight = isCompound ? (isMale ? 95 : 55) : (isMale ? 55 : 35);
  } else if (equipment.includes('dumbbell') || equipment.includes('dumbbells')) {
    baseWeight = isCompound ? (isMale ? 35 : 15) : (isMale ? 20 : 10);
  } else if (equipment.includes('kettlebell')) {
    baseWeight = isMale ? 35 : 18;
  } else if (equipment.includes('cable')) {
    baseWeight = isMale ? 40 : 20;
  } else if (equipment.includes('machine')) {
    baseWeight = isCompound ? (isMale ? 100 : 50) : (isMale ? 60 : 30);
  } else if (equipment.includes('ez-bar') || equipment.includes('ez bar')) {
    baseWeight = isMale ? 45 : 25;
  } else {
    // Default for unknown equipment
    return null;
  }

  // Apply experience multiplier
  const multiplier = EXPERIENCE_MULTIPLIERS[userContext.experienceLevel] || 1.0;
  let suggestedWeight = Math.round(baseWeight * multiplier);

  // Round to nearest 5
  suggestedWeight = Math.round(suggestedWeight / 5) * 5;

  return Math.max(suggestedWeight, 5);
}

// Day configuration for weekly plan
interface WeeklyPlanDay {
  day_of_week: number; // 0=Sun, 1=Mon...6=Sat
  muscle_focus?: string[];
  workout_style?: WorkoutStyle | 'auto';
}

interface WorkoutRequest {
  userId: string;
  location: 'gym' | 'home' | 'outdoor';
  targetMuscles: string[];
  duration: number; // minutes
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutStyle?: WorkoutStyle; // Training approach (5x5, HIIT, circuit, etc.)
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[];
  equipment?: string[];
  customEquipment?: string[];
  gymName?: string;
  excludeExerciseIds?: string[]; // For regenerating - exclude previous exercises
  swapExerciseId?: string; // For swapping - find alternatives for this exercise
  swapTargetMuscles?: string[]; // Muscles the swapped exercise should target
  // NEW: Freeform AI request
  freeformPrompt?: string; // User's custom description of what they want
  // NEW: Weekly plan generation
  weeklyPlan?: {
    planName: string;
    days: WeeklyPlanDay[];
  };
}

interface GeneratedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restSeconds: number;
  notes?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  movementPatterns?: string[];
  rehabFor?: string[];
}

interface GeneratedWorkout {
  name: string;
  description: string;
  duration: number;
  exercises: GeneratedExercise[];
  workoutType: string;
  workoutStyle?: WorkoutStyle;
  targetMuscles: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: WorkoutRequest = await req.json();
    const { userId, location, targetMuscles: rawTargetMuscles, duration, experienceLevel, workoutStyle = 'traditional', injuries, equipment, customEquipment, excludeExerciseIds, swapExerciseId, swapTargetMuscles: rawSwapMuscles, freeformPrompt } = body;

    console.log('=== GENERATE WORKOUT REQUEST ===');
    console.log('Location:', location);
    console.log('Duration:', duration);
    console.log('Freeform mode:', !!freeformPrompt);
    console.log('Freeform prompt:', freeformPrompt?.substring(0, 100));
    console.log('Target muscles:', rawTargetMuscles);
    console.log('Equipment count:', equipment?.length || 0);

    const startTime = Date.now();

    // Fetch user profile to get fitness_goal, gender, and body weight
    let fitnessGoal: FitnessGoal = 'general';
    let userWeightContext: UserWeightContext = {
      gender: null,
      bodyWeightLbs: null,
      experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
    };

    if (userId) {
      // Fetch profile for gender and fitness goal
      const { data: profile } = await supabase
        .from('profiles')
        .select('fitness_goal, gender')
        .eq('user_id', userId)
        .single();

      if (profile?.fitness_goal) {
        fitnessGoal = profile.fitness_goal as FitnessGoal;
      }
      if (profile?.gender) {
        userWeightContext.gender = profile.gender as 'male' | 'female' | 'other';
      }

      // Fetch most recent body weight from weight_logs
      const { data: weightLog } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single();

      if (weightLog?.weight) {
        userWeightContext.bodyWeightLbs = weightLog.weight;
      }
    }

    console.log('User weight context:', {
      gender: userWeightContext.gender,
      bodyWeight: userWeightContext.bodyWeightLbs,
      experience: userWeightContext.experienceLevel,
    });

    // Map broad muscle groups to specific muscles in database
    const muscleMapping: Record<string, string[]> = {
      'chest': ['chest', 'upper_chest', 'lower_chest'],
      'back': ['back', 'lats', 'upper_back', 'lower_back', 'rhomboids', 'traps'],
      'shoulders': ['shoulders', 'front_delts', 'lateral_delts', 'rear_delts', 'delts'],
      'arms': ['biceps', 'triceps', 'forearms', 'brachialis'],
      'legs': ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'adductors'],
      'core': ['core', 'abs', 'obliques', 'lower_back', 'transverse_abdominis'],
      // Non-muscle goals - these map to full body for filtering purposes
      'flexibility': ['flexibility', 'hips', 'hamstrings', 'back', 'shoulders'],
      'balance': ['balance', 'core', 'legs', 'glutes'],
      'endurance': ['endurance', 'cardio', 'fullbody'],
    };

    // Expand muscle groups to specific muscles
    const expandMuscles = (muscles: string[]): string[] => {
      const expanded = new Set<string>();
      for (const muscle of muscles) {
        if (muscleMapping[muscle]) {
          muscleMapping[muscle].forEach(m => expanded.add(m));
        } else {
          expanded.add(muscle); // Keep as-is if not in mapping
        }
      }
      return Array.from(expanded);
    };

    const targetMuscles = expandMuscles(rawTargetMuscles || []);
    const swapTargetMuscles = rawSwapMuscles ? expandMuscles(rawSwapMuscles) : undefined;

    console.log(`Expanded muscles: ${rawTargetMuscles?.join(',')} -> ${targetMuscles.join(',')}`);

    // Combine standard and custom equipment
    const allEquipment = [...(equipment || []), ...(customEquipment || [])];

    // Handle swap request - return alternatives for a specific exercise
    if (swapExerciseId && swapTargetMuscles) {
      return await handleSwapRequest(body, supabase, allEquipment, swapTargetMuscles);
    }

    // Handle weekly plan generation
    if (body.weeklyPlan) {
      return await handleWeeklyPlanRequest(body, supabase, anthropicKey, userWeightContext, fitnessGoal);
    }

    // Fetch available exercises from database
    let query = supabase.from('exercises').select('*');

    // Filter by equipment if provided
    // Note: For gym, we assume all equipment is available
    // For home/outdoor, we filter by what they have

    const { data: exercises, error: exercisesError } = await query;

    if (exercisesError) {
      throw new Error(`Failed to fetch exercises: ${exercisesError.message}`);
    }

    // Filter exercises based on target muscles and location
    const filteredExercises = exercises.filter((ex: any) => {
      // Check if exercise targets any of our desired muscles
      const targetsMuscle = targetMuscles.some(
        muscle => ex.primary_muscles?.includes(muscle) || ex.secondary_muscles?.includes(muscle)
      );

      // Check equipment based on location
      let hasEquipment = false;
      if (location === 'outdoor') {
        // Outdoor: ONLY bodyweight exercises
        hasEquipment = isBodyweightExercise(ex);
      } else if (location === 'gym') {
        // Gym: Check if specific gym equipment is provided, otherwise allow all
        if (allEquipment && allEquipment.length > 0) {
          const equipReq = ex.equipment_required || [];
          hasEquipment = equipReq.length === 0 ||
            equipReq.every((eq: string) =>
              allEquipment.includes(eq) || eq === 'none' || eq === 'bodyweight'
            );
        } else {
          hasEquipment = true; // No specific gym, allow all exercises
        }
      } else {
        // Home: Use available home equipment
        const equipReq = ex.equipment_required || [];
        hasEquipment = equipReq.length === 0 ||
          equipReq.every((eq: string) =>
            allEquipment?.includes(eq) || eq === 'none' || eq === 'bodyweight'
          );
      }

      // Check difficulty level
      const appropriateDifficulty = !ex.difficulty ||
        (experienceLevel === 'beginner' && ex.difficulty !== 'advanced') ||
        (experienceLevel === 'intermediate') ||
        (experienceLevel === 'advanced');

      // Exclude exercises that involve injured areas
      const avoidDueToInjury = injuries?.some(injury =>
        injury.movementsToAvoid?.some(movement =>
          ex.name.toLowerCase().includes(movement.toLowerCase()) ||
          ex.movement_pattern?.toLowerCase().includes(movement.toLowerCase())
        )
      );

      return targetsMuscle && hasEquipment && appropriateDifficulty && !avoidDueToInjury;
    });

    // Exclude previously used exercises if regenerating
    let availableExercises = filteredExercises;
    if (excludeExerciseIds && excludeExerciseIds.length > 0) {
      availableExercises = filteredExercises.filter(
        (ex: any) => !excludeExerciseIds.includes(ex.id)
      );
      console.log(`After exclusions: ${availableExercises.length} exercises available`);
    }

    console.log(`Filtered ${exercises.length} exercises to ${availableExercises.length} for location=${location}, muscles=${targetMuscles.join(',')}`);

    // For rehab/mobility workouts, filter to only include exercises with rehab_for populated
    let exercisePoolForMatching = exercises;
    if (workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') {
      exercisePoolForMatching = exercises.filter((ex: any) =>
        ex.rehab_for && ex.rehab_for.length > 0
      );
      console.log(`Rehab/mobility mode: filtered to ${exercisePoolForMatching.length} rehab exercises`);

      // Also filter available exercises for rule-based generation
      availableExercises = availableExercises.filter((ex: any) =>
        ex.rehab_for && ex.rehab_for.length > 0
      );
    }

    // Determine request type for logging
    const requestType = freeformPrompt ? 'freeform' : 'structured';

    // If we have Anthropic API key, use AI for intelligent selection
    // Otherwise, use rule-based selection
    let workout: GeneratedWorkout;
    let aiResponse: any = null;

    if (anthropicKey) {
      // Hybrid AI: Pass exercises for fuzzy matching (filtered for rehab if applicable)
      const result = await generateWithAI(
        anthropicKey,
        supabase,        // For logging unmatched exercises
        exercisePoolForMatching,  // Exercises for fuzzy matching (filtered for rehab/mobility)
        targetMuscles,
        duration,
        experienceLevel,
        workoutStyle,
        fitnessGoal,     // NEW: Pass fitness goal
        location,
        injuries,
        allEquipment,
        freeformPrompt,  // NEW: Pass freeform prompt if provided
        userWeightContext // NEW: Pass user context for weight suggestions
      );
      workout = result.workout;
      aiResponse = result.aiResponse;
    } else {
      workout = generateRuleBased(
        availableExercises,
        targetMuscles,
        duration,
        experienceLevel,
        workoutStyle,
        userWeightContext // NEW: Pass user context for weight suggestions
      );
    }

    const generationTime = Date.now() - startTime;

    // Log the request for analytics and review
    try {
      await supabase.from('workout_requests').insert({
        user_id: userId,
        request_type: requestType,
        workout_style: workoutStyle,
        target_muscles: targetMuscles,
        duration,
        location,
        user_prompt: freeformPrompt || null,
        user_context: {
          experienceLevel,
          fitnessGoal,
          injuries: injuries?.length || 0,
          equipmentCount: allEquipment?.length || 0,
        },
        ai_response: aiResponse,
        ai_model: anthropicKey ? 'claude-3-haiku-20240307' : null,
        generated_workout: workout,
        success: true,
        generation_time_ms: generationTime,
      });
    } catch (logError) {
      console.error('Failed to log workout request:', logError);
      // Don't fail the request just because logging failed
    }

    // Save the workout to database
    const { data: savedWorkout, error: saveError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name: workout.name,
        description: workout.description,
        workout_type: workout.workoutType,
        target_muscles: workout.targetMuscles,
        estimated_duration: workout.duration,
        is_ai_generated: !!anthropicKey,
        is_saved: false,
        ai_prompt_context: {
          location,
          targetMuscles,
          duration,
          experienceLevel,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save workout:', saveError);
      // Continue anyway, just return the generated workout
    }

    // Save workout exercises if workout was saved
    if (savedWorkout) {
      const exerciseInserts = workout.exercises.map((ex, index) => ({
        workout_id: savedWorkout.id,
        exercise_id: ex.exerciseId,
        order_index: index,
        target_sets: ex.sets,
        target_reps: parseInt(ex.reps.split('-')[0]) || 8,
        rest_seconds: ex.restSeconds,
        notes: ex.notes,
      }));

      await supabase.from('workout_exercises').insert(exerciseInserts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        workout: {
          ...workout,
          id: savedWorkout?.id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('=== WORKOUT GENERATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

interface AIGenerationResult {
  workout: GeneratedWorkout;
  aiResponse: any;
}

async function generateWithAI(
  apiKey: string,
  supabase: any,  // Added for logging unmatched exercises
  allDbExercises: any[],  // Full database for fuzzy matching
  targetMuscles: string[],
  duration: number,
  experienceLevel: string,
  workoutStyle: WorkoutStyle,
  fitnessGoal: FitnessGoal,
  location: string,
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[],
  equipment?: string[],
  freeformPrompt?: string,
  userWeightContext?: UserWeightContext
): Promise<AIGenerationResult> {
  // Build workout style context
  const workoutStyleContexts: Record<WorkoutStyle, string> = {
    traditional: `WORKOUT STYLE: Traditional Hypertrophy
- Sets: 3-4 per exercise
- Reps: 8-12 (hypertrophy range)
- Rest: 60-90 seconds between sets
- Focus on controlled tempo and mind-muscle connection
- Start with compound movements, finish with isolation

GOOD exercises for traditional hypertrophy:
- Chest: Bench Press, Incline Press, Dumbbell Fly, Cable Crossover, Push-ups
- Back: Lat Pulldown, Seated Row, Bent Over Row, Pull-ups, T-Bar Row
- Shoulders: Overhead Press, Lateral Raise, Front Raise, Rear Delt Fly
- Biceps: Barbell Curl, Dumbbell Curl, Hammer Curl, Preacher Curl
- Triceps: Tricep Pushdown, Skull Crusher, Dips, Overhead Extension
- Legs: Squat, Leg Press, Leg Extension, Leg Curl, Romanian Deadlift
- Core: Plank, Cable Crunch, Hanging Leg Raise

DO NOT USE these exercises for traditional hypertrophy:
- NO CrossFit exercises (Muscle-ups, Kipping Pull-ups, Wall Balls, Thrusters)
- NO Olympic lifts (Snatch, Clean & Jerk, Power Clean)
- NO Ring exercises (Ring Muscle-up, Ring Dips)
- NO AMRAP or EMOM formats
- NO Burpees, Box Jumps, or plyometrics`,

    strength: `WORKOUT STYLE: Strength/5x5
- Sets: 5 per exercise (5x5 protocol)
- Reps: 5 (heavy weight, low reps)
- Rest: 3-5 minutes between sets for full recovery
- Focus ONLY on compound movements (squat, bench, deadlift, row, press)
- Prioritize strength gains over pump
- Maximum 3-4 exercises total`,

    hiit: `WORKOUT STYLE: HIIT (High-Intensity Interval Training)
- Sets: 3-4 per exercise
- Reps: 12-15 or timed (30-45 seconds work)
- Rest: 15-30 seconds between sets (minimal rest!)
- Include explosive movements when possible
- Supersets encouraged for intensity
- Higher exercise count (6-8 exercises)
- Keep heart rate elevated throughout`,

    circuit: `WORKOUT STYLE: Circuit Training
- Perform exercises back-to-back with minimal rest
- Sets: 3 circuits of all exercises
- Reps: 10-12 per exercise
- Rest: 10-15 seconds between exercises, 60-90 seconds between circuits
- Include mix of upper/lower body for balanced fatigue
- Notes should indicate "Move immediately to next exercise"`,

    wod: `WORKOUT STYLE: WOD (Workout of the Day) / CrossFit Style
- Format as AMRAP (As Many Rounds As Possible), EMOM (Every Minute On the Minute), or "For Time"
- Include functional movements
- Higher reps (15-21 for bodyweight, 10-15 for weighted)
- Include mix of gymnastics, weightlifting, and cardio elements
- Rest is built into the format (EMOM) or minimal (AMRAP)
- In notes, include the specific format (e.g., "AMRAP 15 min" or "EMOM 12 min")`,

    cardio: `WORKOUT STYLE: Cardio / Running
- Focus on cardiovascular conditioning and endurance
- Include running intervals, sprints, or steady-state cardio
- Can include: run/walk intervals, tempo runs, fartlek, hill sprints
- For intervals: specify work/rest ratios (e.g., "30s sprint / 30s walk")
- Include warm-up and cool-down
- Exercises like: sprint intervals, zone 2 running, stair climbing, rowing
- For non-running: bike intervals, rowing, assault bike`,

    yoga: `WORKOUT STYLE: Yoga Flow / Practice

⛔️⛔️⛔️ ABSOLUTELY CRITICAL - YOU MUST FOLLOW THESE RULES ⛔️⛔️⛔️
- ZERO weight training exercises allowed
- ZERO gym equipment (NO dumbbells, NO barbells, NO machines, NO cables)
- ZERO compound lifts (NO squats, NO bench press, NO deadlifts, NO rows)
- This is 100% YOGA - poses, flows, and breathwork ONLY
- If you include ANY weight training, the workout will be REJECTED

✅ ONLY USE THESE TYPES OF EXERCISES:
- Standing poses: Warrior I, Warrior II, Warrior III, Triangle, Tree Pose, Chair Pose
- Balance poses: Eagle Pose, Half Moon, Dancer's Pose, Standing Split
- Seated poses: Seated Forward Fold, Pigeon Pose, Butterfly, Hero's Pose
- Supine poses: Bridge Pose, Happy Baby, Supine Twist, Legs Up Wall
- Core work: Boat Pose, Plank Pose, Side Plank, Dolphin Plank
- Flow sequences: Sun Salutation A, Sun Salutation B, Moon Salutation

✅ EXAMPLE YOGA WORKOUT:
1. Sun Salutation A - 3 rounds, 45s each, flow with breath
2. Warrior Flow (I → II → Reverse) - 2 sets each side, 30s holds
3. Tree Pose - 2 sets each side, 45s hold
4. Pigeon Pose - 2 sets each side, 60s hold
5. Supine Twist - 2 sets each side, 45s hold
6. Savasana - 1 set, 3-5 min

Format: Hold poses 5-10 breaths (30-60 seconds), flow sequences 3-5 rounds`,

    mobility: `WORKOUT STYLE: Mobility / Recovery / Stretching
⚠️ CRITICAL RESTRICTIONS - READ CAREFULLY:
- ABSOLUTELY NO weight training exercises (no bench press, squats, deadlifts, rows, curls, etc.)
- ABSOLUTELY NO resistance machines or cable exercises
- This is STRETCHING and MOBILITY work ONLY

REQUIRED exercise types:
- Static stretches (hold 30-60 seconds)
- Dynamic stretches and mobility drills
- Foam rolling / self-myofascial release
- Yoga-inspired movements
- Joint circles and controlled articulations

GOOD exercises to use:
- World's Greatest Stretch, Pigeon Pose, Figure Four Stretch
- Cat-Cow, Child's Pose, Downward Dog
- Hip 90/90, Couch Stretch, Hamstring Stretch
- Thoracic Rotations, Thread the Needle
- Foam Roll (quads, IT band, lats, thoracic spine)
- Shoulder Circles, Hip Circles, Ankle Circles

Format: 2 sets, 30-60s holds, minimal rest between exercises
Low intensity, focus on breath and relaxation`,

    rehab: `WORKOUT STYLE: Rehab / Prehab / Corrective Exercise
⚠️ CRITICAL RESTRICTIONS - READ CAREFULLY:
- ABSOLUTELY NO heavy compound lifts (no bench press, squats, deadlifts, overhead press, rows)
- ABSOLUTELY NO barbell exercises
- ABSOLUTELY NO exercises over 15 lbs
- This is REHABILITATION and CORRECTIVE work ONLY

REQUIRED exercise types:
- Light band exercises (resistance bands only)
- Bodyweight stability/activation drills
- Controlled mobility work
- Isometric holds
- Light dumbbell rotator cuff work (5-10 lbs max)

GOOD exercises for SHOULDER rehab:
- Band Pull-Aparts, Face Pulls (band), External Rotation (band/light DB)
- Internal Rotation, Prone Y-T-W raises, Scapular Push-ups
- Wall Slides, Shoulder Circles, Band Dislocates

GOOD exercises for HIP/KNEE rehab:
- Clamshells, Glute Bridges, Single Leg Glute Bridge
- Terminal Knee Extensions, Straight Leg Raises
- Side-Lying Hip Abduction, Monster Walks (band)

GOOD exercises for BACK/CORE rehab:
- Bird Dog, Dead Bug, Pallof Press (band)
- Cat-Cow, Pelvic Tilts, Supine Knee-to-Chest
- McGill Curl-up, Side Plank (modified if needed)

Format: 2-3 sets, 10-15 reps, 30s rest, controlled tempo
In notes: specify which body part/injury this addresses`,
  };

  // Build fitness goal context
  const goalContexts: Record<FitnessGoal, string> = {
    cut: `FITNESS GOAL: Fat Loss / Cutting
- Higher rep ranges (10-15 reps)
- Shorter rest periods (30-60 seconds)
- Include supersets where appropriate
- Prioritize compound movements for calorie burn
- Add metabolic finishers if time allows`,

    bulk: `FITNESS GOAL: Muscle Building / Bulking
- Moderate rep ranges (8-12 reps)
- Longer rest periods (90-120 seconds) for recovery
- Focus on progressive overload cues in notes
- Prioritize compound movements first, then isolation
- Sufficient volume per muscle group`,

    maintain: `FITNESS GOAL: Maintenance
- Balanced approach with moderate intensity
- Mix of rep ranges (8-12 reps)
- Standard rest periods (60-90 seconds)
- Variety to keep workouts engaging`,

    endurance: `FITNESS GOAL: Endurance
- Higher rep ranges (15-20 reps) or timed sets
- Shorter rest periods (30-45 seconds)
- Include cardio elements where appropriate
- Focus on muscular endurance, not max strength`,

    general: `FITNESS GOAL: General Fitness
- Well-rounded approach
- Mix of strength and conditioning
- Moderate rep ranges and rest periods
- Focus on functional movements`,
  };

  const styleContext = workoutStyleContexts[workoutStyle] || workoutStyleContexts.traditional;
  const goalContext = goalContexts[fitnessGoal] || goalContexts.general;

  // Build location-specific context
  let locationContext = '';
  if (location === 'outdoor') {
    locationContext = `\n\nLOCATION: OUTDOOR (park, trail, or outdoor space)
- ONLY use bodyweight exercises or exercises that need no equipment
- Good outdoor exercises: push-ups, pull-ups (if bar available), dips (bench/bars), lunges, squats, burpees, mountain climbers, planks, running, sprints
- DO NOT include exercises requiring: dumbbells, barbells, machines, cables, or gym equipment`;
  } else if (location === 'home') {
    const hasHomeEquipment = equipment && equipment.length > 0;
    locationContext = `\n\nLOCATION: HOME WORKOUT
- This is a HOME workout, NOT a gym workout
- DO NOT use: gymnastics rings, cable machines, leg press, smith machine, lat pulldown machine, or any gym-only equipment
- DO NOT use: Ring Muscle-ups, Ring Dips, Cable Flyes, Machine exercises
${hasHomeEquipment ? `- Available equipment: ${equipment.slice(0, 15).join(', ')}` : `- NO EQUIPMENT - use ONLY bodyweight exercises
- Good bodyweight exercises: push-ups (and variations), pull-ups (if bar), dips (chair/bench), lunges, squats, planks, crunches, glute bridges, mountain climbers, burpees`}
- Focus on exercises that work in small spaces`;
  } else if (location === 'gym') {
    locationContext = `\n\nLOCATION: GYM${equipment && equipment.length > 0 ? ` with equipment: ${equipment.slice(0, 15).join(', ')}${equipment.length > 15 ? '...' : ''}` : ' (commercial gym - full equipment assumed)'}`;
  }

  // Build equipment context
  let equipmentContext = '';
  if (location === 'outdoor') {
    equipmentContext = `\nNo equipment available - bodyweight only.`;
  } else if (location === 'home' && (!equipment || equipment.length === 0)) {
    equipmentContext = `\nNo equipment available - BODYWEIGHT EXERCISES ONLY. No dumbbells, no barbells, no machines.`;
  } else if (equipment && equipment.length > 0) {
    equipmentContext = `\nAvailable equipment includes: ${equipment.slice(0, 20).join(', ')}. Prioritize exercises using this equipment.`;
  }

  // Build injury context for the prompt
  let injuryContext = '';
  if (injuries && injuries.length > 0) {
    const injuryDescriptions = injuries.map(i =>
      `${i.bodyPart}${i.movementsToAvoid?.length ? ` (avoid: ${i.movementsToAvoid.join(', ')})` : ''}`
    ).join('; ');
    injuryContext = `\n\nINJURIES/LIMITATIONS: ${injuryDescriptions}. Avoid exercises that could aggravate these areas.`;
  }

  // Build target muscles emphasis
  const muscleEmphasis = targetMuscles.length === 1
    ? `Focus EXCLUSIVELY on ${targetMuscles[0]} - every exercise must target this muscle.`
    : targetMuscles.length <= 3
    ? `Focus on these specific muscles: ${targetMuscles.join(', ')}.`
    : `Full body workout targeting: ${targetMuscles.join(', ')}.`;

  // Build the prompt - different for freeform vs structured
  let prompt: string;

  if (freeformPrompt) {
    // FREEFORM PROMPT - User describes what they want
    prompt = `You are a certified personal trainer. A user has requested a custom workout.

USER REQUEST: "${freeformPrompt}"

USER CONTEXT:
- Experience Level: ${experienceLevel}
- Location: ${location}
- Duration: ${duration} minutes
${goalContext}
${locationContext}${equipmentContext}${injuryContext}

Interpret the user's request and create an appropriate workout. Consider their experience level, available equipment, and any limitations.

VARIETY SEED: ${Math.random().toString(36).substring(2, 8)} - Use this to inspire creative, varied exercise selection.
Be creative and pick DIFFERENT exercises than you might typically choose.

TIME BUDGET (CRITICAL - HARD LIMIT):
- Total workout time: ${duration} minutes
- Each exercise takes ~5 minutes (3 sets × 40s + 2 rest periods × 60-90s)
- MAXIMUM EXERCISES: ${Math.max(2, Math.floor(duration / 6))} exercises - DO NOT EXCEED THIS
- For ${duration} min: ${duration <= 15 ? 'exactly 2' : duration <= 20 ? '2-3' : duration <= 30 ? '3-4' : duration <= 45 ? '4-5' : '5-6'} exercises

RULES:
1. Use standard exercise names (e.g., "Barbell Bench Press", "Dumbbell Curl", "Pull-ups", "Sprint Intervals")
2. Honor the user's request - if they want something specific, give it to them
3. Respect equipment and injury constraints
4. HARD LIMIT: Do NOT generate more than ${Math.max(2, Math.floor(duration / 6))} exercises. Quality over quantity.
5. If they mention military/bootcamp style, include exercises like: 8-count bodybuilders, flutter kicks, scissor kicks, burpees, push-ups, sit-ups
6. If they mention running/cardio, include: sprint intervals, tempo runs, fartlek, run/walk intervals
7. VARIETY: Mix up your exercise selection - avoid always picking the same exercises

Return ONLY valid JSON:
{
  "name": "Creative workout name (not generic like 'Upper Body Workout' - be unique, e.g. 'Iron Protocol', 'Torch Session', 'The Grind')",
  "description": "Brief description of what this workout accomplishes",
  "workoutType": "push|pull|legs|upper|lower|fullbody|cardio|mobility",
  "exercises": [
    {
      "name": "Exercise Name",
      "primaryMuscle": "main muscle or system targeted",
      "sets": 3,
      "reps": "8-10 or time-based like 30s",
      "restSeconds": 60,
      "notes": "form tip or interval details"
    }
  ]
}`;
  } else {
    // Calculate time per exercise based on style
    const restPerSet = workoutStyle === 'strength' ? 180 : workoutStyle === 'hiit' || workoutStyle === 'circuit' ? 30 : 90;
    const setsPerExercise = workoutStyle === 'strength' ? 5 : 3;
    const timePerExercise = Math.ceil((setsPerExercise * 40 + (setsPerExercise - 1) * restPerSet) / 60); // in minutes
    const maxExercises = Math.max(1, Math.floor(duration / timePerExercise));

    // STRUCTURED PROMPT - Standard workout generation
    prompt = `You are a certified personal trainer. Create a ${duration}-minute ${experienceLevel}-level workout.

${styleContext}

${goalContext}

CRITICAL - TARGET MUSCLES ONLY: ${muscleEmphasis}
YOU MUST ONLY USE EXERCISES THAT TARGET THESE MUSCLES: ${targetMuscles.join(', ')}
- If target is chest/shoulders/triceps (push): NO squats, NO deadlifts, NO leg exercises
- If target is back/biceps (pull): NO chest press, NO push-ups, NO tricep exercises
- If target is quads/hamstrings/glutes (legs): NO upper body exercises
${locationContext}${equipmentContext}${injuryContext}

TIME BUDGET (${workoutStyle === 'strength' ? '5x5 STRENGTH' : 'STANDARD'}):
- Total workout time: ${duration} minutes
- Rest per set: ${restPerSet}s (${workoutStyle === 'strength' ? 'heavy strength work needs longer rest' : 'standard rest'})
- Each exercise takes ~${timePerExercise} minutes
- MAXIMUM EXERCISES: ${maxExercises} - DO NOT EXCEED

Generate a complete workout using your knowledge of fitness exercises. Use common, well-known exercise names.
The exercises will be matched to our database automatically.

VARIETY SEED: ${Math.random().toString(36).substring(2, 8)} - Use this to inspire creative, varied exercise selection.
Be creative and pick DIFFERENT exercises than you might typically choose. Avoid the most common/obvious choices.

RULES:
1. Use standard exercise names (e.g., "Barbell Bench Press", "Dumbbell Curl", "Pull-ups")
2. Follow the WORKOUT STYLE and FITNESS GOAL guidelines above
3. STRICT: ONLY exercises targeting ${targetMuscles.join(', ')} - NO OTHER MUSCLE GROUPS
4. For outdoor: ONLY bodyweight exercises
5. HARD LIMIT: Maximum ${maxExercises} exercises for ${duration} minutes
6. For cardio style: include running intervals, sprints, or cardio machine work
7. For mobility style: ONLY stretches, foam rolling, yoga poses - NO weight training
8. For rehab style: ONLY band work, light bodyweight, corrective exercises - NO barbell exercises, NO bench press, NO squats, NO deadlifts, NO overhead press
9. VARIETY: Mix up your exercise selection - don't always pick the same exercises
${workoutStyle === 'rehab' ? `
⚠️ REHAB WORKOUT - BANNED EXERCISES (DO NOT USE):
- Bench Press (any variation)
- Squat (any variation except bodyweight)
- Deadlift (any variation)
- Overhead Press
- Barbell Row
- Any exercise requiring more than 15 lbs
` : ''}${workoutStyle === 'mobility' ? `
⚠️ MOBILITY WORKOUT - BANNED EXERCISES (DO NOT USE):
- Any barbell exercise
- Any dumbbell exercise over 5 lbs
- Any machine exercise
- Bench Press, Squats, Deadlifts, Rows, Curls
` : ''}${workoutStyle === 'yoga' ? `
⛔️ YOGA WORKOUT - BANNED EXERCISES (STRICT - DO NOT USE):
- ANY barbell exercise (Bench Press, Squats, Deadlifts, Rows, etc.)
- ANY dumbbell exercise
- ANY machine exercise
- ANY cable exercise
- Pull-ups, Chin-ups, Dips
- Burpees, Mountain Climbers (these are conditioning, not yoga)
- ONLY use yoga poses and sequences as shown in the style description above
` : ''}

Return ONLY valid JSON:
{
  "name": "Creative workout name (not generic - be unique, e.g. 'Pressing Power', 'Back Attack', 'Quad Squad')",
  "description": "Brief description of the workout",
  "workoutType": "push|pull|legs|upper|lower|fullbody|cardio|mobility",
  "exercises": [
    {
      "name": "Exercise Name",
      "primaryMuscle": "main muscle targeted",
      "sets": 3,
      "reps": "8-10",
      "restSeconds": 90,
      "notes": "form tip"
    }
  ]
}`;
  }

  console.log('=== CALLING ANTHROPIC API ===');
  console.log('Prompt length:', prompt.length);
  console.log('Request type:', freeformPrompt ? 'FREEFORM' : 'STRUCTURED');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    throw new Error(`AI generation failed: ${errorText}`);
  }

  console.log('Anthropic API response status:', response.status);

  const aiResponse = await response.json();
  const content = aiResponse.content[0]?.text || '';

  console.log('AI response content length:', content.length);
  console.log('AI response preview:', content.substring(0, 200));

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to find JSON in AI response');
    console.error('Full response:', content);
    throw new Error('Failed to parse AI response - no JSON found');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
    console.log('Parsed workout:', parsed.name, 'with', parsed.exercises?.length, 'exercises');
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
    throw new Error('Failed to parse AI response - invalid JSON');
  }

  // ==========================================================================
  // HYBRID AI: Fuzzy match AI exercises to database + log unmatched
  // ==========================================================================
  const matchedExercises: GeneratedExercise[] = [];
  const unmatchedLog: { name: string; context: any }[] = [];

  // Banned exercises for rehab/mobility workouts - these should NEVER appear
  const bannedForRehab = new Set([
    'bench press', 'barbell bench press', 'dumbbell bench press', 'incline bench press',
    'squat', 'barbell squat', 'back squat', 'front squat',
    'deadlift', 'barbell deadlift', 'conventional deadlift', 'sumo deadlift', 'romanian deadlift',
    'overhead press', 'barbell overhead press', 'military press', 'shoulder press',
    'barbell row', 'bent over row', 'pendlay row',
    'leg press', 'hack squat',
    'clean', 'clean and jerk', 'snatch', 'power clean',
    'pull-up', 'chin-up', 'dip', 'muscle-up',
  ]);

  // Gym-only exercises that require equipment not available at home
  const gymOnlyExercises = new Set([
    'ring muscle-up', 'ring dip', 'ring row', 'ring push-up',
    'muscle-up', 'muscle up',
    'cable fly', 'cable crossover', 'cable curl', 'cable tricep', 'cable row',
    'lat pulldown', 'seated row machine', 'leg press', 'leg extension', 'leg curl',
    'smith machine', 'hack squat', 'pec deck', 'chest fly machine',
    'assisted pull-up', 'assisted dip',
  ]);

  // CrossFit/WOD exercises that should NOT appear in traditional workouts
  const crossfitExercises = new Set([
    'muscle-up', 'muscle up', 'ring muscle-up', 'bar muscle-up',
    'kipping pull-up', 'kipping', 'butterfly pull-up',
    'wall ball', 'wall balls', 'thruster', 'thrusters',
    'clean and jerk', 'snatch', 'power clean', 'hang clean',
    'box jump', 'burpee', 'devil press', 'man maker',
    'double under', 'toes to bar', 'knees to elbow',
  ]);

  // Check if user has any equipment for home
  const hasHomeEquipment = location === 'home' && allEquipment && allEquipment.length > 0;

  // Helper to check if exercise is banned for current workout style or location
  const isBannedExercise = (exerciseName: string): boolean => {
    const normalized = exerciseName.toLowerCase().trim();

    // Yoga, rehab, and mobility workouts should NOT have weight training exercises
    if (workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') {
      if (bannedForRehab.has(normalized) ||
          Array.from(bannedForRehab).some(banned => normalized.includes(banned))) {
        return true;
      }
    }

    // Traditional/Strength workouts should NOT have CrossFit exercises
    if (workoutStyle === 'traditional' || workoutStyle === 'strength') {
      if (crossfitExercises.has(normalized) ||
          Array.from(crossfitExercises).some(banned => normalized.includes(banned))) {
        console.log(`✗ Blocking CrossFit exercise "${normalized}" for ${workoutStyle} workout`);
        return true;
      }
      // Also block anything with "muscle-up", "kipping", "wall ball" patterns
      if (normalized.includes('muscle-up') || normalized.includes('muscle up') ||
          normalized.includes('kipping') || normalized.includes('wall ball') ||
          normalized.includes('thruster')) {
        console.log(`✗ Blocking CrossFit pattern "${normalized}" for ${workoutStyle} workout`);
        return true;
      }
    }

    // Home workouts without equipment should NOT have gym-only exercises
    if (location === 'home' && !hasHomeEquipment) {
      if (gymOnlyExercises.has(normalized) ||
          Array.from(gymOnlyExercises).some(banned => normalized.includes(banned))) {
        return true;
      }
      // Also block anything with "ring", "cable", "machine" in the name
      if (normalized.includes('ring ') || normalized.includes('cable ') ||
          normalized.includes('machine') || normalized.includes('smith')) {
        return true;
      }
    }

    return false;
  };

  for (const aiExercise of parsed.exercises) {
    // Check if exercise is banned for this workout style
    if (isBannedExercise(aiExercise.name)) {
      console.log(`✗ BLOCKED banned exercise for ${workoutStyle}: "${aiExercise.name}"`);
      continue; // Skip this exercise entirely
    }

    const match = findBestMatch(aiExercise.name, allDbExercises);

    if (match) {
      // Double-check matched exercise isn't banned either
      if (isBannedExercise(match.exercise.name)) {
        console.log(`✗ BLOCKED matched banned exercise for ${workoutStyle}: "${match.exercise.name}"`);
        continue;
      }

      // For rehab/mobility/yoga workouts, ONLY allow exercises with rehab_for populated
      // This is the key filter to prevent heavy exercises like bench press
      if (workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') {
        const hasRehabTag = match.exercise.rehab_for && match.exercise.rehab_for.length > 0;
        if (!hasRehabTag) {
          console.log(`✗ BLOCKED non-rehab exercise for ${workoutStyle}: "${match.exercise.name}" (no rehab_for tag)`);
          continue;
        }
      }

      // Found a match - use the database exercise ID and muscle data
      console.log(`✓ Matched "${aiExercise.name}" → "${match.exercise.name}" (score: ${match.score.toFixed(2)})`);

      // Calculate suggested weight using RX system
      const suggestedWeight = userWeightContext
        ? calculateSuggestedWeight(match.exercise, userWeightContext)
        : null;

      matchedExercises.push({
        exerciseId: match.exercise.id,
        name: match.exercise.name, // Use DB name for consistency
        sets: aiExercise.sets,
        reps: String(aiExercise.reps),
        weight: suggestedWeight ? String(suggestedWeight) : undefined,
        restSeconds: aiExercise.restSeconds,
        notes: aiExercise.notes,
        primaryMuscles: match.exercise.primary_muscles || [],
        secondaryMuscles: match.exercise.secondary_muscles || [],
        movementPatterns: match.exercise.movement_patterns || [],
        rehabFor: match.exercise.rehab_for || [],
      });
    } else {
      // No match found - for rehab/mobility, skip unmatched heavy exercises
      if (workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') {
        console.log(`✗ Skipping unmatched exercise for ${workoutStyle}: "${aiExercise.name}"`);
        continue; // Don't include unmatched exercises in rehab/mobility workouts
      }

      // For other styles, log and include
      console.log(`✗ Unmatched exercise: "${aiExercise.name}"`);
      unmatchedLog.push({
        name: aiExercise.name,
        context: {
          primaryMuscle: aiExercise.primaryMuscle,
          sets: aiExercise.sets,
          reps: aiExercise.reps,
          workoutStyle,
          location,
        },
      });

      // Include unmatched exercise with empty ID (client will display AI name)
      // Use AI-provided primaryMuscle as best guess
      matchedExercises.push({
        exerciseId: '', // Empty = unmatched, use AI-provided name
        name: aiExercise.name,
        sets: aiExercise.sets,
        reps: String(aiExercise.reps),
        restSeconds: aiExercise.restSeconds,
        primaryMuscles: aiExercise.primaryMuscle ? [aiExercise.primaryMuscle] : [],
        secondaryMuscles: [],
        notes: aiExercise.notes,
      });
    }
  }

  // Log unmatched exercises to database for future improvement
  if (unmatchedLog.length > 0) {
    console.log(`Logging ${unmatchedLog.length} unmatched exercises to database...`);
    for (const unmatched of unmatchedLog) {
      try {
        await supabase.rpc('log_unmatched_exercise', {
          p_ai_name: unmatched.name,
          p_normalized_name: normalizeExerciseName(unmatched.name),
          p_context: unmatched.context,
        });
      } catch (logError) {
        console.error('Failed to log unmatched exercise:', logError);
        // Don't fail the whole request just because logging failed
      }
    }
  }

  // If rehab/mobility workout ended up with no exercises, add appropriate fallbacks
  if ((workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') && matchedExercises.length === 0) {
    console.log(`⚠️ ${workoutStyle} workout has no valid exercises - adding fallback exercises`);

    // Fallback rehab/mobility/yoga exercises based on target muscles and style
    const fallbackRehabExercises: Record<string, { name: string; muscles: string[] }[]> = {
      shoulders: [
        { name: 'Band Pull-Aparts', muscles: ['shoulders', 'rear_delts'] },
        { name: 'External Rotation (Band)', muscles: ['shoulders', 'rotator_cuff'] },
        { name: 'Wall Slides', muscles: ['shoulders', 'scapula'] },
        { name: 'Prone Y-T-W Raises', muscles: ['shoulders', 'upper_back'] },
      ],
      back: [
        { name: 'Cat-Cow Stretch', muscles: ['back', 'spine'] },
        { name: 'Bird Dog', muscles: ['back', 'core'] },
        { name: 'Dead Bug', muscles: ['core', 'back'] },
        { name: 'Thoracic Rotation', muscles: ['upper_back', 'spine'] },
      ],
      chest: [
        { name: 'Doorway Stretch', muscles: ['chest', 'shoulders'] },
        { name: 'Scapular Push-ups', muscles: ['chest', 'scapula'] },
        { name: 'Foam Roll Pecs', muscles: ['chest'] },
      ],
      legs: [
        { name: 'Clamshells', muscles: ['glutes', 'hips'] },
        { name: 'Glute Bridge', muscles: ['glutes', 'hamstrings'] },
        { name: 'Hip 90/90 Stretch', muscles: ['hips', 'glutes'] },
        { name: 'Pigeon Pose', muscles: ['hips', 'glutes'] },
      ],
      core: [
        { name: 'Dead Bug', muscles: ['core', 'abs'] },
        { name: 'Pelvic Tilts', muscles: ['core', 'lower_back'] },
        { name: 'McGill Curl-up', muscles: ['abs', 'core'] },
      ],
      // Yoga-specific fallbacks - comprehensive list for yoga workouts
      yoga: [
        { name: 'Sun Salutation A', muscles: ['fullbody', 'flexibility'] },
        { name: 'Warrior I', muscles: ['legs', 'hips', 'balance'] },
        { name: 'Warrior II', muscles: ['legs', 'hips', 'core'] },
        { name: 'Warrior III', muscles: ['balance', 'legs', 'core'] },
        { name: 'Downward Dog', muscles: ['shoulders', 'hamstrings', 'back'] },
        { name: 'Upward Dog', muscles: ['back', 'chest', 'shoulders'] },
        { name: 'Child\'s Pose', muscles: ['back', 'hips'] },
        { name: 'Pigeon Pose', muscles: ['hips', 'glutes'] },
        { name: 'Tree Pose', muscles: ['balance', 'legs', 'core'] },
        { name: 'Triangle Pose', muscles: ['legs', 'obliques', 'hips'] },
        { name: 'Chair Pose', muscles: ['legs', 'core', 'balance'] },
        { name: 'Eagle Pose', muscles: ['balance', 'hips', 'shoulders'] },
        { name: 'Half Moon Pose', muscles: ['balance', 'legs', 'core'] },
        { name: 'Bridge Pose', muscles: ['glutes', 'back', 'hips'] },
        { name: 'Boat Pose', muscles: ['core', 'abs', 'balance'] },
        { name: 'Supine Twist', muscles: ['back', 'hips', 'flexibility'] },
        { name: 'Happy Baby Pose', muscles: ['hips', 'back', 'flexibility'] },
        { name: 'Seated Forward Fold', muscles: ['hamstrings', 'back', 'flexibility'] },
        { name: 'Cat-Cow Stretch', muscles: ['back', 'spine', 'flexibility'] },
        { name: 'Low Lunge', muscles: ['hips', 'quads', 'flexibility'] },
      ],
      // Flexibility/Balance fallbacks - for flexibility or balance goals
      flexibility: [
        { name: 'World\'s Greatest Stretch', muscles: ['hips', 'hamstrings', 'shoulders'] },
        { name: 'Hip 90/90 Stretch', muscles: ['hips', 'glutes'] },
        { name: 'Pigeon Pose', muscles: ['hips', 'glutes'] },
        { name: 'Seated Forward Fold', muscles: ['hamstrings', 'back'] },
        { name: 'Cat-Cow Stretch', muscles: ['back', 'spine'] },
        { name: 'Thread the Needle', muscles: ['shoulders', 'back'] },
        { name: 'Low Lunge', muscles: ['hips', 'quads'] },
        { name: 'Supine Twist', muscles: ['back', 'hips'] },
      ],
      balance: [
        { name: 'Tree Pose', muscles: ['balance', 'legs', 'core'] },
        { name: 'Warrior III', muscles: ['balance', 'legs', 'core'] },
        { name: 'Eagle Pose', muscles: ['balance', 'hips', 'shoulders'] },
        { name: 'Half Moon Pose', muscles: ['balance', 'legs', 'core'] },
        { name: 'Single Leg Deadlift (no weight)', muscles: ['balance', 'hamstrings', 'glutes'] },
        { name: 'Standing Split', muscles: ['balance', 'hamstrings', 'flexibility'] },
      ],
    };

    // Determine which fallback category to use based on workout style and target muscles
    let fallbackCategory = 'shoulders'; // Default

    // Use yoga fallbacks for yoga workouts
    if (workoutStyle === 'yoga') {
      fallbackCategory = 'yoga';
    } else if (targetMuscles.includes('flexibility') || rawTargetMuscles.includes('flexibility')) {
      fallbackCategory = 'flexibility';
    } else if (targetMuscles.includes('balance') || rawTargetMuscles.includes('balance')) {
      fallbackCategory = 'balance';
    } else {
      for (const muscle of targetMuscles) {
        if (['shoulders', 'front_delts', 'rear_delts', 'lateral_delts'].includes(muscle)) {
          fallbackCategory = 'shoulders';
          break;
        } else if (['back', 'lats', 'upper_back', 'lower_back', 'traps'].includes(muscle)) {
          fallbackCategory = 'back';
          break;
        } else if (['chest'].includes(muscle)) {
          fallbackCategory = 'chest';
          break;
        } else if (['quads', 'hamstrings', 'glutes', 'calves', 'hips'].includes(muscle)) {
          fallbackCategory = 'legs';
          break;
        } else if (['core', 'abs', 'obliques'].includes(muscle)) {
          fallbackCategory = 'core';
          break;
        }
      }
    }

    const fallbacks = fallbackRehabExercises[fallbackCategory] || fallbackRehabExercises.yoga;
    const exerciseCount = Math.min(Math.max(2, Math.floor(duration / 6)), fallbacks.length);

    for (let i = 0; i < exerciseCount; i++) {
      const fb = fallbacks[i];
      // Determine appropriate reps/notes based on style
      let reps = '10-15';
      let notes = 'Controlled movement';
      if (workoutStyle === 'yoga') {
        reps = '30-60s hold or 3-5 breaths';
        notes = 'Focus on breath and alignment';
      } else if (workoutStyle === 'mobility' || fallbackCategory === 'flexibility') {
        reps = '30-45s hold';
        notes = 'Mobility exercise - controlled, relaxed breathing';
      } else if (fallbackCategory === 'balance') {
        reps = '30-45s hold each side';
        notes = 'Balance pose - find a focal point, engage core';
      } else if (workoutStyle === 'rehab') {
        reps = '10-15';
        notes = 'Rehabilitation exercise - controlled movement';
      }
      matchedExercises.push({
        exerciseId: '',
        name: fb.name,
        sets: 2,
        reps,
        restSeconds: 15,
        notes,
        primaryMuscles: fb.muscles,
        secondaryMuscles: [],
      });
    }

    console.log(`Added ${exerciseCount} fallback ${workoutStyle} exercises`);
  }

  const matchRate = matchedExercises.length > 0
    ? matchedExercises.filter(e => e.exerciseId).length / matchedExercises.length
    : 0;
  console.log(`Match rate: ${(matchRate * 100).toFixed(0)}% (${matchedExercises.filter(e => e.exerciseId).length}/${matchedExercises.length})`);
  console.log('=== AI GENERATION COMPLETE ===');
  console.log('Workout name:', parsed.name);
  console.log('Exercise count:', matchedExercises.length);

  // Override workout name for rehab/mobility/yoga to be more appropriate
  let workoutName = parsed.name;
  if (workoutStyle === 'rehab' || workoutStyle === 'mobility' || workoutStyle === 'yoga') {
    // Build a nice target description from raw targets (before expansion)
    const targetGoals = (rawTargetMuscles || []).filter(t =>
      ['flexibility', 'balance', 'endurance'].includes(t)
    );
    const targetMuscleNames = (rawTargetMuscles || []).filter(t =>
      !['flexibility', 'balance', 'endurance'].includes(t)
    );

    let targetDescription = '';
    if (targetGoals.length > 0) {
      targetDescription = targetGoals.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' & ');
    } else if (targetMuscleNames.length > 0) {
      targetDescription = targetMuscleNames[0].charAt(0).toUpperCase() + targetMuscleNames[0].slice(1);
    }

    const styleLabel = workoutStyle === 'rehab' ? 'Rehab Session' :
                       workoutStyle === 'yoga' ? 'Yoga Flow' :
                       'Mobility Session';
    workoutName = targetDescription ? `${targetDescription} ${styleLabel}` : styleLabel;
  }

  return {
    workout: {
      name: workoutName || parsed.name,
      description: parsed.description,
      duration,
      workoutType: parsed.workoutType,
      workoutStyle,
      targetMuscles,
      exercises: matchedExercises,
    },
    aiResponse: {
      prompt: freeformPrompt || null,
      rawResponse: parsed,
      matchRate: matchRate,
      unmatchedCount: unmatchedLog.length,
    },
  };
}

function generateRuleBased(
  exercises: any[],
  targetMuscles: string[],
  duration: number,
  experienceLevel: string,
  workoutStyle: WorkoutStyle = 'traditional',
  userWeightContext?: UserWeightContext
): GeneratedWorkout {
  // Determine number of exercises based on duration and style
  let exerciseCount = Math.min(Math.floor(duration / 8), 8);

  // Adjust exercise count based on workout style
  if (workoutStyle === 'strength') {
    exerciseCount = Math.min(exerciseCount, 4); // Strength: fewer exercises
  } else if (workoutStyle === 'hiit' || workoutStyle === 'circuit') {
    exerciseCount = Math.min(Math.floor(duration / 5), 8); // HIIT/Circuit: more exercises
  }

  // Prioritize compound movements
  const compounds = exercises.filter(ex => ex.is_compound);
  const isolations = exercises.filter(ex => !ex.is_compound);

  // Sort by primary muscle match
  const sortByRelevance = (list: any[]) => {
    return list.sort((a, b) => {
      const aMatch = targetMuscles.filter(m => a.primary_muscles?.includes(m)).length;
      const bMatch = targetMuscles.filter(m => b.primary_muscles?.includes(m)).length;
      return bMatch - aMatch;
    });
  };

  sortByRelevance(compounds);
  sortByRelevance(isolations);

  // Select exercises: ratio depends on workout style
  let compoundCount: number;
  let isolationCount: number;

  if (workoutStyle === 'strength') {
    // Strength: almost all compounds
    compoundCount = Math.min(exerciseCount, compounds.length);
    isolationCount = 0;
  } else {
    // Other styles: 60% compound, 40% isolation
    compoundCount = Math.ceil(exerciseCount * 0.6);
    isolationCount = exerciseCount - compoundCount;
  }

  const selectedExercises = [
    ...compounds.slice(0, compoundCount),
    ...isolations.slice(0, isolationCount),
  ];

  // Determine sets and reps based on workout style
  const getSetsReps = (isCompound: boolean, movementPattern?: string): { sets: number; reps: string; rest: number } => {
    switch (workoutStyle) {
      case 'strength':
        return { sets: 5, reps: '5', rest: isCompound ? 180 : 120 };
      case 'hiit':
        return { sets: 3, reps: '12-15', rest: 30 };
      case 'circuit':
        return { sets: 3, reps: '10-12', rest: 15 };
      case 'wod':
        return { sets: 3, reps: isCompound ? '10-15' : '15-20', rest: 60 };
      case 'cardio':
        // Cardio exercises use time or distance
        return { sets: 1, reps: movementPattern === 'cardio' ? '5-10 min' : '30-60s', rest: 60 };
      case 'mobility':
        // Mobility exercises use holds or reps with longer durations
        return { sets: 2, reps: '30-60s hold', rest: 15 };
      case 'rehab':
        // Rehab/prehab - controlled movements
        return { sets: 2, reps: '10-15', rest: 30 };
      case 'traditional':
      default:
        switch (experienceLevel) {
          case 'beginner':
            return { sets: isCompound ? 3 : 2, reps: '10-12', rest: isCompound ? 90 : 60 };
          case 'intermediate':
            return { sets: isCompound ? 4 : 3, reps: '8-10', rest: isCompound ? 90 : 75 };
          case 'advanced':
            return { sets: isCompound ? 4 : 4, reps: '6-10', rest: isCompound ? 120 : 90 };
          default:
            return { sets: 3, reps: '10-12', rest: 75 };
        }
    }
  };

  // Determine workout name
  const workoutType = determineWorkoutType(targetMuscles);
  const workoutName = generateWorkoutName(workoutType, experienceLevel, workoutStyle);

  // Generate style-specific description
  const styleDescriptions: Record<string, string> = {
    strength: '5x5 strength-focused',
    hiit: 'high-intensity interval',
    circuit: 'circuit training',
    wod: 'CrossFit-style WOD',
    traditional: 'hypertrophy-focused',
    cardio: 'cardiovascular conditioning',
    mobility: 'mobility and recovery',
    rehab: 'rehab and prehab',
  };
  const styleDesc = styleDescriptions[workoutStyle] || 'traditional';

  return {
    name: workoutName,
    description: `${selectedExercises.length} ${styleDesc} exercises targeting ${targetMuscles.join(', ')}`,
    duration,
    workoutType,
    workoutStyle,
    targetMuscles,
    exercises: selectedExercises.map(ex => {
      const { sets, reps, rest } = getSetsReps(ex.is_compound, ex.movement_pattern);

      // Calculate suggested weight using RX system
      const suggestedWeight = userWeightContext
        ? calculateSuggestedWeight(ex, userWeightContext)
        : null;

      return {
        exerciseId: ex.id,
        name: ex.name,
        sets,
        reps,
        weight: suggestedWeight ? String(suggestedWeight) : undefined,
        restSeconds: rest,
        primaryMuscles: ex.primary_muscles || [],
        secondaryMuscles: ex.secondary_muscles || [],
        movementPatterns: ex.movement_patterns || [],
        rehabFor: ex.rehab_for || [],
      };
    }),
  };
}

function determineWorkoutType(muscles: string[]): string {
  const push = ['chest', 'shoulders', 'triceps'];
  const pull = ['back', 'biceps', 'rear_delts'];
  const legs = ['quads', 'hamstrings', 'glutes', 'calves'];

  const isPush = muscles.some(m => push.includes(m));
  const isPull = muscles.some(m => pull.includes(m));
  const isLegs = muscles.some(m => legs.includes(m));

  if (isPush && !isPull && !isLegs) return 'push';
  if (isPull && !isPush && !isLegs) return 'pull';
  if (isLegs && !isPush && !isPull) return 'legs';
  if ((isPush || isPull) && !isLegs) return 'upper';
  if (isLegs && !(isPush && isPull)) return 'lower';
  return 'fullbody';
}

function generateWorkoutName(type: string, level: string, style: string = 'traditional'): string {
  // Creative name templates for each style - randomly select one
  const styleNameTemplates: Record<string, string[]> = {
    strength: ['Iron Protocol', 'Heavy Metal', 'Strength Foundation', 'Power Hour', 'The Grind'],
    hiit: ['Torch Session', 'Burn Notice', 'Sweat Storm', 'Fire Starter', 'Intensity Zone'],
    circuit: ['The Gauntlet', 'Round Robin', 'Station Master', 'Circuit Breaker', 'Flow State'],
    wod: ['The Crucible', 'Battle Ready', 'Forge Ahead', 'Iron Will', 'No Mercy'],
    cardio: ['Heart Racer', 'Endurance Edge', 'Oxygen Debt', 'Mile Marker', 'Pace Setter'],
    yoga: ['Zen Flow', 'Inner Balance', 'Breath & Flow', 'Centered Practice', 'Mindful Movement'],
    mobility: ['Recovery Road', 'Flex Session', 'Restore & Reset', 'Loose & Limber', 'Movement Prep'],
    rehab: ['Rebuild Session', 'Recovery Protocol', 'Corrective Care', 'Foundation Fix', 'Steady Progress'],
    traditional: [],
  };

  const typeNameTemplates: Record<string, string[]> = {
    push: ['Push Day', 'Pressing Power', 'Chest & Shoulders', 'Upper Push', 'Press Protocol'],
    pull: ['Pull Day', 'Back Attack', 'Row & Grow', 'Upper Pull', 'Lat Assault'],
    legs: ['Leg Day', 'Lower Power', 'Quad Squad', 'Wheels of Steel', 'Foundation Builder'],
    upper: ['Upper Body', 'Top Half', 'Arms & Armor', 'Above the Belt', 'Upper Deck'],
    lower: ['Lower Body', 'Leg Focus', 'Base Builder', 'Ground Up', 'Lower Level'],
    fullbody: ['Full Body', 'Total Training', 'Head to Toe', 'Complete Package', 'All Systems Go'],
    cardio: ['Cardio Crush', 'Heart & Hustle', 'Sweat Session', 'Endurance Test'],
    mobility: ['Flow & Flex', 'Move Better', 'Mobility Work', 'Range Finder'],
  };

  const levelAdjectives: Record<string, string[]> = {
    beginner: ['Foundation', 'Starter', 'Entry', 'Basic', ''],
    intermediate: ['Progressive', 'Builder', 'Steady', '', ''],
    advanced: ['Intense', 'Elite', 'Beast Mode', 'Max Effort', 'Hardcore'],
  };

  // Pick random elements
  const styleNames = styleNameTemplates[style] || [];
  const typeNames = typeNameTemplates[type] || ['Workout'];
  const levelAdjs = levelAdjectives[level] || [''];

  // For styles with specific names, use those; otherwise combine type + level
  if (styleNames.length > 0) {
    const styleName = styleNames[Math.floor(Math.random() * styleNames.length)];
    // Sometimes add type context
    if (type && type !== 'fullbody' && Math.random() > 0.5) {
      const shortType = type.charAt(0).toUpperCase() + type.slice(1);
      return `${shortType} ${styleName}`;
    }
    return styleName;
  }

  // Traditional style - combine level adjective with type name
  const typeName = typeNames[Math.floor(Math.random() * typeNames.length)];
  const levelAdj = levelAdjs[Math.floor(Math.random() * levelAdjs.length)];

  if (levelAdj) {
    return `${levelAdj} ${typeName}`;
  }
  return typeName;
}

// Map workout styles to exercise categories/tags that match
const styleExercisePatterns: Record<WorkoutStyle, string[]> = {
  wod: ['crossfit', 'olympic', 'plyometric', 'burpee', 'box jump', 'wall ball', 'thruster', 'snatch', 'clean', 'muscle-up', 'kipping', 'double under', 'kettlebell', 'swing', 'jerk', 'push press', 'sumo', 'high pull', 'devil press', 'man maker', 'dumbbell snatch', 'hang'],
  hiit: ['plyometric', 'burpee', 'jump', 'sprint', 'explosive', 'battle rope', 'slam', 'mountain climber', 'swing', 'thruster', 'squat jump', 'lunge jump', 'high knees', 'box'],
  circuit: ['compound', 'plyometric', 'bodyweight', 'kettlebell', 'dumbbell'],
  strength: ['barbell', 'powerlifting', 'squat', 'deadlift', 'bench', 'press', 'row', 'rack pull', 'pause', 'deficit'],
  cardio: ['run', 'sprint', 'interval', 'bike', 'row', 'ski', 'jump rope', 'assault', 'echo'],
  yoga: ['yoga', 'pose', 'warrior', 'sun salutation', 'vinyasa', 'downward', 'pigeon', 'tree', 'triangle', 'cobra', 'child', 'bridge', 'flow', 'breath'],
  mobility: ['stretch', 'foam', 'mobility', 'yoga', 'flexibility', 'pigeon', 'hip opener'],
  rehab: ['rehab', 'prehab', 'band pull', 'face pull', 'external rotation', 'internal rotation', 'scapular', 'clamshell', 'bird dog', 'dead bug', 'chin tuck', 'glute bridge', 'stretch'],
  traditional: [], // No specific filter for traditional
};

// Handle swap request - find alternative exercises for a given exercise
async function handleSwapRequest(
  body: WorkoutRequest,
  supabase: any,
  allEquipment: string[],
  expandedSwapMuscles: string[]
): Promise<Response> {
  const { location, swapExerciseId, injuries, experienceLevel, workoutStyle = 'traditional' } = body;
  let swapTargetMuscles = expandedSwapMuscles;

  // Fetch all exercises
  const { data: exercises, error } = await supabase.from('exercises').select('*');

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch exercises' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If no target muscles provided, look up the exercise being swapped and use its muscles
  if (!swapTargetMuscles || swapTargetMuscles.length === 0) {
    const originalExercise = exercises.find((ex: any) => ex.id === swapExerciseId);
    if (originalExercise) {
      swapTargetMuscles = [
        ...(originalExercise.primary_muscles || []),
        ...(originalExercise.secondary_muscles || []),
      ];
      console.log(`Swap: No target muscles provided, using exercise muscles: ${swapTargetMuscles.join(', ')}`);
    }
  }

  // Helper to check if exercise matches workout style (defined here for use in filter)
  const checkStyleMatch = (ex: any, style: WorkoutStyle): boolean => {
    const patterns = styleExercisePatterns[style] || [];
    if (patterns.length === 0) return false;
    const exName = ex.name.toLowerCase();
    const exSlug = (ex.slug || '').toLowerCase();
    return patterns.some(pattern => exName.includes(pattern) || exSlug.includes(pattern));
  };

  // Common CrossFit/WOD equipment that should always be allowed for WOD style
  const wodEquipment = ['kettlebell', 'barbell', 'dumbbell', 'pull-up bar', 'box', 'medicine ball', 'jump rope', 'rings', 'wall ball'];

  console.log(`Swap request: style=${workoutStyle}, targetMuscles=${swapTargetMuscles?.join(',')}, exerciseId=${swapExerciseId}`);

  // Filter to exercises that target the same muscles
  const alternatives = exercises.filter((ex: any) => {
    // Don't include the exercise we're swapping
    if (ex.id === swapExerciseId) return false;

    // Must target at least one of the same muscles (if we have target muscles)
    if (swapTargetMuscles && swapTargetMuscles.length > 0) {
      const targetsMuscle = swapTargetMuscles.some(
        (muscle: string) => ex.primary_muscles?.includes(muscle) || ex.secondary_muscles?.includes(muscle)
      );
      if (!targetsMuscle) return false;
    }

    // For WOD/HIIT, if exercise matches style, be lenient on equipment
    const isStyleMatch = checkStyleMatch(ex, workoutStyle);
    const isExplosiveStyle = workoutStyle === 'wod' || workoutStyle === 'hiit' || workoutStyle === 'circuit';

    // Check equipment based on location
    let hasEquipment = false;
    if (location === 'outdoor') {
      // Outdoor: ONLY bodyweight exercises
      hasEquipment = isBodyweightExercise(ex);
    } else if (location === 'gym') {
      if (allEquipment && allEquipment.length > 0) {
        const equipReq = ex.equipment_required || [];
        // For WOD-style matches in gym, allow common CrossFit equipment
        if (isExplosiveStyle && isStyleMatch) {
          hasEquipment = equipReq.length === 0 ||
            equipReq.every((eq: string) =>
              allEquipment.includes(eq) || wodEquipment.includes(eq.toLowerCase()) || eq === 'none' || eq === 'bodyweight'
            );
        } else {
          hasEquipment = equipReq.length === 0 ||
            equipReq.every((eq: string) =>
              allEquipment.includes(eq) || eq === 'none' || eq === 'bodyweight'
            );
        }
      } else {
        hasEquipment = true;
      }
    } else {
      // Home location
      const equipReq = ex.equipment_required || [];
      if (!allEquipment || allEquipment.length === 0) {
        // No home equipment - only bodyweight exercises
        hasEquipment = isBodyweightExercise(ex) || equipReq.length === 0 ||
          equipReq.every((eq: string) => eq === 'none' || eq === 'bodyweight');
      } else {
        hasEquipment = equipReq.length === 0 ||
          equipReq.every((eq: string) =>
            allEquipment.includes(eq) || eq === 'none' || eq === 'bodyweight'
          );
      }
    }
    if (!hasEquipment) return false;

    // Check difficulty
    const appropriateDifficulty = !ex.difficulty ||
      (experienceLevel === 'beginner' && ex.difficulty !== 'advanced') ||
      (experienceLevel === 'intermediate') ||
      (experienceLevel === 'advanced');
    if (!appropriateDifficulty) return false;

    // Check injuries
    const avoidDueToInjury = injuries?.some((injury: any) =>
      injury.movementsToAvoid?.some((movement: string) =>
        ex.name.toLowerCase().includes(movement.toLowerCase()) ||
        ex.movement_pattern?.toLowerCase().includes(movement.toLowerCase())
      )
    );
    if (avoidDueToInjury) return false;

    return true;
  });

  // Sort by: 1) style match, 2) primary muscle match
  alternatives.sort((a: any, b: any) => {
    // Style match is highest priority (use checkStyleMatch defined earlier)
    const aStyleMatch = checkStyleMatch(a, workoutStyle) ? 2 : 0;
    const bStyleMatch = checkStyleMatch(b, workoutStyle) ? 2 : 0;
    if (aStyleMatch !== bStyleMatch) return bStyleMatch - aStyleMatch;

    // Then primary muscle match
    const aPrimaryMatch = swapTargetMuscles?.some((m: string) => a.primary_muscles?.includes(m)) ? 1 : 0;
    const bPrimaryMatch = swapTargetMuscles?.some((m: string) => b.primary_muscles?.includes(m)) ? 1 : 0;
    return bPrimaryMatch - aPrimaryMatch;
  });

  // Debug: Log what's happening
  const styleMatches = alternatives.filter((ex: any) => checkStyleMatch(ex, workoutStyle));
  console.log(`Swap: Found ${alternatives.length} alternatives, ${styleMatches.length} match style=${workoutStyle}`);
  console.log(`Swap: Top 5 alternatives:`, alternatives.slice(0, 5).map((ex: any) => ({
    name: ex.name,
    styleMatch: checkStyleMatch(ex, workoutStyle),
    muscles: ex.primary_muscles,
  })));

  // Return top 10 alternatives
  const topAlternatives = alternatives.slice(0, 10).map((ex: any) => ({
    id: ex.id,
    name: ex.name,
    primaryMuscles: ex.primary_muscles,
    secondaryMuscles: ex.secondary_muscles,
    equipmentRequired: ex.equipment_required,
    isCompound: ex.is_compound,
    difficulty: ex.difficulty,
    movementPatterns: ex.movement_patterns || [],
    rehabFor: ex.rehab_for || [],
  }));

  return new Response(
    JSON.stringify({
      success: true,
      alternatives: topAlternatives,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// =============================================================================
// WEEKLY PLAN GENERATION
// =============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Smart muscle split assignment based on training days
function getWeeklySplit(dayCount: number, days: WeeklyPlanDay[]): Map<number, string[]> {
  const splits: Record<number, Record<number, string[]>> = {
    2: {
      // 2-day: Full body both days
      0: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core'],
      1: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core'],
    },
    3: {
      // 3-day: Push/Pull/Legs
      0: ['chest', 'shoulders', 'triceps'],
      1: ['back', 'biceps', 'traps'],
      2: ['quads', 'hamstrings', 'glutes', 'calves'],
    },
    4: {
      // 4-day: Upper/Lower x2
      0: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      1: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
      2: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      3: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    },
    5: {
      // 5-day: PPL + Upper + Lower
      0: ['chest', 'shoulders', 'triceps'],
      1: ['back', 'biceps', 'traps'],
      2: ['quads', 'hamstrings', 'glutes', 'calves'],
      3: ['chest', 'back', 'shoulders'],
      4: ['quads', 'hamstrings', 'glutes', 'core'],
    },
    6: {
      // 6-day: PPL x2
      0: ['chest', 'shoulders', 'triceps'],
      1: ['back', 'biceps', 'traps'],
      2: ['quads', 'hamstrings', 'glutes', 'calves'],
      3: ['chest', 'shoulders', 'triceps'],
      4: ['back', 'biceps', 'traps'],
      5: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    },
  };

  const result = new Map<number, string[]>();
  const split = splits[dayCount] || splits[3]; // Default to 3-day

  // Map split indices to actual days
  const sortedDays = [...days].sort((a, b) => a.day_of_week - b.day_of_week);
  sortedDays.forEach((day, idx) => {
    // Use user-specified muscle focus if provided, otherwise use split
    if (day.muscle_focus && day.muscle_focus.length > 0) {
      result.set(day.day_of_week, day.muscle_focus);
    } else {
      result.set(day.day_of_week, split[idx] || split[0]);
    }
  });

  return result;
}

async function handleWeeklyPlanRequest(
  body: WorkoutRequest,
  supabase: any,
  anthropicKey: string | undefined,
  userWeightContext: UserWeightContext,
  fitnessGoal: FitnessGoal
): Promise<Response> {
  const { userId, weeklyPlan, location, duration, experienceLevel, workoutStyle = 'traditional', injuries, equipment, customEquipment } = body;

  if (!weeklyPlan || !weeklyPlan.days || weeklyPlan.days.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'No days specified for weekly plan' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('=== GENERATE WEEKLY PLAN REQUEST ===');
  console.log('Plan name:', weeklyPlan.planName);
  console.log('Days:', weeklyPlan.days.map(d => `${DAY_NAMES[d.day_of_week]}`).join(', '));
  console.log('Location:', location);
  console.log('Duration per workout:', duration);

  const allEquipment = [...(equipment || []), ...(customEquipment || [])];

  // Create the plan in the database
  const { data: planData, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      name: weeklyPlan.planName,
      description: `${weeklyPlan.days.length}-day ${workoutStyle} training program`,
      is_active: true,
    })
    .select()
    .single();

  if (planError) {
    console.error('Failed to create plan:', planError);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Deactivate other plans
  await supabase
    .from('workout_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .neq('id', planData.id);

  // Get muscle split for each day
  const muscleSplit = getWeeklySplit(weeklyPlan.days.length, weeklyPlan.days);

  // Generate workouts for each day
  const generatedWorkouts: any[] = [];
  const usedExerciseIds: string[] = [];

  for (const day of weeklyPlan.days) {
    const dayMuscles = muscleSplit.get(day.day_of_week) || ['chest', 'back', 'shoulders'];
    const dayStyle = day.workout_style === 'auto' ? workoutStyle : (day.workout_style || workoutStyle);
    const dayName = DAY_NAMES[day.day_of_week];

    console.log(`Generating ${dayName}: muscles=${dayMuscles.join(',')}, style=${dayStyle}`);

    // Build a sub-request for this day
    const dayRequest: WorkoutRequest = {
      userId,
      location,
      targetMuscles: dayMuscles,
      duration,
      experienceLevel,
      workoutStyle: dayStyle as WorkoutStyle,
      injuries,
      equipment,
      customEquipment,
      excludeExerciseIds: usedExerciseIds.slice(-30), // Exclude recent exercises to add variety
    };

    try {
      // Call the main generation logic for this day
      // We'll use a simplified version - just use the AI to generate
      const { data: exercises } = await supabase.from('exercises').select('*');

      let dayWorkout;
      if (anthropicKey) {
        const result = await generateWithAI(
          anthropicKey,
          supabase,
          exercises || [],
          dayMuscles,
          duration,
          experienceLevel,
          dayStyle as WorkoutStyle,
          fitnessGoal,
          location,
          injuries,
          allEquipment,
          undefined, // no freeform prompt
          userWeightContext
        );
        dayWorkout = result.workout;
        // Override name to include day
        dayWorkout.name = `${dayName}: ${dayWorkout.name}`;
      } else {
        // Rule-based fallback
        dayWorkout = generateRuleBased(
          exercises || [],
          dayMuscles,
          duration,
          experienceLevel,
          dayStyle as WorkoutStyle,
          userWeightContext
        );
        dayWorkout.name = `${dayName}: ${dayWorkout.name}`;
      }

      // Track used exercises
      const dayExerciseIds = dayWorkout.exercises.map((ex: any) => ex.exerciseId).filter(Boolean);
      usedExerciseIds.push(...dayExerciseIds);

      // Save workout to database
      const { data: savedWorkout, error: saveError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: dayWorkout.name,
          description: dayWorkout.description,
          workout_type: dayWorkout.workoutType,
          target_muscles: dayWorkout.targetMuscles,
          estimated_duration: dayWorkout.duration,
          is_ai_generated: !!anthropicKey,
          is_saved: false,
        })
        .select()
        .single();

      if (saveError) {
        console.error(`Failed to save ${dayName} workout:`, saveError);
        continue;
      }

      // Save workout exercises
      if (savedWorkout) {
        const exerciseInserts = dayWorkout.exercises.map((ex: any, index: number) => ({
          workout_id: savedWorkout.id,
          exercise_id: ex.exerciseId,
          order_index: index,
          target_sets: ex.sets,
          target_reps: parseInt(ex.reps.split('-')[0]) || 8,
          rest_seconds: ex.restSeconds,
          notes: ex.notes,
        }));

        await supabase.from('workout_exercises').insert(exerciseInserts);

        // Create plan day entry
        await supabase.from('workout_plan_days').insert({
          plan_id: planData.id,
          day_of_week: day.day_of_week,
          workout_id: savedWorkout.id,
          muscle_focus: dayMuscles,
          workout_style: dayStyle,
        });

        generatedWorkouts.push({
          day_of_week: day.day_of_week,
          day_name: dayName,
          workout: {
            ...dayWorkout,
            id: savedWorkout.id,
          },
        });
      }
    } catch (dayError) {
      console.error(`Error generating ${dayName} workout:`, dayError);
      // Continue with other days
    }
  }

  console.log(`Weekly plan complete: ${generatedWorkouts.length}/${weeklyPlan.days.length} workouts generated`);

  return new Response(
    JSON.stringify({
      success: true,
      plan: {
        id: planData.id,
        name: planData.name,
        days: generatedWorkouts,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
