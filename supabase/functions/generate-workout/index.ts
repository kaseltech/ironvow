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
    const { userId, location, targetMuscles, duration, experienceLevel, injuries, equipment, customEquipment } = body;

    // Combine standard and custom equipment
    const allEquipment = [...(equipment || []), ...(customEquipment || [])];

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

      // Check if we have required equipment (skip for gym)
      const hasEquipment = location === 'gym' || !ex.equipment_required?.length ||
        ex.equipment_required.every((eq: string) =>
          allEquipment?.includes(eq) || eq === 'none' || eq === 'bodyweight'
        );

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

    // If we have Anthropic API key, use AI for intelligent selection
    // Otherwise, use rule-based selection
    let workout: GeneratedWorkout;

    if (anthropicKey && filteredExercises.length > 0) {
      workout = await generateWithAI(
        anthropicKey,
        filteredExercises,
        targetMuscles,
        duration,
        experienceLevel,
        location,
        injuries,
        allEquipment
      );
    } else {
      workout = generateRuleBased(
        filteredExercises,
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
    isCompound: ex.is_compound,
    difficulty: ex.difficulty,
  }));

  // Build injury context for the prompt
  let injuryContext = '';
  if (injuries && injuries.length > 0) {
    const injuryDescriptions = injuries.map(i =>
      `${i.bodyPart}${i.movementsToAvoid?.length ? ` (avoid: ${i.movementsToAvoid.join(', ')})` : ''}`
    ).join('; ');
    injuryContext = `\n\nIMPORTANT - User has injuries/limitations: ${injuryDescriptions}. Avoid exercises that could aggravate these areas. Provide safer alternatives when possible.`;
  }

  // Build equipment context
  let equipmentContext = '';
  if (equipment && equipment.length > 0) {
    equipmentContext = `\n\nAvailable equipment: ${equipment.join(', ')}. Prioritize exercises that use this equipment.`;
  }

  const prompt = `You are a certified personal trainer creating a workout plan. Generate an optimal ${duration}-minute workout for a ${experienceLevel} level individual at a ${location}, targeting these muscles: ${targetMuscles.join(', ')}.${injuryContext}${equipmentContext}

Available exercises (JSON):
${JSON.stringify(exerciseList, null, 2)}

Rules:
- Select 4-8 exercises depending on duration
- Start with compound movements, end with isolation
- Include appropriate sets (2-4 for beginners, 3-5 for intermediate/advanced)
- Rep ranges: strength (3-6), hypertrophy (8-12), endurance (12-15+)
- Rest periods: compound exercises 90-120s, isolation 60-90s
- Balance pushing and pulling movements when applicable
- If user has injuries, prioritize exercises that work around those limitations

Return ONLY valid JSON in this exact format:
{
  "name": "Workout name",
  "description": "Brief description",
  "workoutType": "push|pull|legs|upper|lower|fullbody",
  "exercises": [
    {
      "exerciseId": "uuid from available exercises",
      "name": "Exercise Name",
      "sets": 3,
      "reps": "8-10",
      "restSeconds": 90,
      "notes": "optional form tips"
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
