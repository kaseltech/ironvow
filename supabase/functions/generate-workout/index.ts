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
  return bodyweightExercises.has(ex.slug) ||
    ex.name.toLowerCase().includes('bodyweight') ||
    ex.name.toLowerCase().includes('push-up') ||
    ex.name.toLowerCase().includes('pull-up') ||
    ex.name.toLowerCase().includes('lunge') ||
    ex.name.toLowerCase().includes('plank') ||
    ex.name.toLowerCase().includes('crunch') ||
    ex.name.toLowerCase().includes('squat') && !ex.name.toLowerCase().includes('barbell') && !ex.name.toLowerCase().includes('goblet');
}

// Workout style determines programming approach
type WorkoutStyle = 'traditional' | 'strength' | 'hiit' | 'circuit' | 'wod' | 'cardio' | 'mobility';

// Fitness goal affects programming (from user profile)
type FitnessGoal = 'cut' | 'bulk' | 'maintain' | 'endurance' | 'general';

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

    // Fetch user profile to get fitness_goal
    let fitnessGoal: FitnessGoal = 'general';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('fitness_goal')
        .eq('user_id', userId)
        .single();
      if (profile?.fitness_goal) {
        fitnessGoal = profile.fitness_goal as FitnessGoal;
      }
    }

    // Map broad muscle groups to specific muscles in database
    const muscleMapping: Record<string, string[]> = {
      'chest': ['chest', 'upper_chest', 'lower_chest'],
      'back': ['back', 'lats', 'upper_back', 'lower_back', 'rhomboids', 'traps'],
      'shoulders': ['shoulders', 'front_delts', 'lateral_delts', 'rear_delts', 'delts'],
      'arms': ['biceps', 'triceps', 'forearms', 'brachialis'],
      'legs': ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'adductors'],
      'core': ['core', 'abs', 'obliques', 'lower_back', 'transverse_abdominis'],
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

    // Determine request type for logging
    const requestType = freeformPrompt ? 'freeform' : 'structured';

    // If we have Anthropic API key, use AI for intelligent selection
    // Otherwise, use rule-based selection
    let workout: GeneratedWorkout;
    let aiResponse: any = null;

    if (anthropicKey) {
      // Hybrid AI: Pass ALL exercises for fuzzy matching (AI generates freely)
      const result = await generateWithAI(
        anthropicKey,
        supabase,        // For logging unmatched exercises
        exercises,       // ALL exercises for fuzzy matching
        targetMuscles,
        duration,
        experienceLevel,
        workoutStyle,
        fitnessGoal,     // NEW: Pass fitness goal
        location,
        injuries,
        allEquipment,
        freeformPrompt   // NEW: Pass freeform prompt if provided
      );
      workout = result.workout;
      aiResponse = result.aiResponse;
    } else {
      workout = generateRuleBased(
        availableExercises,
        targetMuscles,
        duration,
        experienceLevel,
        workoutStyle
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
  freeformPrompt?: string
): Promise<AIGenerationResult> {
  // Build workout style context
  const workoutStyleContexts: Record<WorkoutStyle, string> = {
    traditional: `WORKOUT STYLE: Traditional Hypertrophy
- Sets: 3-4 per exercise
- Reps: 8-12 (hypertrophy range)
- Rest: 60-90 seconds between sets
- Focus on controlled tempo and mind-muscle connection
- Start with compound movements, finish with isolation`,

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

    mobility: `WORKOUT STYLE: Mobility / Recovery
- Focus on flexibility, stretching, and movement quality
- Include dynamic stretches, static stretches, and foam rolling
- Hold times for static stretches: 30-60 seconds
- Flow from one movement to next smoothly
- Include: hip openers, thoracic mobility, hamstring stretches
- Can include yoga-inspired movements
- Low intensity, focus on breath and relaxation
- Good exercises: world's greatest stretch, pigeon pose, cat-cow, foam rolling`,
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
    locationContext = `\n\nLOCATION: HOME GYM
- Only use exercises that can be done with limited equipment
- Focus on movements that work well in small spaces`;
  } else if (location === 'gym') {
    locationContext = `\n\nLOCATION: GYM${equipment && equipment.length > 0 ? ` with equipment: ${equipment.slice(0, 15).join(', ')}${equipment.length > 15 ? '...' : ''}` : ' (commercial gym - full equipment assumed)'}`;
  }

  // Build equipment context
  let equipmentContext = '';
  if (location === 'outdoor') {
    equipmentContext = `\nNo equipment available - bodyweight only.`;
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

Return ONLY valid JSON:
{
  "name": "Descriptive workout name based on their request",
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
    // STRUCTURED PROMPT - Standard workout generation
    prompt = `You are a certified personal trainer. Create a ${duration}-minute ${experienceLevel}-level workout.

${styleContext}

${goalContext}

TARGET MUSCLES: ${muscleEmphasis}${locationContext}${equipmentContext}${injuryContext}

TIME BUDGET (CRITICAL - HARD LIMIT):
- Total workout time: ${duration} minutes
- Each exercise takes ~5 minutes (3 sets × 40s + 2 rest periods × 60-90s)
- MAXIMUM EXERCISES: ${Math.max(2, Math.floor(duration / 6))} exercises - DO NOT EXCEED THIS
- For ${duration} min: ${duration <= 15 ? 'exactly 2' : duration <= 20 ? '2-3' : duration <= 30 ? '3-4' : duration <= 45 ? '4-5' : '5-6'} exercises

Generate a complete workout using your knowledge of fitness exercises. Use common, well-known exercise names.
The exercises will be matched to our database automatically.

RULES:
1. Use standard exercise names (e.g., "Barbell Bench Press", "Dumbbell Curl", "Pull-ups")
2. Follow the WORKOUT STYLE and FITNESS GOAL guidelines above
3. Every exercise should target the specified muscles: ${targetMuscles.join(', ')}
4. For outdoor: ONLY bodyweight exercises
5. HARD LIMIT: Do NOT generate more than ${Math.max(2, Math.floor(duration / 6))} exercises
6. For cardio style: include running intervals, sprints, or cardio machine work
7. For mobility style: include stretches, foam rolling, and movement prep

Return ONLY valid JSON:
{
  "name": "Descriptive workout name",
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

  for (const aiExercise of parsed.exercises) {
    const match = findBestMatch(aiExercise.name, allDbExercises);

    if (match) {
      // Found a match - use the database exercise ID and muscle data
      console.log(`✓ Matched "${aiExercise.name}" → "${match.exercise.name}" (score: ${match.score.toFixed(2)})`);
      matchedExercises.push({
        exerciseId: match.exercise.id,
        name: match.exercise.name, // Use DB name for consistency
        sets: aiExercise.sets,
        reps: String(aiExercise.reps),
        restSeconds: aiExercise.restSeconds,
        notes: aiExercise.notes,
        primaryMuscles: match.exercise.primary_muscles || [],
        secondaryMuscles: match.exercise.secondary_muscles || [],
      });
    } else {
      // No match found - log for later review and still include in workout
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

  const matchRate = matchedExercises.filter(e => e.exerciseId).length / matchedExercises.length;
  console.log(`Match rate: ${(matchRate * 100).toFixed(0)}% (${matchedExercises.filter(e => e.exerciseId).length}/${matchedExercises.length})`);
  console.log('=== AI GENERATION COMPLETE ===');
  console.log('Workout name:', parsed.name);
  console.log('Exercise count:', matchedExercises.length);

  return {
    workout: {
      name: parsed.name,
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
  workoutStyle: WorkoutStyle = 'traditional'
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
      return {
        exerciseId: ex.id,
        name: ex.name,
        sets,
        reps,
        restSeconds: rest,
        primaryMuscles: ex.primary_muscles || [],
        secondaryMuscles: ex.secondary_muscles || [],
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
  // Style-based name prefixes
  const styleNames: Record<string, string> = {
    strength: '5x5',
    hiit: 'HIIT',
    circuit: 'Circuit',
    wod: 'WOD',
    traditional: '',
    cardio: 'Cardio',
    mobility: 'Mobility',
  };

  const typeNames: Record<string, string> = {
    push: 'Push Power',
    pull: 'Pull Strength',
    legs: 'Leg Day',
    upper: 'Upper Body',
    lower: 'Lower Body',
    fullbody: 'Full Body Blast',
    cardio: 'Cardio Session',
    mobility: 'Recovery Flow',
  };

  const levelPrefix: Record<string, string> = {
    beginner: 'Foundation',
    intermediate: 'Progressive',
    advanced: 'Intense',
  };

  const styleName = styleNames[style] || '';
  const levelName = style === 'traditional' ? (levelPrefix[level] || '') : '';
  const typeName = typeNames[type] || 'Workout';

  const parts = [styleName, levelName, typeName].filter(Boolean);
  return parts.join(' ').trim();
}

// Map workout styles to exercise categories/tags that match
const styleExercisePatterns: Record<WorkoutStyle, string[]> = {
  wod: ['crossfit', 'olympic', 'plyometric', 'burpee', 'box jump', 'wall ball', 'thruster', 'snatch', 'clean', 'muscle-up', 'kipping', 'double under', 'kettlebell', 'swing', 'jerk', 'push press', 'sumo', 'high pull', 'devil press', 'man maker', 'dumbbell snatch', 'hang'],
  hiit: ['plyometric', 'burpee', 'jump', 'sprint', 'explosive', 'battle rope', 'slam', 'mountain climber', 'swing', 'thruster', 'squat jump', 'lunge jump', 'high knees', 'box'],
  circuit: ['compound', 'plyometric', 'bodyweight', 'kettlebell', 'dumbbell'],
  strength: ['barbell', 'powerlifting', 'squat', 'deadlift', 'bench', 'press', 'row', 'rack pull', 'pause', 'deficit'],
  cardio: ['run', 'sprint', 'interval', 'bike', 'row', 'ski', 'jump rope', 'assault', 'echo'],
  mobility: ['stretch', 'foam', 'mobility', 'yoga', 'flexibility', 'pigeon', 'hip opener'],
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
      const equipReq = ex.equipment_required || [];
      hasEquipment = equipReq.length === 0 ||
        equipReq.every((eq: string) =>
          allEquipment?.includes(eq) || eq === 'none' || eq === 'bodyweight'
        );
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

  console.log(`Swap: Found ${alternatives.length} alternatives for style=${workoutStyle}`);

  // Return top 10 alternatives
  const topAlternatives = alternatives.slice(0, 10).map((ex: any) => ({
    id: ex.id,
    name: ex.name,
    primaryMuscles: ex.primary_muscles,
    secondaryMuscles: ex.secondary_muscles,
    equipmentRequired: ex.equipment_required,
    isCompound: ex.is_compound,
    difficulty: ex.difficulty,
  }));

  return new Response(
    JSON.stringify({
      success: true,
      alternatives: topAlternatives,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
