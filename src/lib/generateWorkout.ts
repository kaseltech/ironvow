import { getSupabase } from '@/lib/supabase/client';

// Workout style determines programming approach (sets/reps/rest/structure)
export type WorkoutStyle =
  | 'traditional'  // Hypertrophy-focused, 3-4 sets x 8-12 reps, moderate rest
  | 'strength'     // 5x5 style, heavy weights, longer rest
  | 'hiit'         // High intensity intervals, minimal rest, supersets
  | 'circuit'      // Rotate through exercises with minimal rest
  | 'wod'          // CrossFit-style WOD (AMRAP, EMOM, For Time)
  | 'cardio'       // Running intervals, sprints, cardio conditioning
  | 'mobility';    // Stretching, foam rolling, recovery

export interface WorkoutRequest {
  userId: string;
  location: 'gym' | 'home' | 'outdoor';
  targetMuscles: string[];
  duration: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutStyle?: WorkoutStyle; // Determines training approach
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[];
  equipment?: string[];
  customEquipment?: string[];
  gymName?: string;
  excludeExerciseIds?: string[]; // For regenerating - exclude previous exercises
  freeformPrompt?: string; // User's custom description for AI-powered generation
}

export interface SwapRequest {
  userId: string;
  location: 'gym' | 'home' | 'outdoor';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[];
  equipment?: string[];
  customEquipment?: string[];
  swapExerciseId: string;
  swapTargetMuscles: string[];
}

export interface ExerciseAlternative {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipmentRequired: string[];
  isCompound: boolean;
  difficulty: string;
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restSeconds: number;
  notes?: string;
}

export interface GeneratedWorkout {
  id?: string;
  name: string;
  description: string;
  duration: number;
  exercises: GeneratedExercise[];
  workoutType: string;
  workoutStyle?: WorkoutStyle;
  targetMuscles: string[];
}

export async function generateWorkout(request: WorkoutRequest): Promise<GeneratedWorkout> {
  const supabase = getSupabase();

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('generate-workout', {
    body: request,
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to generate workout');
  }

  if (!data.success) {
    throw new Error(data.error || 'Workout generation failed');
  }

  return data.workout;
}

// Get alternative exercises for swapping
export async function getSwapAlternatives(request: SwapRequest): Promise<ExerciseAlternative[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.functions.invoke('generate-workout', {
    body: request,
  });

  if (error) {
    console.error('Swap request error:', error);
    throw new Error(error.message || 'Failed to get alternatives');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to get alternatives');
  }

  return data.alternatives;
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

function expandMuscles(muscles: string[]): string[] {
  const expanded = new Set<string>();
  for (const muscle of muscles) {
    if (muscleMapping[muscle]) {
      muscleMapping[muscle].forEach(m => expanded.add(m));
    } else {
      expanded.add(muscle);
    }
  }
  return Array.from(expanded);
}

// Fallback: Generate workout client-side without AI
// This is used when edge function is not deployed or unavailable
export async function generateWorkoutLocal(request: WorkoutRequest): Promise<GeneratedWorkout> {
  const supabase = getSupabase();

  // Fetch exercises from database
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*');

  if (error || !exercises) {
    throw new Error('Failed to fetch exercises');
  }

  const { location, targetMuscles: rawTargetMuscles, duration, experienceLevel, workoutStyle = 'traditional', injuries, equipment } = request;

  // Expand muscle groups to specific muscles
  const targetMuscles = expandMuscles(rawTargetMuscles);

  // Filter exercises
  const filteredExercises = exercises.filter((ex) => {
    // Check if exercise targets any desired muscles
    const targetsMuscle = targetMuscles.some(
      muscle => ex.primary_muscles?.includes(muscle) || ex.secondary_muscles?.includes(muscle)
    );

    // Check equipment availability
    const hasEquipment = location === 'gym' || !ex.equipment_required?.length ||
      ex.equipment_required.every((eq: string) =>
        equipment?.includes(eq) || eq === 'none' || eq === 'bodyweight'
      );

    // Check difficulty
    const appropriateDifficulty = !ex.difficulty ||
      (experienceLevel === 'beginner' && ex.difficulty !== 'advanced') ||
      (experienceLevel === 'intermediate') ||
      (experienceLevel === 'advanced');

    // Check for injuries
    const avoidDueToInjury = injuries?.some(injury =>
      injury.movementsToAvoid?.some(movement =>
        ex.name.toLowerCase().includes(movement.toLowerCase()) ||
        ex.movement_pattern?.toLowerCase().includes(movement.toLowerCase())
      )
    );

    return targetsMuscle && hasEquipment && appropriateDifficulty && !avoidDueToInjury;
  });

  // Determine exercise count based on duration
  const exerciseCount = Math.min(Math.floor(duration / 8), 8);

  // Separate compound and isolation
  const compounds = filteredExercises.filter(ex => ex.is_compound);
  const isolations = filteredExercises.filter(ex => !ex.is_compound);

  // Sort by relevance to target muscles
  const sortByRelevance = (list: typeof exercises) => {
    return list.sort((a, b) => {
      const aMatch = targetMuscles.filter(m => a.primary_muscles?.includes(m)).length;
      const bMatch = targetMuscles.filter(m => b.primary_muscles?.includes(m)).length;
      return bMatch - aMatch;
    });
  };

  sortByRelevance(compounds);
  sortByRelevance(isolations);

  // Select exercises: prioritize compounds
  const compoundCount = Math.ceil(exerciseCount * 0.6);
  const isolationCount = exerciseCount - compoundCount;

  const selectedExercises = [
    ...compounds.slice(0, compoundCount),
    ...isolations.slice(0, isolationCount),
  ];

  // If no exercises found, return fallback
  if (selectedExercises.length === 0) {
    return getFallbackWorkout(targetMuscles, duration, experienceLevel);
  }

  // Determine sets/reps based on workout style and experience
  const getSetsReps = (isCompound: boolean, movementPattern?: string): { sets: number; reps: string; rest: number } => {
    switch (workoutStyle) {
      case 'strength':
        // 5x5 style - heavy, low reps, long rest
        return { sets: 5, reps: '5', rest: isCompound ? 180 : 120 };

      case 'hiit':
        // High intensity - more reps, minimal rest
        return { sets: 3, reps: '12-15', rest: 30 };

      case 'circuit':
        // Circuit - moderate reps, very short rest
        return { sets: 3, reps: '10-12', rest: 15 };

      case 'wod':
        // CrossFit style - varies, but typically higher volume
        return { sets: 3, reps: isCompound ? '10-15' : '15-20', rest: 60 };

      case 'cardio':
        // Cardio exercises use time or distance
        return { sets: 1, reps: movementPattern === 'cardio' ? '5-10 min' : '30-60s', rest: 60 };

      case 'mobility':
        // Mobility exercises use holds
        return { sets: 2, reps: '30-60s hold', rest: 15 };

      case 'traditional':
      default:
        // Traditional hypertrophy - varies by experience
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

  // Determine workout type and name
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

  // Combine parts, filtering out empty strings
  const parts = [styleName, levelName, typeName].filter(Boolean);
  return parts.join(' ').trim();
}

// Fallback workout when no exercises match in database
function getFallbackWorkout(
  targetMuscles: string[],
  duration: number,
  experienceLevel: string
): GeneratedWorkout {
  const workoutType = determineWorkoutType(targetMuscles);
  const workoutName = generateWorkoutName(workoutType, experienceLevel);

  // Standard fallback exercises based on workout type
  const fallbackExercises: Record<string, GeneratedExercise[]> = {
    push: [
      { exerciseId: '', name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Overhead Press', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 75 },
      { exerciseId: '', name: 'Lateral Raises', sets: 3, reps: '12-15', restSeconds: 60 },
      { exerciseId: '', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 60 },
    ],
    pull: [
      { exerciseId: '', name: 'Pull-ups', sets: 4, reps: '6-10', restSeconds: 90 },
      { exerciseId: '', name: 'Barbell Rows', sets: 4, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Face Pulls', sets: 3, reps: '12-15', restSeconds: 60 },
      { exerciseId: '', name: 'Lat Pulldowns', sets: 3, reps: '10-12', restSeconds: 75 },
      { exerciseId: '', name: 'Bicep Curls', sets: 3, reps: '10-12', restSeconds: 60 },
    ],
    legs: [
      { exerciseId: '', name: 'Squats', sets: 4, reps: '8-10', restSeconds: 120 },
      { exerciseId: '', name: 'Romanian Deadlifts', sets: 3, reps: '10-12', restSeconds: 90 },
      { exerciseId: '', name: 'Leg Press', sets: 3, reps: '10-12', restSeconds: 90 },
      { exerciseId: '', name: 'Leg Curls', sets: 3, reps: '12-15', restSeconds: 60 },
      { exerciseId: '', name: 'Calf Raises', sets: 4, reps: '15-20', restSeconds: 60 },
    ],
    upper: [
      { exerciseId: '', name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Pull-ups', sets: 3, reps: '6-10', restSeconds: 90 },
      { exerciseId: '', name: 'Overhead Press', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Barbell Rows', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Dips', sets: 3, reps: 'AMRAP', restSeconds: 75 },
    ],
    lower: [
      { exerciseId: '', name: 'Squats', sets: 4, reps: '8-10', restSeconds: 120 },
      { exerciseId: '', name: 'Deadlifts', sets: 3, reps: '6-8', restSeconds: 120 },
      { exerciseId: '', name: 'Walking Lunges', sets: 3, reps: '12 each', restSeconds: 90 },
      { exerciseId: '', name: 'Leg Press', sets: 3, reps: '10-12', restSeconds: 90 },
      { exerciseId: '', name: 'Calf Raises', sets: 4, reps: '15-20', restSeconds: 60 },
    ],
    fullbody: [
      { exerciseId: '', name: 'Squats', sets: 3, reps: '8-10', restSeconds: 120 },
      { exerciseId: '', name: 'Bench Press', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Barbell Rows', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Overhead Press', sets: 3, reps: '8-10', restSeconds: 90 },
      { exerciseId: '', name: 'Romanian Deadlifts', sets: 3, reps: '10-12', restSeconds: 90 },
      { exerciseId: '', name: 'Pull-ups', sets: 3, reps: 'AMRAP', restSeconds: 90 },
    ],
  };

  const exercises = fallbackExercises[workoutType] || fallbackExercises.fullbody;

  // Adjust for duration
  const maxExercises = Math.floor(duration / 8);
  const selectedExercises = exercises.slice(0, maxExercises);

  return {
    name: workoutName,
    description: `${selectedExercises.length} exercises targeting ${targetMuscles.join(', ')}`,
    duration,
    workoutType,
    targetMuscles,
    exercises: selectedExercises,
  };
}
