// Infer muscles from exercise name when no metadata is available
export function inferMusclesFromName(name: string): string[] {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('bench') || lowerName.includes('chest') || lowerName.includes('push')) {
    return ['chest', 'triceps', 'shoulders'];
  } else if (lowerName.includes('row') || lowerName.includes('pull') || lowerName.includes('lat')) {
    return ['back', 'biceps'];
  } else if (lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('lunge')) {
    return ['quads', 'glutes', 'hamstrings'];
  } else if (lowerName.includes('deadlift') || lowerName.includes('hip')) {
    return ['hamstrings', 'glutes', 'back'];
  } else if (lowerName.includes('shoulder') || lowerName.includes('press') || lowerName.includes('delt')) {
    return ['shoulders', 'triceps'];
  } else if (lowerName.includes('curl') || lowerName.includes('bicep')) {
    return ['biceps'];
  } else if (lowerName.includes('tricep') || lowerName.includes('extension')) {
    return ['triceps'];
  } else if (lowerName.includes('core') || lowerName.includes('ab') || lowerName.includes('plank')) {
    return ['abs', 'core'];
  } else if (lowerName.includes('calf') || lowerName.includes('calves')) {
    return ['calves'];
  } else if (lowerName.includes('glute') || lowerName.includes('hip thrust')) {
    return ['glutes'];
  }

  // Default fallback
  return ['chest', 'back', 'shoulders'];
}

// Build target muscles for swap from exercise and workout context
export function buildTargetMuscles(
  exercise: {
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    name: string;
  },
  workoutTargetMuscles?: string[]
): string[] {
  // Start with primary muscles if available
  let muscles: string[] = exercise.primaryMuscles || [];

  // If no primary muscles, try secondary
  if (muscles.length === 0 && exercise.secondaryMuscles) {
    muscles = exercise.secondaryMuscles;
  }

  // If still no muscles, use workout-level targets
  if (muscles.length === 0 && workoutTargetMuscles) {
    muscles = workoutTargetMuscles;
  }

  // Final fallback: infer from name
  if (muscles.length === 0) {
    muscles = inferMusclesFromName(exercise.name);
  }

  return muscles;
}
