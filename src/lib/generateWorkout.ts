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
  includeWarmup?: boolean; // Include warm-up stretches (default true)
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

// User's personal record for an exercise
export interface UserPR {
  exerciseId: string;
  exerciseName: string;
  prWeight: number;
  prReps: number;
  estimated1RM: number;
  achievedAt: string;
}

// Recent training data for smart suggestions
export interface RecentTraining {
  musclesTrained: string[];
  lastWorkoutDate: string;
  weeklyVolume: number;
  suggestDeload: boolean;
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
  includeWarmup?: boolean; // Include warm-up stretches (default true)
  // Progress data for personalization
  userPRs?: UserPR[]; // User's personal records for weight suggestions
  recentTraining?: RecentTraining; // Recent training for recovery-aware programming
  intensityLevel?: 'deload' | 'light' | 'normal' | 'heavy'; // Override default intensity
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
  swapRequestAI?: boolean; // Force AI suggestions (for "Load More" button)
  swapExcludeIds?: string[]; // Exercise IDs already shown (to avoid duplicates)
}

export interface ExerciseAlternative {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipmentRequired: string[];
  isCompound: boolean;
  difficulty: string;
  source?: 'database' | 'ai_pending';
}

// Equipment types for swap toggle
export type EquipmentType = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'smith machine' | 'kettlebell' | 'bodyweight' | 'band';

// Detect equipment type from exercise name
export function getEquipmentFromName(name: string): EquipmentType | null {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('smith machine')) return 'smith machine';
  if (lowerName.includes('barbell') || lowerName.includes('bar ')) return 'barbell';
  if (lowerName.includes('dumbbell') || lowerName.startsWith('db ') || lowerName.includes(' db ')) return 'dumbbell';
  if (lowerName.includes('cable')) return 'cable';
  if (lowerName.includes('machine')) return 'machine';
  if (lowerName.includes('kettlebell') || lowerName.includes('kb ')) return 'kettlebell';
  if (lowerName.includes('band') || lowerName.includes('resistance')) return 'band';
  if (lowerName.includes('bodyweight') || lowerName.includes('body weight')) return 'bodyweight';

  return null;
}

// Extract base movement from exercise name (remove equipment from anywhere in name)
// Handles: "Barbell Bench Press" -> "Bench Press"
// Handles: "Incline Barbell Bench Press" -> "Incline Bench Press"
// Handles: "Seated Dumbbell Shoulder Press" -> "Seated Shoulder Press"
export function getBaseMovement(name: string): string {
  const equipmentWords = [
    'smith machine',
    'barbell',
    'dumbbell',
    'dumbbells',
    'db',
    'cable',
    'machine',
    'kettlebell',
    'kettlebells',
    'kb',
    'band',
    'resistance band',
    'bodyweight',
    'ez-bar',
    'ez bar',
  ];

  let base = name;

  // Remove equipment words from anywhere in the name
  for (const equip of equipmentWords) {
    // Create regex to match the equipment word with word boundaries
    // Case insensitive, matches whole words only
    const regex = new RegExp(`\\b${equip}\\b\\s*`, 'gi');
    base = base.replace(regex, '');
  }

  // Clean up any double spaces and trim
  return base.replace(/\s+/g, ' ').trim();
}

// Build exercise name with equipment
export function buildExerciseName(baseMovement: string, equipment: EquipmentType): string {
  if (equipment === 'bodyweight') return baseMovement;
  if (equipment === 'smith machine') return `Smith Machine ${baseMovement}`;

  // Capitalize equipment
  const equipCapitalized = equipment.charAt(0).toUpperCase() + equipment.slice(1);
  return `${equipCapitalized} ${baseMovement}`;
}

// Request to find equipment variants
export interface EquipmentVariantRequest {
  userId: string;
  exerciseName: string;
  baseMovement: string;
  currentEquipment: EquipmentType | null;
  targetEquipment: EquipmentType;
  location: 'gym' | 'home' | 'outdoor';
  generateIfMissing?: boolean; // Use AI to generate if not in DB
}

export interface EquipmentVariant {
  equipment: EquipmentType;
  exerciseId: string | null; // null if needs to be generated
  exerciseName: string;
  inDatabase: boolean;
}

// Find equipment variant of an exercise
export async function findEquipmentVariant(request: EquipmentVariantRequest): Promise<ExerciseAlternative | null> {
  const supabase = getSupabase();

  const targetName = buildExerciseName(request.baseMovement, request.targetEquipment);

  // Search for the variant in database
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`name.ilike.%${targetName}%,name.ilike.%${request.targetEquipment}%${request.baseMovement}%`)
    .limit(10);

  if (exercises && exercises.length > 0) {
    // Find best match
    const exactMatch = exercises.find(
      (ex: any) => ex.name.toLowerCase() === targetName.toLowerCase()
    );
    const partialMatch = exercises.find((ex: any) =>
      ex.name.toLowerCase().includes(request.baseMovement.toLowerCase()) &&
      ex.name.toLowerCase().includes(request.targetEquipment.toLowerCase())
    );

    const match = exactMatch || partialMatch;
    if (match) {
      return {
        id: match.id,
        name: match.name,
        primaryMuscles: match.primary_muscles || [],
        secondaryMuscles: match.secondary_muscles || [],
        equipmentRequired: match.equipment_required || [],
        isCompound: match.is_compound || false,
        difficulty: match.difficulty || 'intermediate',
        source: 'database',
      };
    }
  }

  // Not found - generate with AI if requested
  if (request.generateIfMissing) {
    // Call edge function to generate and add to pending
    const { data, error } = await supabase.functions.invoke('generate-workout', {
      body: {
        generateEquipmentVariant: true,
        exerciseName: request.exerciseName,
        baseMovement: request.baseMovement,
        targetEquipment: request.targetEquipment,
        location: request.location,
        userId: request.userId,
      },
    });

    if (!error && data?.success && data?.exercise) {
      return {
        id: data.exercise.id,
        name: data.exercise.name,
        primaryMuscles: data.exercise.primary_muscles || [],
        secondaryMuscles: data.exercise.secondary_muscles || [],
        equipmentRequired: data.exercise.equipment_required || [],
        isCompound: data.exercise.is_compound || false,
        difficulty: data.exercise.difficulty || 'intermediate',
        source: 'ai_pending',
      };
    }
  }

  return null;
}

// Get available equipment variants for an exercise
export async function getAvailableEquipmentVariants(
  exerciseName: string
): Promise<Map<EquipmentType, string>> {
  const supabase = getSupabase();
  const baseMovement = getBaseMovement(exerciseName);
  const variants = new Map<EquipmentType, string>();

  // Search for all variants of this base movement
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', `%${baseMovement}%`)
    .limit(50);

  if (exercises) {
    for (const ex of exercises) {
      const equipment = getEquipmentFromName(ex.name);
      if (equipment && !variants.has(equipment)) {
        variants.set(equipment, ex.id);
      }
    }
  }

  return variants;
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

export interface WarmupExercise {
  exerciseId: string;
  name: string;
  duration: number; // seconds to hold/perform
  notes?: string;
  primaryMuscles?: string[];
}

export interface GeneratedWorkout {
  id?: string;
  name: string;
  description: string;
  duration: number;
  exercises: GeneratedExercise[];
  warmup?: WarmupExercise[]; // Optional warm-up stretches
  workoutType: string;
  workoutStyle?: WorkoutStyle;
  targetMuscles: string[];
}

export async function generateWorkout(request: WorkoutRequest): Promise<GeneratedWorkout> {
  const supabase = getSupabase();

  console.log('[Workout] === CALLING EDGE FUNCTION ===');
  console.log('[Workout] Full request:', JSON.stringify(request, null, 2));

  // Call Supabase Edge Function
  let data, error;
  try {
    const response = await supabase.functions.invoke('generate-workout', {
      body: request,
    });
    data = response.data;
    error = response.error;

    console.log('[Workout] Response received');
    console.log('[Workout] Has data:', !!data);
    console.log('[Workout] Has error:', !!error);

    if (data) {
      console.log('[Workout] Data keys:', Object.keys(data));
      console.log('[Workout] Data.success:', data.success);
      console.log('[Workout] Data.error:', data.error);
    }

    if (error) {
      console.log('[Workout] Error object:', JSON.stringify(error, null, 2));
      console.log('[Workout] Error.message:', error.message);
      console.log('[Workout] Error.context:', (error as any).context);
      console.log('[Workout] Error.status:', (error as any).status);
    }
  } catch (invokeError: any) {
    console.error('[Workout] Invoke threw exception:', invokeError);
    console.error('[Workout] Exception message:', invokeError?.message);
    console.error('[Workout] Exception stack:', invokeError?.stack);
    throw new Error(`Edge function invoke failed: ${invokeError?.message || 'Unknown error'}`);
  }

  if (error) {
    // Try to get more details from the error
    const errorDetails = (error as any).context?.body || (error as any).details || error.message;
    console.error('[Workout] Error details:', errorDetails);
    throw new Error(error.message || 'Failed to generate workout');
  }

  if (!data) {
    throw new Error('No data returned from edge function');
  }

  if (!data.success) {
    console.error('[Workout] Generation failed:', data.error);
    throw new Error(data.error || 'Workout generation failed');
  }

  console.log('[Workout] === SUCCESS ===');
  console.log('[Workout] Workout name:', data.workout?.name);
  console.log('[Workout] Exercise count:', data.workout?.exercises?.length);

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
