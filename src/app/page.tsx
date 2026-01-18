'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { Onboarding } from '@/components/Onboarding';
import { PrimaryContext } from '@/components/PrimaryContext';
import { MuscleSelector } from '@/components/MuscleSelector';
import { TrainingStyleSelector } from '@/components/TrainingStyleSelector';
import { AdvancedOptions } from '@/components/AdvancedOptions';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProfile, useInjuries, useEquipment, useGymProfiles } from '@/hooks/useSupabase';
import { useWorkoutPlans, DAY_NAMES_FULL } from '@/hooks/useWorkoutPlans';
import { generateWorkout, getSwapAlternatives, generateWeeklyPlan, type GeneratedWorkout, type GeneratedExercise, type ExerciseAlternative, type WorkoutStyle, type WeeklyPlanDay, type GeneratedWeeklyPlan } from '@/lib/generateWorkout';
import { WeeklyPlanner } from '@/components/WeeklyPlanner';
import { WeeklyPlanReview } from '@/components/WeeklyPlanReview';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { Settings } from '@/components/Settings';
import { GymManager } from '@/components/GymManager';
import { FlexTimerModal } from '@/components/FlexTimer';
import type { GymProfile } from '@/lib/supabase/types';

// Location icons for workout display
const locationIcons: Record<string, string> = {
  gym: '🏋️',
  home: '🏠',
  outdoor: '🌳',
};

// Workout style names for display
const workoutStyleNames: Record<WorkoutStyle, string> = {
  traditional: 'Traditional',
  strength: 'Strength (5×5)',
  hiit: 'HIIT',
  circuit: 'Circuit',
  wod: 'WOD',
  cardio: 'Cardio',
  yoga: 'Yoga',
  mobility: 'Mobility',
  rehab: 'Rehab/Prehab',
};

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const { profile, loading: profileLoading, isProfileComplete, refetch: refetchProfile } = useProfile();
  const { injuries } = useInjuries();
  const { userEquipment, allEquipment } = useEquipment();
  const { profiles: gymProfiles, getDefaultProfile, refetch: refetchGymProfiles } = useGymProfiles();
  const { activePlan, getTodaysWorkout, fetchPlans: refetchPlans } = useWorkoutPlans();

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedGym, setSelectedGym] = useState<GymProfile | null>(null);
  const [showGymManager, setShowGymManager] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedWorkoutStyle, setSelectedWorkoutStyle] = useState<WorkoutStyle>('traditional');
  const [duration, setDuration] = useState(45);
  const [showWorkout, setShowWorkout] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [debugInfo, setDebugInfo] = useState<object | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [swappingExerciseIndex, setSwappingExerciseIndex] = useState<number | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [loadingMoreAlternatives, setLoadingMoreAlternatives] = useState(false);
  const [lastWorkoutRequest, setLastWorkoutRequest] = useState<object | null>(null);
  // Track recently generated exercises to avoid duplicates on fresh generates
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
  // Freeform AI input
  const [freeformMode, setFreeformMode] = useState(false);
  const [freeformPrompt, setFreeformPrompt] = useState('');
  // Weekly planner mode
  const [weeklyMode, setWeeklyMode] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWeeklyPlan | null>(null);
  const [showPlanReview, setShowPlanReview] = useState(false);
  const [lastWeeklyRequest, setLastWeeklyRequest] = useState<{ days: WeeklyPlanDay[]; planName: string } | null>(null);
  // Exercise detail modal
  const [showExerciseDetail, setShowExerciseDetail] = useState<string | null>(null);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!user || !selectedLocation) return;

    setGenerating(true);
    setError(null);

    try {
      // Get equipment based on location
      let locationEquipment: string[] = [];
      let customEquipmentList: string[] = profile?.custom_equipment || [];

      if (selectedLocation === 'gym' && selectedGym) {
        // Use selected gym's equipment
        locationEquipment = selectedGym.equipment_ids
          .map(id => allEquipment.find(eq => eq.id === id)?.name || '')
          .filter(Boolean);
        customEquipmentList = [...customEquipmentList, ...(selectedGym.custom_equipment || [])];
      } else if (selectedLocation === 'home') {
        // Use home equipment
        locationEquipment = userEquipment
          .filter(e => e.location === 'home')
          .map(e => {
            const eq = allEquipment.find(a => a.id === e.equipment_id);
            return eq?.name || '';
          })
          .filter(Boolean);
      }
      // For outdoor, we use minimal/no equipment

      // Format injuries for the request
      const formattedInjuries = injuries.map(i => ({
        bodyPart: i.body_part,
        movementsToAvoid: i.movements_to_avoid || [],
      }));

      // Try AI-powered Edge Function first, fall back to local generation
      // Include recently generated exercise IDs to avoid duplicates
      const workoutRequest = {
        userId: user.id,
        location: selectedLocation as 'gym' | 'home' | 'outdoor',
        targetMuscles: freeformMode ? [] : selectedMuscles, // Empty if freeform
        duration,
        experienceLevel: profile?.experience_level || 'intermediate',
        workoutStyle: selectedWorkoutStyle,
        injuries: formattedInjuries,
        equipment: locationEquipment,
        customEquipment: customEquipmentList,
        gymName: selectedGym?.name,
        freeformPrompt: freeformMode ? freeformPrompt : undefined, // Add freeform prompt
        excludeExerciseIds: recentExerciseIds.length > 0 ? recentExerciseIds : undefined,
      };

      // Save request for potential regeneration
      setLastWorkoutRequest(workoutRequest);

      // Save debug info for inspection
      setDebugInfo({
        request: workoutRequest,
        timestamp: new Date().toISOString(),
      });
      console.log('🏋️ Workout Request:', JSON.stringify(workoutRequest, null, 2));

      // Call edge function - NO FALLBACK. If it fails, show error.
      console.log('[Page] Calling edge function...');
      const workout = await generateWorkout(workoutRequest);
      console.log('[Page] Workout generated successfully');

      // Update debug info with response
      setDebugInfo(prev => ({
        ...prev,
        response: workout,
      }));

      setGeneratedWorkout(workout);
      setShowWorkout(true);

      // Track generated exercise IDs to avoid duplicates on next generate
      // Keep last 20 exercises to avoid memory bloat while providing variety
      const newIds = workout.exercises.map(ex => ex.exerciseId).filter(Boolean);
      setRecentExerciseIds(prev => [...newIds, ...prev].slice(0, 20));
    } catch (err) {
      const errorMsg = (err as Error)?.message || 'Unknown error';
      console.error('Failed to generate workout:', err);
      console.error('Error message:', errorMsg);
      setError(`Failed to generate workout: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = () => {
    if (generatedWorkout) {
      // Store workout in sessionStorage for the workout page
      sessionStorage.setItem('currentWorkout', JSON.stringify(generatedWorkout));
      router.push('/workout');
    }
  };

  // Generate weekly plan
  const handleGenerateWeeklyPlan = async (days: WeeklyPlanDay[], planName: string) => {
    console.log('[WeeklyPlan] handleGenerateWeeklyPlan called', { days, planName, user: !!user, selectedLocation });

    if (!user) {
      setError('Please log in to generate a workout plan');
      return;
    }
    if (!selectedLocation) {
      setError('Please select a location (Gym, Home, or Outdoor) first');
      return;
    }
    if (!days || days.length === 0) {
      setError('Please select at least one training day');
      return;
    }

    setGenerating(true);
    setError(null);
    setLastWeeklyRequest({ days, planName });

    try {
      // Get equipment based on location
      let locationEquipment: string[] = [];
      let customEquipmentList: string[] = profile?.custom_equipment || [];

      if (selectedLocation === 'gym' && selectedGym) {
        locationEquipment = selectedGym.equipment_ids || [];
        customEquipmentList = selectedGym.custom_equipment || [];
      } else if (selectedLocation === 'home') {
        locationEquipment = userEquipment.map(e => e.equipment_id);
      }

      console.log('[WeeklyPlan] Calling generateWeeklyPlan with:', {
        location: selectedLocation,
        duration,
        daysCount: days.length,
        equipmentCount: locationEquipment.length,
      });

      const plan = await generateWeeklyPlan({
        userId: user.id,
        location: selectedLocation as 'gym' | 'home' | 'outdoor',
        duration,
        experienceLevel: (profile?.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        workoutStyle: selectedWorkoutStyle,
        injuries: injuries?.map(i => ({
          bodyPart: i.body_part,
          movementsToAvoid: i.movements_to_avoid || [],
        })),
        equipment: locationEquipment,
        customEquipment: customEquipmentList,
        weeklyPlan: {
          planName,
          days,
        },
      });

      console.log('[WeeklyPlan] Plan generated successfully:', plan?.name);
      setGeneratedPlan(plan);
      setShowPlanReview(true);
    } catch (err) {
      console.error('[WeeklyPlan] Failed to generate weekly plan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate weekly plan';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate weekly plan
  const handleRegenerateWeeklyPlan = async () => {
    if (lastWeeklyRequest) {
      await handleGenerateWeeklyPlan(lastWeeklyRequest.days, lastWeeklyRequest.planName);
    }
  };

  // Regenerate a single day's workout
  const handleRegenerateDayWorkout = async (dayIndex: number): Promise<GeneratedWorkout | null> => {
    if (!generatedPlan || !user || !selectedLocation) return null;

    const day = generatedPlan.days[dayIndex];
    if (!day) return null;

    try {
      // Get equipment based on location
      let locationEquipment: string[] = [];
      let customEquipmentList: string[] = profile?.custom_equipment || [];

      if (selectedLocation === 'gym' && selectedGym) {
        locationEquipment = selectedGym.equipment_ids
          .map(id => allEquipment.find(eq => eq.id === id)?.name || '')
          .filter(Boolean);
        customEquipmentList = [...customEquipmentList, ...(selectedGym.custom_equipment || [])];
      } else if (selectedLocation === 'home') {
        locationEquipment = userEquipment
          .filter(e => e.location === 'home')
          .map(e => {
            const eq = allEquipment.find(a => a.id === e.equipment_id);
            return eq?.name || '';
          })
          .filter(Boolean);
      }

      // Format injuries
      const formattedInjuries = injuries.map(i => ({
        bodyPart: i.body_part,
        movementsToAvoid: i.movements_to_avoid || [],
      }));

      // Get current exercise IDs to exclude (for variety)
      const currentExerciseIds = day.workout.exercises
        .map(ex => ex.exerciseId)
        .filter(Boolean);

      // Generate a new workout for this day using its muscle focus
      const workoutRequest = {
        userId: user.id,
        location: selectedLocation as 'gym' | 'home' | 'outdoor',
        targetMuscles: day.workout.targetMuscles || [],
        duration: day.workout.duration || duration,
        experienceLevel: profile?.experience_level || 'intermediate',
        workoutStyle: day.workout.workoutStyle || selectedWorkoutStyle,
        injuries: formattedInjuries,
        equipment: locationEquipment,
        customEquipment: customEquipmentList,
        gymName: selectedGym?.name,
        excludeExerciseIds: currentExerciseIds.length > 0 ? currentExerciseIds : undefined,
      };

      console.log('[RegenerateDay] Generating new workout for day:', day.day_name, workoutRequest);

      const newWorkout = await generateWorkout(workoutRequest);

      console.log('[RegenerateDay] New workout generated:', newWorkout.name);

      return newWorkout;
    } catch (err) {
      console.error('[RegenerateDay] Failed to regenerate day workout:', err);
      throw err;
    }
  };

  // Close plan review
  const handleClosePlanReview = () => {
    setShowPlanReview(false);
    setGeneratedPlan(null);
    // Refetch plans to update Today's Workout card
    refetchPlans();
  };

  // Regenerate workout with different exercises
  const handleRegenerate = async () => {
    if (!lastWorkoutRequest || !generatedWorkout) return;

    setGenerating(true);
    setError(null);

    try {
      // Exclude current exercises AND recently generated ones
      const currentIds = generatedWorkout.exercises
        .map(ex => ex.exerciseId)
        .filter(Boolean);
      const allExcludeIds = [...new Set([...currentIds, ...recentExerciseIds])];

      const regenerateRequest = {
        ...(lastWorkoutRequest as any),
        excludeExerciseIds: allExcludeIds,
      };

      console.log('🔄 Regenerating with exclusions:', allExcludeIds.length, 'exercises');

      // NO FALLBACK - if edge function fails, show error
      const workout = await generateWorkout(regenerateRequest);

      setGeneratedWorkout(workout);

      // Track generated exercise IDs
      const newIds = workout.exercises.map(ex => ex.exerciseId).filter(Boolean);
      setRecentExerciseIds(prev => [...newIds, ...prev].slice(0, 20));

      setDebugInfo(prev => ({
        ...prev,
        regenerateRequest,
        regenerateResponse: workout,
      }));
    } catch (err) {
      const errorMsg = (err as Error)?.message || 'Unknown error';
      console.error('Failed to regenerate workout:', err);
      setError(`Failed to regenerate: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  // Open swap modal for an exercise
  const handleOpenSwap = async (exerciseIndex: number) => {
    if (!generatedWorkout || !lastWorkoutRequest) return;

    const exercise = generatedWorkout.exercises[exerciseIndex];
    setSwappingExerciseIndex(exerciseIndex);
    setLoadingAlternatives(true);
    setSwapAlternatives([]);

    try {
      // Build target muscles from multiple sources, ensuring we always have something
      let targetMuscles: string[] = [];

      // First try exercise's primary muscles
      if (exercise.primaryMuscles?.length) {
        targetMuscles = [...exercise.primaryMuscles];
      }

      // Add secondary muscles if available
      if (exercise.secondaryMuscles?.length) {
        targetMuscles = [...targetMuscles, ...exercise.secondaryMuscles];
      }

      // Fallback to workout's target muscles if still empty
      if (targetMuscles.length === 0 && generatedWorkout.targetMuscles?.length) {
        targetMuscles = [...generatedWorkout.targetMuscles];
      }

      // Final fallback - infer from exercise name for common patterns
      if (targetMuscles.length === 0) {
        const name = exercise.name.toLowerCase();
        if (name.includes('bench') || name.includes('chest') || name.includes('push')) {
          targetMuscles = ['chest', 'triceps', 'shoulders'];
        } else if (name.includes('row') || name.includes('pull') || name.includes('lat')) {
          targetMuscles = ['back', 'biceps'];
        } else if (name.includes('squat') || name.includes('leg') || name.includes('lunge')) {
          targetMuscles = ['quads', 'glutes', 'hamstrings'];
        } else if (name.includes('deadlift') || name.includes('hip')) {
          targetMuscles = ['hamstrings', 'glutes', 'back'];
        } else if (name.includes('shoulder') || name.includes('press') || name.includes('delt')) {
          targetMuscles = ['shoulders', 'triceps'];
        } else if (name.includes('curl') || name.includes('bicep')) {
          targetMuscles = ['biceps'];
        } else if (name.includes('tricep') || name.includes('extension')) {
          targetMuscles = ['triceps'];
        } else if (name.includes('core') || name.includes('ab') || name.includes('plank')) {
          targetMuscles = ['abs', 'core'];
        } else {
          // Generic fallback
          targetMuscles = ['chest', 'back', 'shoulders'];
        }
      }

      console.log('[Swap] Request:', {
        exercise: exercise.name,
        exerciseId: exercise.exerciseId || '(empty)',
        targetMuscles,
        workoutStyle: generatedWorkout.workoutStyle,
        location: (lastWorkoutRequest as any).location,
        equipment: (lastWorkoutRequest as any).equipment?.length || 0,
      });

      const alternatives = await getSwapAlternatives({
        userId: user!.id,
        location: (lastWorkoutRequest as any).location,
        experienceLevel: (lastWorkoutRequest as any).experienceLevel,
        injuries: (lastWorkoutRequest as any).injuries,
        equipment: (lastWorkoutRequest as any).equipment,
        customEquipment: (lastWorkoutRequest as any).customEquipment,
        swapExerciseId: exercise.exerciseId || '', // Handle empty ID for unmatched exercises
        swapTargetMuscles: targetMuscles,
        workoutStyle: generatedWorkout.workoutStyle, // Pass workout style for style-appropriate alternatives
      });

      console.log('[Swap] Got alternatives:', alternatives?.length || 0);
      setSwapAlternatives(alternatives || []);
    } catch (err) {
      console.error('[Swap] Failed to get alternatives:', err);
      setSwapAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Load more swap alternatives using AI
  const handleLoadMoreAlternatives = async () => {
    if (swappingExerciseIndex === null || !generatedWorkout || !lastWorkoutRequest) return;

    const exercise = generatedWorkout.exercises[swappingExerciseIndex];
    setLoadingMoreAlternatives(true);

    try {
      // Build target muscles (same logic as handleOpenSwap)
      let targetMuscles: string[] = [];
      if (exercise.primaryMuscles?.length) {
        targetMuscles = [...exercise.primaryMuscles];
      }
      if (exercise.secondaryMuscles?.length) {
        targetMuscles = [...targetMuscles, ...exercise.secondaryMuscles];
      }
      if (targetMuscles.length === 0 && generatedWorkout.targetMuscles?.length) {
        targetMuscles = [...generatedWorkout.targetMuscles];
      }
      if (targetMuscles.length === 0) {
        const name = exercise.name.toLowerCase();
        if (name.includes('bench') || name.includes('chest') || name.includes('push')) {
          targetMuscles = ['chest', 'triceps', 'shoulders'];
        } else if (name.includes('row') || name.includes('pull') || name.includes('lat')) {
          targetMuscles = ['back', 'biceps'];
        } else {
          targetMuscles = ['chest', 'back', 'shoulders'];
        }
      }

      // Get IDs of already shown alternatives
      const excludeIds = [
        exercise.exerciseId || '',
        ...swapAlternatives.map(a => a.id),
      ].filter(Boolean);

      const moreAlternatives = await getSwapAlternatives({
        userId: user!.id,
        location: (lastWorkoutRequest as any).location,
        experienceLevel: (lastWorkoutRequest as any).experienceLevel,
        injuries: (lastWorkoutRequest as any).injuries,
        equipment: (lastWorkoutRequest as any).equipment,
        customEquipment: (lastWorkoutRequest as any).customEquipment,
        swapExerciseId: exercise.exerciseId || '',
        swapTargetMuscles: targetMuscles,
        workoutStyle: generatedWorkout.workoutStyle,
        swapRequestAI: true,
        swapExcludeIds: excludeIds,
      });

      // Append new alternatives (avoid duplicates)
      const existingIds = new Set(swapAlternatives.map(a => a.id));
      const newAlternatives = (moreAlternatives || []).filter(a => !existingIds.has(a.id));
      setSwapAlternatives([...swapAlternatives, ...newAlternatives]);
    } catch (err) {
      console.error('[Swap] Failed to load more:', err);
    } finally {
      setLoadingMoreAlternatives(false);
    }
  };

  // Swap an exercise with selected alternative
  const handleSwapExercise = (alternative: ExerciseAlternative) => {
    if (swappingExerciseIndex === null || !generatedWorkout) return;

    const currentExercise = generatedWorkout.exercises[swappingExerciseIndex];
    const newExercise: GeneratedExercise = {
      exerciseId: alternative.id,
      name: alternative.name,
      sets: currentExercise.sets,
      reps: currentExercise.reps,
      restSeconds: currentExercise.restSeconds,
      notes: currentExercise.notes,
      primaryMuscles: alternative.primaryMuscles || [],
      secondaryMuscles: alternative.secondaryMuscles || [],
    };

    const updatedExercises = [...generatedWorkout.exercises];
    updatedExercises[swappingExerciseIndex] = newExercise;

    setGeneratedWorkout({
      ...generatedWorkout,
      exercises: updatedExercises,
    });

    setSwappingExerciseIndex(null);
    setSwapAlternatives([]);
  };

  // Auto-select gym when profiles update and user is on gym location
  useEffect(() => {
    if (selectedLocation === 'gym' && !selectedGym && gymProfiles.length > 0) {
      setSelectedGym(getDefaultProfile() || gymProfiles[0]);
    }
  }, [selectedLocation, selectedGym, gymProfiles, getDefaultProfile]);

  // Can generate if:
  // - Location selected
  // - Either freeform mode with text, OR structured mode with muscles selected, OR cardio style
  // - If gym selected, must have a gym profile
  const canGenerate = selectedLocation &&
    (freeformMode ? freeformPrompt.trim().length > 0 : (selectedMuscles.length > 0 || selectedWorkoutStyle === 'cardio')) &&
    (selectedLocation !== 'gym' || selectedGym !== null);

  // Show onboarding for new users
  const needsOnboarding = !profileLoading && !isProfileComplete;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchProfile();
  };

  return (
    <AuthGuard>
    {needsOnboarding || showOnboarding ? (
      <Onboarding onComplete={handleOnboardingComplete} />
    ) : (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onTimerClick={() => setShowTimer(true)}
        onRunClick={() => router.push('/run')}
        showRun={true}
      />

      <main className="p-4" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom, 0px))' }}>
        {!showWorkout ? (
          <>
            {/* Primary Context - Sticky Header */}
            <PrimaryContext
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedGym={selectedGym}
              setSelectedGym={setSelectedGym}
              gymProfiles={gymProfiles}
              getDefaultProfile={getDefaultProfile}
              duration={duration}
              setDuration={setDuration}
              weeklyMode={weeklyMode}
              setWeeklyMode={setWeeklyMode}
              onManageGyms={() => setShowGymManager(true)}
            />

            {/* Spacer for sticky header */}
            <div style={{ height: '1rem' }} />

            {/* Today's Workout Card - Show if active plan has workout for today */}
            {activePlan && getTodaysWorkout() && (
              <div
                className="card mb-4 animate-fade-in"
                style={{
                  background: colors.cardBg,
                  border: `2px solid ${colors.accent}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div style={{ color: colors.accent, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Today's Workout
                    </div>
                    <div style={{ color: colors.text, fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                      {getTodaysWorkout()?.name || `${DAY_NAMES_FULL[new Date().getDay()]} Training`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
                      from {activePlan.name}
                    </div>
                    <div style={{ color: colors.accent, fontSize: '0.8125rem', fontWeight: 500 }}>
                      ~{getTodaysWorkout()?.estimated_duration || 45} min
                    </div>
                  </div>
                </div>
                <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.625rem' }}>
                  {getTodaysWorkout()?.target_muscles?.slice(0, 4).join(', ')}
                  {(getTodaysWorkout()?.target_muscles?.length || 0) > 4 && ` +${(getTodaysWorkout()?.target_muscles?.length || 0) - 4}`}
                </div>
                <button
                  onClick={() => {
                    const todayWorkout = getTodaysWorkout();
                    if (todayWorkout?.id) {
                      sessionStorage.setItem('loadWorkoutId', todayWorkout.id);
                      router.push('/workout');
                    }
                  }}
                  className="btn-primary w-full"
                  style={{ fontSize: '0.9375rem' }}
                >
                  Start Today's Workout
                </button>
              </div>
            )}

            {/* Error Message - Show for both modes */}
            {error && (
              <div
                className="animate-fade-in mb-4 p-3"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid #F87171',
                  borderRadius: '0.5rem',
                  color: '#F87171',
                  fontSize: '0.8125rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Weekly Planner - Show when weekly mode is selected */}
            {weeklyMode ? (
              <WeeklyPlanner
                duration={duration}
                onGenerate={handleGenerateWeeklyPlan}
                generating={generating}
              />
            ) : (
              <>
                {/* Muscle Selection - Progressive Disclosure */}
                {!freeformMode && (
                  <MuscleSelector
                    selectedMuscles={selectedMuscles}
                    setSelectedMuscles={setSelectedMuscles}
                    selectedWorkoutStyle={selectedWorkoutStyle}
                    setSelectedWorkoutStyle={setSelectedWorkoutStyle}
                  />
                )}

                {/* Training Style - De-emphasized, pre-selected */}
                {!freeformMode && selectedWorkoutStyle !== 'cardio' && (
                  <TrainingStyleSelector
                    selectedWorkoutStyle={selectedWorkoutStyle}
                    setSelectedWorkoutStyle={setSelectedWorkoutStyle}
                  />
                )}

                {/* Advanced Options - Collapsed by default */}
                <AdvancedOptions
                  freeformMode={freeformMode}
                  setFreeformMode={setFreeformMode}
                  freeformPrompt={freeformPrompt}
                  setFreeformPrompt={setFreeformPrompt}
                  selectedWorkoutStyle={selectedWorkoutStyle}
                  setSelectedWorkoutStyle={setSelectedWorkoutStyle}
                  selectedMuscles={selectedMuscles}
                  toggleMuscle={toggleMuscle}
                />
              </>
            )}

            {/* Spacer for sticky generate button */}
            <div style={{ height: '1rem' }} />
          </>
        ) : generatedWorkout || generatedPlan ? (
          /* Workout Display */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowWorkout(false);
                  setGeneratedWorkout(null);
                  setGeneratedPlan(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.accent,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                ← Back
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowDebug(true)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.borderSubtle}`,
                    color: colors.textMuted,
                    fontSize: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                  title="View AI Request"
                >
                  🔍
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.accent,
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.5 : 1,
                  }}
                  title="Generate different exercises"
                >
                  {generating ? '...' : '🔄 New'}
                </button>
                <button
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.accent,
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Single Workout Display */}
            {generatedWorkout && (
            <>
            <div className="card mb-4" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
              <div className="flex items-center justify-between mb-2">
                <h2
                  style={{
                    fontFamily: 'var(--font-libre-baskerville)',
                    fontSize: '1.5rem',
                    color: colors.text,
                  }}
                >
                  {generatedWorkout.name}
                </h2>
                <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                  ~{generatedWorkout.duration} min
                </span>
              </div>
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {generatedWorkout.exercises.length} exercises
              </p>
              {/* Context Tags: Location, Style, Muscles */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {/* Location Tag */}
                {selectedLocation && (
                  <span
                    style={{
                      background: 'rgba(100, 149, 237, 0.15)',
                      border: '1px solid rgba(100, 149, 237, 0.4)',
                      borderRadius: '999px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      color: '#6495ED',
                      textTransform: 'capitalize',
                    }}
                  >
                    {locationIcons[selectedLocation]} {selectedLocation}
                  </span>
                )}
                {/* Style Tag */}
                {generatedWorkout.workoutStyle && generatedWorkout.workoutStyle !== 'traditional' && (
                  <span
                    style={{
                      background: 'rgba(138, 43, 226, 0.15)',
                      border: '1px solid rgba(138, 43, 226, 0.4)',
                      borderRadius: '999px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      color: '#9370DB',
                      textTransform: 'capitalize',
                    }}
                  >
                    {workoutStyleNames[generatedWorkout.workoutStyle] || generatedWorkout.workoutStyle}
                  </span>
                )}
              </div>
              {/* Target Muscles Tags */}
              <div className="flex flex-wrap gap-1">
                {generatedWorkout.targetMuscles.slice(0, 6).map(muscle => (
                  <span
                    key={muscle}
                    style={{
                      background: colors.accentMuted,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '999px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      color: colors.accent,
                      textTransform: 'capitalize',
                    }}
                  >
                    {muscle.replace('_', ' ')}
                  </span>
                ))}
                {generatedWorkout.targetMuscles.length > 6 && (
                  <span style={{ fontSize: '0.625rem', color: colors.textMuted }}>
                    +{generatedWorkout.targetMuscles.length - 6} more
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {generatedWorkout.exercises.map((exercise, i) => (
                <div
                  key={i}
                  className="card animate-fade-in"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: colors.cardBg,
                    border: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.75rem',
                      background: colors.accentMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: colors.accent,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <h3 style={{ color: colors.text, fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                        {exercise.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowExerciseDetail(exercise.name);
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(201, 167, 90, 0.15)',
                          border: '1px solid rgba(201, 167, 90, 0.3)',
                          color: colors.accent,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        title="How to do this exercise"
                      >
                        ?
                      </button>
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: 0 }}>
                      {exercise.sets} sets x {exercise.reps} reps
                    </p>
                    {/* Muscle & Movement Pattern Tags */}
                    {(exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length || exercise.movementPatterns?.length || exercise.rehabFor?.length) && (
                      <div className="flex flex-wrap gap-1" style={{ marginTop: '0.25rem' }}>
                        {exercise.primaryMuscles?.map(muscle => (
                          <span
                            key={muscle}
                            style={{
                              background: colors.accentMuted,
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: colors.accent,
                              textTransform: 'capitalize',
                            }}
                          >
                            {muscle.replace('_', ' ')}
                          </span>
                        ))}
                        {exercise.secondaryMuscles?.slice(0, 2).map(muscle => (
                          <span
                            key={muscle}
                            style={{
                              background: colors.inputBg,
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: colors.textMuted,
                              textTransform: 'capitalize',
                            }}
                          >
                            {muscle.replace('_', ' ')}
                          </span>
                        ))}
                        {/* Movement Pattern Tags */}
                        {exercise.movementPatterns?.map(pattern => (
                          <span
                            key={pattern}
                            style={{
                              background: colors.inputBg,
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: colors.textMuted,
                              textTransform: 'capitalize',
                            }}
                          >
                            {pattern.replace('_', ' ')}
                          </span>
                        ))}
                        {/* Rehab indicator */}
                        {exercise.rehabFor && exercise.rehabFor.length > 0 && (
                          <span
                            style={{
                              background: colors.inputBg,
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: colors.success,
                            }}
                          >
                            rehab
                          </span>
                        )}
                      </div>
                    )}
                    {exercise.notes && (
                      <p style={{ color: colors.textMuted, fontSize: '0.625rem', marginTop: '0.25rem' }}>
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div style={{ color: colors.accent, fontSize: '0.75rem' }}>
                      {exercise.restSeconds}s rest
                    </div>
                    <button
                      onClick={() => handleOpenSwap(i)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.borderSubtle}`,
                        color: colors.textMuted,
                        fontSize: '0.625rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartWorkout}
              className="btn-primary w-full mt-6"
              style={{ fontSize: '1.125rem' }}
            >
              Start Workout
            </button>
            </>
            )}
          </div>
        ) : null}
      </main>

      {/* Sticky Generate Button - Only show on single workout mode when not showing workout */}
      {!showWorkout && !weeklyMode && (
        <div
          className="fixed left-0 right-0"
          style={{
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
            padding: '0 1rem 1rem',
            background: `linear-gradient(180deg, transparent 0%, ${colors.bg} 40%)`,
            zIndex: 40,
          }}
        >
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            style={{
              width: '100%',
              padding: '1.125rem 1.5rem',
              borderRadius: '1rem',
              background: canGenerate
                ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                : colors.cardBg,
              border: canGenerate ? 'none' : `1.5px solid ${colors.borderSubtle}`,
              color: canGenerate ? colors.bg : colors.textMuted,
              fontSize: '1.0625rem',
              fontWeight: 700,
              cursor: canGenerate && !generating ? 'pointer' : 'not-allowed',
              boxShadow: canGenerate ? '0 8px 24px rgba(201, 167, 90, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
            }}
          >
            {generating ? (
              <>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    border: `2px solid ${colors.bg}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Creating Your Workout...</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                  <path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z" />
                </svg>
                <span>Generate Workout</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0"
        style={{
          background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.cardBg} 100%)`,
          borderTop: `1px solid ${colors.borderSubtle}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.75rem 0 0.625rem',
          }}
        >
          {[
            {
              label: 'Workout',
              href: '/',
              active: true,
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="9" width="4" height="6" rx="1" />
                  <rect x="19" y="9" width="4" height="6" rx="1" />
                  <path d="M6 7v10" />
                  <path d="M18 7v10" />
                  <path d="M6 12h12" />
                </svg>
              ),
            },
            {
              label: 'Progress',
              href: '/progress',
              active: false,
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-4-4-6 6" />
                </svg>
              ),
            },
            {
              label: 'Library',
              href: '/library',
              active: false,
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M8 7h8" />
                  <path d="M8 11h6" />
                </svg>
              ),
            },
            {
              label: 'Profile',
              href: '/profile',
              active: false,
              icon: (color: string) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ),
            },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{
                background: item.active ? colors.accentMuted : 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.75rem',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              {item.icon(item.active ? colors.accent : colors.textMuted)}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: item.active ? colors.accent : colors.textMuted,
                  fontWeight: item.active ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onRestartOnboarding={() => setShowOnboarding(true)}
      />
      <GymManager isOpen={showGymManager} onClose={() => {
        setShowGymManager(false);
        refetchGymProfiles();
      }} />
      <FlexTimerModal isOpen={showTimer} onClose={() => setShowTimer(false)} />

      {/* Debug Modal */}
      {showDebug && debugInfo && (
        <div
          onClick={() => setShowDebug(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.borderSubtle}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ color: colors.text, margin: 0, fontSize: '1rem' }}>
                AI Request Debug
              </h3>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '1rem',
              overflow: 'auto',
              flex: 1,
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: (debugInfo as any).usedAI ? colors.accentMuted : colors.inputBg,
                  color: (debugInfo as any).usedAI ? colors.success : colors.textMuted,
                }}>
                  {(debugInfo as any).usedAI ? 'Used AI (Edge Function)' : 'Used Local Generation'}
                </span>
              </div>
              <pre style={{
                backgroundColor: colors.inputBg,
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.7rem',
                color: colors.text,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Swap Exercise Modal */}
      {swappingExerciseIndex !== null && (
        <div
          onClick={() => {
            setSwappingExerciseIndex(null);
            setSwapAlternatives([]);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '1.5rem 1.5rem 0 0',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '70vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `1px solid ${colors.borderSubtle}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ color: colors.text, margin: 0, fontSize: '1rem' }}>
                  Swap Exercise
                </h3>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Replacing: {generatedWorkout?.exercises[swappingExerciseIndex]?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSwappingExerciseIndex(null);
                  setSwapAlternatives([]);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '1rem',
              overflow: 'auto',
              flex: 1,
            }}>
              {loadingAlternatives ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                  <div className="animate-pulse">Finding alternatives...</div>
                </div>
              ) : swapAlternatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                  No alternatives found for this exercise.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {swapAlternatives.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => handleSwapExercise(alt)}
                      style={{
                        background: colors.inputBg,
                        border: `1px solid ${colors.borderSubtle}`,
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: colors.text, fontSize: '0.9rem', fontWeight: 500 }}>
                          {alt.name}
                        </span>
                        {(alt as any).source === 'ai_pending' && (
                          <span
                            style={{
                              background: 'rgba(147, 51, 234, 0.15)',
                              color: '#a855f7',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '999px',
                              fontSize: '0.5625rem',
                              fontWeight: 600,
                            }}
                          >
                            AI
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {alt.primaryMuscles?.map((muscle: string) => (
                          <span
                            key={muscle}
                            style={{
                              fontSize: '0.625rem',
                              backgroundColor: colors.accentMuted,
                              color: colors.accent,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                            }}
                          >
                            {muscle}
                          </span>
                        ))}
                        {alt.isCompound && (
                          <span style={{
                            fontSize: '0.625rem',
                            backgroundColor: colors.inputBg,
                            color: colors.textMuted,
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                          }}>
                            Compound
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Load More Button */}
                  <button
                    onClick={handleLoadMoreAlternatives}
                    disabled={loadingMoreAlternatives}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: `1.5px dashed ${colors.border}`,
                      borderRadius: '0.75rem',
                      color: colors.textMuted,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: loadingMoreAlternatives ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: loadingMoreAlternatives ? 0.6 : 1,
                    }}
                  >
                    {loadingMoreAlternatives ? (
                      <>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            border: `2px solid ${colors.accent}`,
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        Finding more...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1rem' }}>+</span>
                        Load More (AI)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Plan Review Modal */}
      {showPlanReview && generatedPlan && (
        <WeeklyPlanReview
          plan={generatedPlan}
          onClose={handleClosePlanReview}
          onRegenerate={handleRegenerateWeeklyPlan}
          onRegenerateDay={handleRegenerateDayWorkout}
          regenerating={generating}
          location={selectedLocation as 'gym' | 'home' | 'outdoor'}
          experienceLevel={(profile?.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate'}
          equipment={selectedGym?.equipment_ids || []}
          customEquipment={selectedGym?.custom_equipment || []}
        />
      )}

      {/* Exercise Detail Modal */}
      {showExerciseDetail && (
        <ExerciseDetailModal
          exerciseName={showExerciseDetail}
          onClose={() => setShowExerciseDetail(null)}
        />
      )}
    </div>
    )}
    </AuthGuard>
  );
}
