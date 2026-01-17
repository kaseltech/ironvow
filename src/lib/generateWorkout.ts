import { getSupabase } from '@/lib/supabase/client';

// Workout style determines programming approach (sets/reps/rest/structure)
export type WorkoutStyle =
  | 'traditional'  // Hypertrophy-focused, 3-4 sets x 8-12 reps, moderate rest
  | 'strength'     // 5x5 style, heavy weights, longer rest
  | 'hiit'         // High intensity intervals, minimal rest, supersets
  | 'circuit'      // Rotate through exercises with minimal rest
  | 'wod'          // CrossFit-style WOD (AMRAP, EMOM, For Time)
  | 'cardio'       // Running intervals, sprints, cardio conditioning
  | 'yoga'         // Yoga poses, flows, breathwork, flexibility
  | 'mobility'     // Stretching, foam rolling, recovery
  | 'rehab';       // Injury prevention, prehab, rehabilitation exercises

export interface WeeklyPlanDay {
  day_of_week: number; // 0=Sun, 1=Mon...6=Sat
  muscle_focus?: string[];
  workout_style?: WorkoutStyle | 'auto';
}

export interface WeeklyPlanRequest {
  userId: string;
  location: 'gym' | 'home' | 'outdoor';
  duration: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutStyle?: WorkoutStyle;
  injuries?: { bodyPart: string; movementsToAvoid: string[] }[];
  equipment?: string[];
  customEquipment?: string[];
  weeklyPlan: {
    planName: string;
    days: WeeklyPlanDay[];
  };
}

export interface GeneratedWeeklyPlan {
  id: string;
  name: string;
  days: {
    day_of_week: number;
    day_name: string;
    workout: GeneratedWorkout;
  }[];
}

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
  workoutStyle?: WorkoutStyle;
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
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  movementPatterns?: string[];
  rehabFor?: string[];
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

  console.log('[Workout] === CALLING EDGE FUNCTION ===');
  console.log('[Workout] Request:', JSON.stringify({
    userId: request.userId,
    location: request.location,
    targetMuscles: request.targetMuscles,
    duration: request.duration,
    workoutStyle: request.workoutStyle,
    freeform: !!request.freeformPrompt,
    equipmentCount: request.equipment?.length || 0,
  }, null, 2));

  // Call Supabase Edge Function
  let data, error;
  try {
    const response = await supabase.functions.invoke('generate-workout', {
      body: request,
    });
    data = response.data;
    error = response.error;
    console.log('[Workout] Raw response:', { data: !!data, error: !!error, dataKeys: data ? Object.keys(data) : [] });
  } catch (invokeError) {
    console.error('[Workout] Invoke threw exception:', invokeError);
    throw invokeError;
  }

  if (error) {
    console.error('[Workout] Edge function returned error:', error);
    console.error('[Workout] Error type:', typeof error);
    console.error('[Workout] Error stringified:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to generate workout');
  }

  if (!data) {
    console.error('[Workout] No data returned from edge function');
    throw new Error('No data returned from edge function');
  }

  console.log('[Workout] Response received:', {
    success: data?.success,
    workoutName: data?.workout?.name,
    exerciseCount: data?.workout?.exercises?.length,
    hasError: !!data?.error,
    errorMsg: data?.error,
  });

  if (!data.success) {
    console.error('[Workout] Generation failed:', data.error);
    throw new Error(data.error || 'Workout generation failed');
  }

  console.log('[Workout] === SUCCESS - Returning workout ===');
  return data.workout;
}

// Get alternative exercises for swapping
export async function getSwapAlternatives(request: SwapRequest): Promise<ExerciseAlternative[]> {
  const supabase = getSupabase();

  console.log('[Swap] === CALLING EDGE FUNCTION ===');
  console.log('[Swap] Request:', JSON.stringify({
    swapExerciseId: request.swapExerciseId,
    swapTargetMuscles: request.swapTargetMuscles,
    location: request.location,
    workoutStyle: request.workoutStyle,
    equipmentCount: request.equipment?.length || 0,
  }, null, 2));

  let data, error;
  try {
    const response = await supabase.functions.invoke('generate-workout', {
      body: request,
    });
    data = response.data;
    error = response.error;
    console.log('[Swap] Raw response:', { data: !!data, error: !!error, dataKeys: data ? Object.keys(data) : [] });
  } catch (invokeError) {
    console.error('[Swap] Invoke threw exception:', invokeError);
    throw invokeError;
  }

  if (error) {
    console.error('[Swap] Edge function returned error:', error);
    console.error('[Swap] Error stringified:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to get alternatives');
  }

  if (!data) {
    console.error('[Swap] No data returned from edge function');
    throw new Error('No data returned from edge function');
  }

  console.log('[Swap] Response received:', {
    success: data?.success,
    alternativeCount: data?.alternatives?.length,
    hasError: !!data?.error,
  });

  if (!data.success) {
    console.error('[Swap] Failed:', data.error);
    throw new Error(data.error || 'Failed to get alternatives');
  }

  console.log('[Swap] === SUCCESS - Returning', data.alternatives?.length, 'alternatives ===');
  return data.alternatives;
}

// Generate a weekly workout plan
export async function generateWeeklyPlan(request: WeeklyPlanRequest): Promise<GeneratedWeeklyPlan> {
  const supabase = getSupabase();

  console.log('[WeeklyPlan] Calling Edge Function...', {
    planName: request.weeklyPlan.planName,
    dayCount: request.weeklyPlan.days.length,
    location: request.location,
    duration: request.duration,
  });

  const { data, error } = await supabase.functions.invoke('generate-workout', {
    body: request,
  });

  if (error) {
    console.error('[WeeklyPlan] Edge function error:', error);
    throw new Error(error.message || 'Failed to generate weekly plan');
  }

  console.log('[WeeklyPlan] Response:', {
    success: data?.success,
    planName: data?.plan?.name,
    dayCount: data?.plan?.days?.length,
  });

  if (!data.success) {
    console.error('[WeeklyPlan] Generation failed:', data.error);
    throw new Error(data.error || 'Weekly plan generation failed');
  }

  return data.plan;
}

// NO LOCAL FALLBACK - All workout generation must go through the edge function.
// If the edge function fails, show an error to the user instead of generating garbage.
