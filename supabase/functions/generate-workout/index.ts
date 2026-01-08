import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkoutRequest {
  userId: string;
  location: 'gym' | 'home' | 'outdoor';
  targetMuscles: string[];
  duration: number; // minutes
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[];
  equipment?: string[];
  customEquipment?: string[];
  gymName?: string;
  excludeExerciseIds?: string[]; // For regenerating - exclude previous exercises
  swapExerciseId?: string; // For swapping - find alternatives for this exercise
  swapTargetMuscles?: string[]; // Muscles the swapped exercise should target
}

interface GeneratedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restSeconds: number;
  notes?: string;
}

interface GeneratedWorkout {
  name: string;
  description: string;
  duration: number;
  exercises: GeneratedExercise[];
  workoutType: string;
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
    const { userId, location, targetMuscles: rawTargetMuscles, duration, experienceLevel, injuries, equipment, customEquipment, excludeExerciseIds, swapExerciseId, swapTargetMuscles: rawSwapMuscles } = body;

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
        // Outdoor: ONLY bodyweight exercises (no equipment or bodyweight only)
        const equipReq = ex.equipment_required || [];
        hasEquipment = equipReq.length === 0 ||
          equipReq.every((eq: string) =>
            eq === 'none' || eq === 'bodyweight' || eq === 'pull-up bar' || eq === 'bench'
          );
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

    // If we have Anthropic API key, use AI for intelligent selection
    // Otherwise, use rule-based selection
    let workout: GeneratedWorkout;

    if (anthropicKey && availableExercises.length > 0) {
      workout = await generateWithAI(
        anthropicKey,
        availableExercises,
        targetMuscles,
        duration,
        experienceLevel,
        location,
        injuries,
        allEquipment
      );
    } else {
      workout = generateRuleBased(
        availableExercises,
        targetMuscles,
        duration,
        experienceLevel
      );
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
    console.error('Error generating workout:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateWithAI(
  apiKey: string,
  exercises: any[],
  targetMuscles: string[],
  duration: number,
  experienceLevel: string,
  location: string,
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[],
  equipment?: string[]
): Promise<GeneratedWorkout> {
  const exerciseList = exercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    primaryMuscles: ex.primary_muscles,
    secondaryMuscles: ex.secondary_muscles,
    equipmentRequired: ex.equipment_required,
    isCompound: ex.is_compound,
    difficulty: ex.difficulty,
  }));

  // Build location-specific context
  let locationContext = '';
  if (location === 'outdoor') {
    locationContext = `\n\nLOCATION: OUTDOOR (park, trail, or outdoor space)
- ONLY use bodyweight exercises or exercises that need no equipment
- Good outdoor exercises: push-ups, pull-ups (if bar available), dips (bench/bars), lunges, squats, burpees, mountain climbers, planks, running, sprints
- DO NOT include exercises requiring: dumbbells, barbells, machines, cables, or gym equipment
- If an exercise needs equipment, SKIP IT`;
  } else if (location === 'home') {
    locationContext = `\n\nLOCATION: HOME GYM
- Only use exercises that require the listed equipment or no equipment
- If no equipment listed, stick to bodyweight exercises`;
  } else if (location === 'gym') {
    locationContext = `\n\nLOCATION: GYM${equipment && equipment.length > 0 ? ` with specific equipment` : ' (commercial gym - full equipment assumed)'}`;
  }

  // Build equipment context
  let equipmentContext = '';
  if (equipment && equipment.length > 0) {
    equipmentContext = `\nAvailable equipment: ${equipment.join(', ')}. ONLY use exercises that require this equipment or no equipment.`;
  } else if (location === 'outdoor') {
    equipmentContext = `\nNo equipment available - bodyweight only.`;
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
    ? `Focus EXCLUSIVELY on ${targetMuscles[0]} - every exercise must target this muscle as primary or secondary.`
    : targetMuscles.length <= 3
    ? `Focus on these specific muscles: ${targetMuscles.join(', ')}. Every exercise must target at least one of these muscles.`
    : `Full body workout targeting: ${targetMuscles.join(', ')}. Include exercises for each muscle group.`;

  const prompt = `You are a certified personal trainer. Create a ${duration}-minute ${experienceLevel}-level workout.

TARGET MUSCLES: ${muscleEmphasis}${locationContext}${equipmentContext}${injuryContext}

Available exercises from database (ONLY select from this list):
${JSON.stringify(exerciseList, null, 2)}

STRICT RULES:
1. ONLY select exercises from the provided list above - use exact exerciseId values
2. Select 4-8 exercises depending on duration (roughly 1 exercise per 5-8 minutes)
3. Every exercise MUST target at least one of the specified muscles: ${targetMuscles.join(', ')}
4. For outdoor: ONLY bodyweight exercises (no equipment)
5. Start with compound movements, end with isolation
6. Sets: 2-4 for beginners, 3-5 for intermediate/advanced
7. Rest: compound 90-120s, isolation 60-90s

Return ONLY valid JSON:
{
  "name": "Descriptive workout name",
  "description": "Brief description mentioning target muscles",
  "workoutType": "push|pull|legs|upper|lower|fullbody",
  "exercises": [
    {
      "exerciseId": "exact uuid from list above",
      "name": "Exercise Name",
      "sets": 3,
      "reps": "8-10",
      "restSeconds": 90,
      "notes": "form tip"
    }
  ]
}`;

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
    throw new Error('AI generation failed, falling back to rule-based');
  }

  const aiResponse = await response.json();
  const content = aiResponse.content[0]?.text || '';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    name: parsed.name,
    description: parsed.description,
    duration,
    workoutType: parsed.workoutType,
    targetMuscles,
    exercises: parsed.exercises,
  };
}

function generateRuleBased(
  exercises: any[],
  targetMuscles: string[],
  duration: number,
  experienceLevel: string
): GeneratedWorkout {
  // Determine number of exercises based on duration
  const exerciseCount = Math.min(Math.floor(duration / 8), 8);

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

  // Select exercises: 60% compound, 40% isolation
  const compoundCount = Math.ceil(exerciseCount * 0.6);
  const isolationCount = exerciseCount - compoundCount;

  const selectedExercises = [
    ...compounds.slice(0, compoundCount),
    ...isolations.slice(0, isolationCount),
  ];

  // Determine sets and reps based on experience
  const getSetsReps = (isCompound: boolean) => {
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
  };

  // Determine workout name
  const workoutType = determineWorkoutType(targetMuscles);
  const workoutName = generateWorkoutName(workoutType, experienceLevel);

  return {
    name: workoutName,
    description: `${exerciseCount} exercises targeting ${targetMuscles.join(', ')}`,
    duration,
    workoutType,
    targetMuscles,
    exercises: selectedExercises.map(ex => {
      const { sets, reps, rest } = getSetsReps(ex.is_compound);
      return {
        exerciseId: ex.id,
        name: ex.name,
        sets,
        reps,
        restSeconds: rest,
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

function generateWorkoutName(type: string, level: string): string {
  const typeNames: Record<string, string> = {
    push: 'Push Power',
    pull: 'Pull Strength',
    legs: 'Leg Day',
    upper: 'Upper Body',
    lower: 'Lower Body',
    fullbody: 'Full Body Blast',
  };

  const levelPrefix: Record<string, string> = {
    beginner: 'Foundation',
    intermediate: 'Progressive',
    advanced: 'Intense',
  };

  return `${levelPrefix[level] || ''} ${typeNames[type] || 'Workout'}`.trim();
}

// Handle swap request - find alternative exercises for a given exercise
async function handleSwapRequest(
  body: WorkoutRequest,
  supabase: any,
  allEquipment: string[],
  expandedSwapMuscles: string[]
): Promise<Response> {
  const { location, swapExerciseId, injuries, experienceLevel } = body;
  const swapTargetMuscles = expandedSwapMuscles;

  // Fetch all exercises
  const { data: exercises, error } = await supabase.from('exercises').select('*');

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch exercises' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Filter to exercises that target the same muscles
  const alternatives = exercises.filter((ex: any) => {
    // Don't include the exercise we're swapping
    if (ex.id === swapExerciseId) return false;

    // Must target at least one of the same muscles
    const targetsMuscle = swapTargetMuscles?.some(
      (muscle: string) => ex.primary_muscles?.includes(muscle) || ex.secondary_muscles?.includes(muscle)
    );
    if (!targetsMuscle) return false;

    // Check equipment based on location
    let hasEquipment = false;
    if (location === 'outdoor') {
      const equipReq = ex.equipment_required || [];
      hasEquipment = equipReq.length === 0 ||
        equipReq.every((eq: string) =>
          eq === 'none' || eq === 'bodyweight' || eq === 'pull-up bar' || eq === 'bench'
        );
    } else if (location === 'gym') {
      if (allEquipment && allEquipment.length > 0) {
        const equipReq = ex.equipment_required || [];
        hasEquipment = equipReq.length === 0 ||
          equipReq.every((eq: string) =>
            allEquipment.includes(eq) || eq === 'none' || eq === 'bodyweight'
          );
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

  // Sort by how well they match the target muscles (primary muscle match first)
  alternatives.sort((a: any, b: any) => {
    const aPrimaryMatch = swapTargetMuscles?.some((m: string) => a.primary_muscles?.includes(m)) ? 1 : 0;
    const bPrimaryMatch = swapTargetMuscles?.some((m: string) => b.primary_muscles?.includes(m)) ? 1 : 0;
    return bPrimaryMatch - aPrimaryMatch;
  });

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
