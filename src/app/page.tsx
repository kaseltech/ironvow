'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { AuthGuard } from '@/components/AuthGuard';
import { Onboarding } from '@/components/Onboarding';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useInjuries, useEquipment, useGymProfiles } from '@/hooks/useSupabase';
import { generateWorkout, generateWorkoutLocal, getSwapAlternatives, type GeneratedWorkout, type GeneratedExercise, type ExerciseAlternative, type WorkoutStyle } from '@/lib/generateWorkout';
import { Settings } from '@/components/Settings';
import { GymManager } from '@/components/GymManager';
import type { GymProfile } from '@/lib/supabase/types';

const muscleGroups = [
  // Upper body
  { id: 'chest', name: 'Chest', category: 'upper' },
  { id: 'back', name: 'Back', category: 'upper' },
  { id: 'shoulders', name: 'Shoulders', category: 'upper' },
  { id: 'biceps', name: 'Biceps', category: 'upper' },
  { id: 'triceps', name: 'Triceps', category: 'upper' },
  { id: 'forearms', name: 'Forearms', category: 'upper' },
  { id: 'traps', name: 'Traps', category: 'upper' },
  // Lower body
  { id: 'quads', name: 'Quads', category: 'lower' },
  { id: 'hamstrings', name: 'Hamstrings', category: 'lower' },
  { id: 'glutes', name: 'Glutes', category: 'lower' },
  { id: 'calves', name: 'Calves', category: 'lower' },
  // Core
  { id: 'abs', name: 'Abs', category: 'core' },
  { id: 'obliques', name: 'Obliques', category: 'core' },
];

const locations = [
  { id: 'gym', name: 'Gym', icon: '🏋️' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
];

const workoutStyles: { id: WorkoutStyle; name: string; description: string }[] = [
  { id: 'traditional', name: 'Traditional', description: '3-4 sets × 8-12 reps' },
  { id: 'strength', name: 'Strength (5×5)', description: '5 sets × 5 reps, heavy' },
  { id: 'hiit', name: 'HIIT', description: 'High intensity, short rest' },
  { id: 'circuit', name: 'Circuit', description: 'Back-to-back, minimal rest' },
  { id: 'wod', name: 'WOD', description: 'CrossFit-style AMRAP/EMOM' },
  { id: 'cardio', name: 'Cardio', description: 'Running, intervals, conditioning' },
  { id: 'mobility', name: 'Mobility', description: 'Stretching & recovery' },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading, isProfileComplete, refetch: refetchProfile } = useProfile();
  const { injuries } = useInjuries();
  const { userEquipment, allEquipment } = useEquipment();
  const { profiles: gymProfiles, getDefaultProfile } = useGymProfiles();

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
  const [debugInfo, setDebugInfo] = useState<object | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [swappingExerciseIndex, setSwappingExerciseIndex] = useState<number | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [lastWorkoutRequest, setLastWorkoutRequest] = useState<object | null>(null);
  // Freeform AI input
  const [freeformMode, setFreeformMode] = useState(false);
  const [freeformPrompt, setFreeformPrompt] = useState('');

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
      };

      // Save request for potential regeneration
      setLastWorkoutRequest(workoutRequest);

      // Save debug info for inspection
      setDebugInfo({
        request: workoutRequest,
        timestamp: new Date().toISOString(),
      });
      console.log('🏋️ Workout Request:', JSON.stringify(workoutRequest, null, 2));

      let workout: GeneratedWorkout;
      let usedAI = false;
      try {
        workout = await generateWorkout(workoutRequest);
        usedAI = true;
      } catch (edgeFnError) {
        console.warn('Edge function failed, using local generation:', edgeFnError);
        workout = await generateWorkoutLocal(workoutRequest);
      }

      // Update debug info with response
      setDebugInfo(prev => ({
        ...prev,
        response: workout,
        usedAI,
      }));

      setGeneratedWorkout(workout);
      setShowWorkout(true);
    } catch (err) {
      console.error('Failed to generate workout:', err);
      setError('Failed to generate workout. Please try again.');
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

  // Regenerate workout with different exercises
  const handleRegenerate = async () => {
    if (!lastWorkoutRequest || !generatedWorkout) return;

    setGenerating(true);
    setError(null);

    try {
      // Exclude current exercises
      const excludeIds = generatedWorkout.exercises
        .map(ex => ex.exerciseId)
        .filter(Boolean);

      const regenerateRequest = {
        ...(lastWorkoutRequest as any),
        excludeExerciseIds: excludeIds,
      };

      console.log('🔄 Regenerating with exclusions:', excludeIds);

      let workout: GeneratedWorkout;
      try {
        workout = await generateWorkout(regenerateRequest);
      } catch {
        workout = await generateWorkoutLocal(regenerateRequest);
      }

      setGeneratedWorkout(workout);
      setDebugInfo(prev => ({
        ...prev,
        regenerateRequest,
        regenerateResponse: workout,
      }));
    } catch (err) {
      console.error('Failed to regenerate workout:', err);
      setError('Failed to regenerate. Try again.');
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
      // Use exercise's muscles if available, otherwise fallback to workout's target muscles
      const targetMuscles = exercise.primaryMuscles?.length
        ? exercise.primaryMuscles
        : generatedWorkout.targetMuscles;

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

      setSwapAlternatives(alternatives || []);
    } catch (err) {
      console.error('Failed to get alternatives:', err);
      setSwapAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
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

  // Can generate if:
  // - Location selected
  // - Either freeform mode with text, or structured mode with muscles selected
  // - If gym selected, must have a gym profile
  const canGenerate = selectedLocation &&
    (freeformMode ? freeformPrompt.trim().length > 0 : selectedMuscles.length > 0) &&
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
    <div className="min-h-screen" style={{ backgroundColor: '#0F2233' }}>
      {/* Header */}
      <header
        className="safe-area-top"
        style={{
          background: 'linear-gradient(180deg, #1A3550 0%, #0F2233 100%)',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <Logo size="lg" href="/" />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(201, 167, 90, 0.1)',
              border: '1px solid rgba(201, 167, 90, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="p-4 pb-24">
        {!showWorkout ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-6 animate-fade-in">
              <h1
                style={{
                  fontFamily: 'var(--font-libre-baskerville)',
                  fontSize: '1.75rem',
                  color: '#F5F1EA',
                  marginBottom: '0.5rem',
                }}
              >
                Ready to train?
              </h1>
              <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.9rem' }}>
                Your AI training partner is ready to build your workout
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <button
                onClick={() => router.push('/run')}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>🏃</span>
                <span style={{ color: '#22C55E', fontWeight: 600, fontSize: '0.875rem' }}>Go for a Run</span>
              </button>
            </div>

            {/* Location Selector */}
            <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Where are you?
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc.id);
                      // Auto-select default gym when gym is selected
                      if (loc.id === 'gym') {
                        setSelectedGym(getDefaultProfile() || null);
                      } else {
                        setSelectedGym(null);
                      }
                    }}
                    style={{
                      background: selectedLocation === loc.id ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                      border: selectedLocation === loc.id ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.1)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{loc.icon}</div>
                    <div style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>{loc.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gym Selector - Only show when gym location selected */}
            {selectedLocation === 'gym' && (
              <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Which gym?
                  </h2>
                  <button
                    onClick={() => setShowGymManager(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Manage Gyms
                  </button>
                </div>

                {gymProfiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {gymProfiles.map(gym => (
                      <button
                        key={gym.id}
                        onClick={() => setSelectedGym(gym)}
                        style={{
                          background: selectedGym?.id === gym.id ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                          border: selectedGym?.id === gym.id ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.1)',
                          borderRadius: '0.75rem',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ color: '#F5F1EA', fontSize: '0.9rem', fontWeight: 500 }}>
                            {gym.name}
                            {gym.is_default && (
                              <span style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.625rem',
                                background: '#C9A75A',
                                color: '#0F2233',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontWeight: 600,
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.7rem' }}>
                            {(gym.equipment_ids?.length || 0) + (gym.custom_equipment?.length || 0)} equipment items
                          </div>
                        </div>
                        {selectedGym?.id === gym.id && (
                          <span style={{ color: '#C9A75A', fontSize: '1.25rem' }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGymManager(true)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '2px dashed rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Your First Gym
                  </button>
                )}
              </div>
            )}

            {/* Muscle Group Selector - Only show in structured mode */}
            {!freeformMode && (
              <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What do you want to hit?
                </h2>

                {/* Upper Body */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                    Upper Body
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {muscleGroups.filter(m => m.category === 'upper').map(muscle => (
                      <button
                        key={muscle.id}
                        onClick={() => toggleMuscle(muscle.id)}
                        style={{
                          background: selectedMuscles.includes(muscle.id) ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                          border: selectedMuscles.includes(muscle.id) ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                          borderRadius: '999px',
                          padding: '0.375rem 0.75rem',
                          transition: 'all 0.2s ease',
                          color: selectedMuscles.includes(muscle.id) ? '#C9A75A' : '#F5F1EA',
                          fontSize: '0.75rem',
                        }}
                      >
                        {muscle.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lower Body */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                    Lower Body
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {muscleGroups.filter(m => m.category === 'lower').map(muscle => (
                      <button
                        key={muscle.id}
                        onClick={() => toggleMuscle(muscle.id)}
                        style={{
                          background: selectedMuscles.includes(muscle.id) ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                          border: selectedMuscles.includes(muscle.id) ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                          borderRadius: '999px',
                          padding: '0.375rem 0.75rem',
                          transition: 'all 0.2s ease',
                          color: selectedMuscles.includes(muscle.id) ? '#C9A75A' : '#F5F1EA',
                          fontSize: '0.75rem',
                        }}
                      >
                        {muscle.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Core */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                    Core
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {muscleGroups.filter(m => m.category === 'core').map(muscle => (
                      <button
                        key={muscle.id}
                        onClick={() => toggleMuscle(muscle.id)}
                        style={{
                          background: selectedMuscles.includes(muscle.id) ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                          border: selectedMuscles.includes(muscle.id) ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                          borderRadius: '999px',
                          padding: '0.375rem 0.75rem',
                          transition: 'all 0.2s ease',
                          color: selectedMuscles.includes(muscle.id) ? '#C9A75A' : '#F5F1EA',
                          fontSize: '0.75rem',
                        }}
                      >
                        {muscle.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-2" style={{ marginTop: '0.75rem' }}>
                  <button
                    onClick={() => setSelectedMuscles(['chest', 'shoulders', 'triceps'])}
                    style={{
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Push
                  </button>
                  <button
                    onClick={() => setSelectedMuscles(['back', 'biceps', 'traps'])}
                    style={{
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Pull
                  </button>
                  <button
                    onClick={() => setSelectedMuscles(['quads', 'hamstrings', 'glutes', 'calves'])}
                    style={{
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Legs
                  </button>
                  <button
                    onClick={() => setSelectedMuscles(muscleGroups.map(m => m.id))}
                    style={{
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Full Body
                  </button>
                </div>
              </div>
            )}

            {/* Duration Selector */}
            <div className="card mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                How long do you have?
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: '#C9A75A',
                    height: '4px',
                  }}
                />
                <span style={{ color: '#F5F1EA', fontSize: '1.25rem', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                  {duration} min
                </span>
              </div>
              <div className="flex justify-between mt-2" style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                <span>Quick</span>
                <span>Full session</span>
              </div>
            </div>

            {/* Workout Style Selector - Only show in structured mode */}
            {!freeformMode && (
              <div className="card mb-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workout Style
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {workoutStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedWorkoutStyle(style.id)}
                      className="p-2 rounded-lg transition-all duration-200 text-left"
                      style={{
                        background: selectedWorkoutStyle === style.id
                          ? 'rgba(201, 167, 90, 0.2)'
                          : 'rgba(245, 241, 234, 0.05)',
                        border: selectedWorkoutStyle === style.id
                          ? '1px solid #C9A75A'
                          : '1px solid rgba(245, 241, 234, 0.1)',
                      }}
                    >
                      <div style={{ color: selectedWorkoutStyle === style.id ? '#C9A75A' : '#F5F1EA', fontSize: '0.875rem', fontWeight: 500 }}>
                        {style.name}
                      </div>
                      <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.7rem', marginTop: '2px' }}>
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Freeform Input Toggle */}
            <div className="card mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: freeformMode ? '0.75rem' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>✨</span>
                  <div>
                    <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      AI-Powered
                    </h2>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.7rem', margin: 0 }}>
                      Describe your ideal workout
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFreeformMode(!freeformMode)}
                  style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    background: freeformMode ? '#C9A75A' : 'rgba(245, 241, 234, 0.2)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: freeformMode ? '22px' : '2px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      background: '#F5F1EA',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {freeformMode && (
                <div className="animate-fade-in">
                  <textarea
                    value={freeformPrompt}
                    onChange={(e) => setFreeformPrompt(e.target.value)}
                    placeholder="e.g., 'Army-style PT with lots of pushups and running' or 'Quick upper body pump before work' or 'Something brutal - I need to suffer today'"
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      color: '#F5F1EA',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    AI will interpret your request while respecting your equipment and any injuries.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="animate-fade-in mb-4 p-3"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid #F87171',
                  borderRadius: '0.5rem',
                  color: '#F87171',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="btn-primary w-full animate-fade-in"
              style={{
                animationDelay: '0.4s',
                opacity: canGenerate ? 1 : 0.5,
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
            >
              {generating ? (
                <span className="animate-pulse">Generating your workout...</span>
              ) : (
                'Generate Workout'
              )}
            </button>
          </>
        ) : generatedWorkout ? (
          /* Workout Display */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowWorkout(false);
                  setGeneratedWorkout(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C9A75A',
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
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                    color: 'rgba(245, 241, 234, 0.4)',
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
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
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
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
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

            <div className="card mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2
                  style={{
                    fontFamily: 'var(--font-libre-baskerville)',
                    fontSize: '1.5rem',
                    color: '#F5F1EA',
                  }}
                >
                  {generatedWorkout.name}
                </h2>
                <span style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.875rem' }}>
                  ~{generatedWorkout.duration} min
                </span>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {generatedWorkout.exercises.length} exercises
              </p>
              {/* Target Muscles Tags */}
              <div className="flex flex-wrap gap-1">
                {generatedWorkout.targetMuscles.slice(0, 6).map(muscle => (
                  <span
                    key={muscle}
                    style={{
                      background: 'rgba(201, 167, 90, 0.15)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '999px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      color: '#C9A75A',
                      textTransform: 'capitalize',
                    }}
                  >
                    {muscle.replace('_', ' ')}
                  </span>
                ))}
                {generatedWorkout.targetMuscles.length > 6 && (
                  <span style={{ fontSize: '0.625rem', color: 'rgba(245, 241, 234, 0.4)' }}>
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
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.75rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: '#C9A75A',
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                      {exercise.name}
                    </h3>
                    <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.75rem' }}>
                      {exercise.sets} sets x {exercise.reps} reps
                    </p>
                    {/* Muscle Tags */}
                    {(exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length) && (
                      <div className="flex flex-wrap gap-1" style={{ marginTop: '0.25rem' }}>
                        {exercise.primaryMuscles?.map(muscle => (
                          <span
                            key={muscle}
                            style={{
                              background: 'rgba(201, 167, 90, 0.2)',
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: '#C9A75A',
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
                              background: 'rgba(245, 241, 234, 0.1)',
                              borderRadius: '999px',
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.5rem',
                              color: 'rgba(245, 241, 234, 0.5)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {muscle.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {exercise.notes && (
                      <p style={{ color: 'rgba(201, 167, 90, 0.6)', fontSize: '0.625rem', marginTop: '0.25rem' }}>
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div style={{ color: '#C9A75A', fontSize: '0.75rem' }}>
                      {exercise.restSeconds}s rest
                    </div>
                    <button
                      onClick={() => handleOpenSwap(i)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(201, 167, 90, 0.2)',
                        color: 'rgba(201, 167, 90, 0.7)',
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
          </div>
        ) : null}
      </main>

      {/* Bottom Nav Mock */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #0F2233 20%)',
          paddingTop: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#1A3550',
            borderTop: '1px solid rgba(201, 167, 90, 0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.75rem 0',
          }}
        >
          {[
            { icon: '🏋️', label: 'Workout', active: true },
            { icon: '📊', label: 'Progress', active: false },
            { icon: '📚', label: 'Library', active: false },
            { icon: '👤', label: 'Profile', active: false },
          ].map(item => (
            <button
              key={item.label}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '1.25rem', opacity: item.active ? 1 : 0.5 }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  color: item.active ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                  fontWeight: item.active ? 600 : 400,
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
      <GymManager isOpen={showGymManager} onClose={() => setShowGymManager(false)} />

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
              backgroundColor: '#1A3550',
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
              borderBottom: '1px solid rgba(201, 167, 90, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ color: '#F5F1EA', margin: 0, fontSize: '1rem' }}>
                🔍 AI Request Debug
              </h3>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F5F1EA',
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
                  backgroundColor: (debugInfo as any).usedAI ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: (debugInfo as any).usedAI ? '#10b981' : '#f59e0b',
                }}>
                  {(debugInfo as any).usedAI ? '✓ Used AI (Edge Function)' : '⚡ Used Local Generation'}
                </span>
              </div>
              <pre style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.7rem',
                color: '#F5F1EA',
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
              backgroundColor: '#1A3550',
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
              borderBottom: '1px solid rgba(201, 167, 90, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ color: '#F5F1EA', margin: 0, fontSize: '1rem' }}>
                  Swap Exercise
                </h3>
                <p style={{ color: 'rgba(245, 241, 234, 0.5)', margin: 0, fontSize: '0.75rem', marginTop: '0.25rem' }}>
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
                  color: '#F5F1EA',
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
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245, 241, 234, 0.6)' }}>
                  <div className="animate-pulse">Finding alternatives...</div>
                </div>
              ) : swapAlternatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                  No alternatives found for this exercise.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {swapAlternatives.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => handleSwapExercise(alt)}
                      style={{
                        background: 'rgba(15, 34, 51, 0.5)',
                        border: '1px solid rgba(201, 167, 90, 0.2)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ color: '#F5F1EA', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {alt.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {alt.primaryMuscles?.map((muscle: string) => (
                          <span
                            key={muscle}
                            style={{
                              fontSize: '0.625rem',
                              backgroundColor: 'rgba(201, 167, 90, 0.2)',
                              color: '#C9A75A',
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
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                          }}>
                            Compound
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </AuthGuard>
  );
}
