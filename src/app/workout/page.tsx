'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useWorkoutSessions, useSetLogs, type LoggedSet } from '@/hooks/useSupabase';
import type { GeneratedWorkout as FullGeneratedWorkout } from '@/lib/generateWorkout';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { getSwapAlternatives, type GeneratedWorkout, type WarmupExercise, type GeneratedExercise, type ExerciseAlternative } from '@/lib/generateWorkout';
import { useProfile, useEquipment, useInjuries } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { App } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Capacitor } from '@capacitor/core';

interface WorkoutExercise {
  name: string;
  exerciseId: string | null;
  sets: { target_reps: number; target_weight: number; type: 'warmup' | 'working' }[];
  rest_seconds: number;
  notes?: string;
  primaryMuscles?: string[];
  lastWeight?: number;
  prWeight?: number;
}

interface WorkoutData {
  name: string;
  exercises: WorkoutExercise[];
  warmup?: WarmupExercise[];
}

// Convert GeneratedWorkout to our internal format
function convertGeneratedWorkout(generated: GeneratedWorkout): WorkoutData {
  return {
    name: generated.name,
    warmup: generated.warmup,
    exercises: generated.exercises.map(ex => {
      const repsStr = ex.reps.split('-')[0].replace(/[^0-9]/g, '');
      const targetReps = parseInt(repsStr) || 10;
      const suggestedWeight = ex.weight ? parseInt(ex.weight) || 0 : 0;

      const sets: { target_reps: number; target_weight: number; type: 'warmup' | 'working' }[] = [];
      for (let i = 0; i < ex.sets; i++) {
        sets.push({
          target_reps: targetReps,
          target_weight: suggestedWeight,
          type: 'working',
        });
      }

      return {
        name: ex.name,
        exerciseId: ex.exerciseId || null,
        sets,
        rest_seconds: ex.restSeconds,
        notes: ex.notes,
        primaryMuscles: ex.primaryMuscles,
      };
    }),
  };
}

const fallbackWorkout: WorkoutData = {
  name: 'Quick Workout',
  exercises: [
    {
      name: 'Push-ups',
      exerciseId: null,
      sets: [
        { target_reps: 15, target_weight: 0, type: 'working' },
        { target_reps: 15, target_weight: 0, type: 'working' },
        { target_reps: 15, target_weight: 0, type: 'working' },
      ],
      rest_seconds: 60,
      notes: 'Full range of motion',
    },
  ],
};

// Audio beep function using Web Audio API
function playBeep(frequency: number = 800, duration: number = 150, volume: number = 0.5) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, duration);
  } catch (e) {
    console.warn('Failed to play beep:', e);
  }
}

export default function WorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeSession, startSession, updateSessionData, completeSession, abandonSession } = useWorkoutSessions();
  const { sets: loggedSets, logSet, editSet, deleteSet, getSetsForExercise, pendingSync } = useSetLogs();
  const { profile } = useProfile();
  const { userEquipment, allEquipment } = useEquipment();
  const { injuries } = useInjuries();

  // Load workout data: prioritize active session from DB, then sessionStorage, then fallback
  const workoutData = useMemo<WorkoutData>(() => {
    if (typeof window === 'undefined') return fallbackWorkout;

    // First check if there's an active session with workout data in the database
    if (activeSession?.workout_data) {
      console.log('[Workout] Recovered session from database:', activeSession.id);
      return convertGeneratedWorkout(activeSession.workout_data as FullGeneratedWorkout);
    }

    // Fall back to sessionStorage
    try {
      const stored = sessionStorage.getItem('currentWorkout');
      if (stored) {
        const generated: GeneratedWorkout = JSON.parse(stored);
        return convertGeneratedWorkout(generated);
      }
    } catch (err) {
      console.error('Failed to parse workout:', err);
    }
    return fallbackWorkout;
  }, [activeSession]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [workoutRating, setWorkoutRating] = useState<number>(0);
  const [newPRs, setNewPRs] = useState<{ exerciseName: string; weight: number; reps: number }[]>([]);
  const [adjustedWeight, setAdjustedWeight] = useState<number | null>(null);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);

  // Warm-up phase state
  const [showWarmup, setShowWarmup] = useState(true);
  const [warmupCompleted, setWarmupCompleted] = useState<boolean[]>([]);
  const [warmupSkipped, setWarmupSkipped] = useState(false);

  // Edit mode state
  const [editingSet, setEditingSet] = useState<LoggedSet | null>(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editReps, setEditReps] = useState(0);

  // Exercise detail modal
  const [showExerciseDetail, setShowExerciseDetail] = useState<string | null>(null);

  // Exercise swap state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapAlternatives, setSwapAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);

  // Track beeps played to avoid duplicates
  const beepsPlayed = useRef<Set<number>>(new Set());

  // Initialize workoutExercises from workoutData
  useEffect(() => {
    if (workoutData.exercises && workoutData.exercises.length > 0 && workoutExercises.length === 0) {
      setWorkoutExercises(workoutData.exercises);
    }
  }, [workoutData.exercises, workoutExercises.length]);

  // Initialize warm-up completed array
  useEffect(() => {
    if (workoutData.warmup && workoutData.warmup.length > 0 && warmupCompleted.length === 0) {
      setWarmupCompleted(new Array(workoutData.warmup.length).fill(false));
    } else if (!workoutData.warmup || workoutData.warmup.length === 0) {
      setShowWarmup(false);
    }
  }, [workoutData.warmup, warmupCompleted.length]);

  // Wake lock management
  useEffect(() => {
    const acquireWakeLock = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await KeepAwake.keepAwake();
        } catch (e) {
          console.warn('Failed to acquire wake lock:', e);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await KeepAwake.allowSleep();
        } catch (e) {
          console.warn('Failed to release wake lock:', e);
        }
      }
    };

    acquireWakeLock();

    return () => {
      releaseWakeLock();
    };
  }, []);

  // Start workout session on mount
  useEffect(() => {
    const initSession = async () => {
      if (!sessionStarted && workoutData.name) {
        try {
          const session = await startSession(workoutData.name, undefined, 'gym');
          if (session) {
            setSessionId(session.id);
            setSessionStarted(true);
            setWorkoutStartTime(Date.now());
          }
        } catch (err) {
          console.error('Failed to start session:', err);
        }
      }
    };
    initSession();
  }, [startSession, sessionStarted, workoutData.name]);

  // Handle app state changes for timer persistence
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && restEndTime) {
        // App resumed - recalculate remaining time
        const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
        setRestTimeRemaining(remaining);
        if (remaining === 0) {
          setIsResting(false);
          setRestEndTime(null);
        }
      }
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [restEndTime]);

  // Timestamp-based rest timer with audio beeps
  useEffect(() => {
    if (!isResting || !restEndTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
      setRestTimeRemaining(remaining);

      // Play beeps at 3, 2, 1 seconds
      if (remaining <= 3 && remaining > 0 && !beepsPlayed.current.has(remaining)) {
        beepsPlayed.current.add(remaining);
        if (remaining === 1) {
          playBeep(1000, 300, 0.6); // Higher, longer beep for 1
        } else {
          playBeep(800, 150, 0.5);
        }
      }

      if (remaining === 0) {
        setIsResting(false);
        setRestEndTime(null);
        beepsPlayed.current.clear();
        playBeep(1200, 400, 0.7); // Final beep
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [isResting, restEndTime]);

  // Guard against empty exercises
  // Use workoutExercises for mutable state, fallback to workoutData.exercises during init
  const exercises = workoutExercises.length > 0 ? workoutExercises : workoutData.exercises;

  if (exercises.length === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0F2233' }}>
          <p style={{ color: '#F5F1EA', marginBottom: '1rem' }}>No workout found</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Back
          </button>
        </div>
      </AuthGuard>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  if (!exercise) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0F2233' }}>
          <p style={{ color: '#F5F1EA', marginBottom: '1rem' }}>Exercise not found</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Back
          </button>
        </div>
      </AuthGuard>
    );
  }

  const currentSet = exercise.sets[currentSetIndex];
  const totalSets = exercise.sets.length;
  const isLastSet = currentSetIndex === totalSets - 1;
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const exerciseLoggedSets = getSetsForExercise(exercise.exerciseId, exercise.name);
  const completedSetCount = exerciseLoggedSets.length;

  const lastLoggedWeight = exerciseLoggedSets.length > 0
    ? exerciseLoggedSets[exerciseLoggedSets.length - 1].weight
    : null;
  const displayWeight = adjustedWeight ?? lastLoggedWeight ?? (currentSet?.target_weight || 0);
  const targetReps = currentSet?.target_reps || 10;
  const setType = currentSet?.type || 'working';

  // Get next exercise info
  const nextExercise = !isLastExercise ? exercises[currentExerciseIndex + 1] : null;

  const startRest = (seconds: number) => {
    beepsPlayed.current.clear();
    setRestEndTime(Date.now() + seconds * 1000);
    setRestTimeRemaining(seconds);
    setIsResting(true);
  };

  const adjustRestTime = (delta: number) => {
    if (restEndTime) {
      const newEndTime = restEndTime + delta * 1000;
      setRestEndTime(newEndTime);
      setRestTimeRemaining(Math.max(0, Math.ceil((newEndTime - Date.now()) / 1000)));
    }
  };

  const handleLogSet = async (reps: number, weight: number) => {
    if (!sessionId) return;

    setShowWeightPicker(false);

    try {
      await logSet(
        sessionId,
        exercise.exerciseId,
        exercise.name,
        currentSetIndex + 1,
        weight,
        reps,
        currentSet?.target_weight ?? 0,
        targetReps,
        setType === 'warmup' ? 'warmup' : 'working'
      );

      // Check for new PR (if this weight exceeds the known PR)
      if (setType !== 'warmup' && exercise.prWeight && weight > exercise.prWeight) {
        setNewPRs(prev => {
          // Only add if we don't already have this exercise
          if (!prev.some(pr => pr.exerciseName === exercise.name)) {
            return [...prev, { exerciseName: exercise.name, weight, reps }];
          }
          // Update if this is a higher weight for the same exercise
          return prev.map(pr =>
            pr.exerciseName === exercise.name && weight > pr.weight
              ? { ...pr, weight, reps }
              : pr
          );
        });
      }
    } catch (err) {
      console.error('Failed to log set:', err);
    }

    if (isLastSet) {
      if (isLastExercise) {
        try {
          await completeSession(sessionId);
        } catch (err) {
          console.error('Failed to complete session:', err);
        }
        setShowComplete(true);
      } else {
        setCurrentExerciseIndex(i => i + 1);
        setCurrentSetIndex(0);
        setAdjustedWeight(null);
        startRest(exercise.rest_seconds);
      }
    } else {
      setCurrentSetIndex(i => i + 1);
      startRest(exercise.rest_seconds);
    }
  };

  const adjustWeight = (delta: number) => {
    setAdjustedWeight(prev => (prev ?? lastLoggedWeight ?? (currentSet?.target_weight || 0)) + delta);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestEndTime(null);
    beepsPlayed.current.clear();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Warm-up handlers
  const toggleWarmupItem = (index: number) => {
    setWarmupCompleted(prev => {
      const newCompleted = [...prev];
      newCompleted[index] = !newCompleted[index];
      return newCompleted;
    });
  };

  const skipWarmup = () => {
    setWarmupSkipped(true);
    setShowWarmup(false);
  };

  // Exercise swap handlers
  const openSwapModal = async () => {
    if (!user || !exercise) return;

    setShowSwapModal(true);
    setLoadingSwap(true);
    setSwapAlternatives([]);

    try {
      // Get equipment based on location (use gym equipment as default)
      const equipmentNames = allEquipment
        .filter(eq => userEquipment.some(ue => ue.equipment_id === eq.id))
        .map(eq => eq.name);

      // Format injuries for request
      const formattedInjuries = injuries.map(i => ({
        bodyPart: i.body_part,
        movementsToAvoid: i.movements_to_avoid || [],
      }));

      const alternatives = await getSwapAlternatives({
        userId: user.id,
        location: 'gym',
        experienceLevel: profile?.experience_level || 'intermediate',
        injuries: formattedInjuries,
        equipment: equipmentNames,
        swapExerciseId: exercise.exerciseId || '',
        swapTargetMuscles: exercise.primaryMuscles || [],
      });

      setSwapAlternatives(alternatives);
    } catch (err) {
      console.error('Failed to get swap alternatives:', err);
    } finally {
      setLoadingSwap(false);
    }
  };

  const handleSwapExercise = (alternative: ExerciseAlternative) => {
    // Create a new exercise entry with the alternative
    const newExercise: WorkoutExercise = {
      name: alternative.name,
      exerciseId: alternative.id,
      sets: exercise.sets, // Keep the same sets configuration
      rest_seconds: exercise.rest_seconds,
      notes: undefined,
      primaryMuscles: alternative.primaryMuscles,
    };

    // Update the workoutExercises array
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[currentExerciseIndex] = newExercise;
      return updated;
    });

    // Also update sessionStorage so it persists
    try {
      const stored = sessionStorage.getItem('currentWorkout');
      if (stored) {
        const generated: GeneratedWorkout = JSON.parse(stored);
        generated.exercises[currentExerciseIndex] = {
          exerciseId: alternative.id,
          name: alternative.name,
          sets: exercise.sets.length,
          reps: `${exercise.sets[0]?.target_reps || 10}`,
          restSeconds: exercise.rest_seconds,
          primaryMuscles: alternative.primaryMuscles,
          secondaryMuscles: alternative.secondaryMuscles,
        };
        sessionStorage.setItem('currentWorkout', JSON.stringify(generated));
      }
    } catch (err) {
      console.error('Failed to update sessionStorage:', err);
    }

    setShowSwapModal(false);
    setSwapAlternatives([]);
    setCurrentSetIndex(0); // Reset to first set of new exercise
  };

  const finishWarmup = () => {
    setShowWarmup(false);
  };

  const allWarmupCompleted = warmupCompleted.every(c => c);

  // Handle editing a logged set
  const openEditSet = (set: LoggedSet) => {
    setEditingSet(set);
    setEditWeight(set.weight);
    setEditReps(set.reps);
  };

  const saveEditSet = async () => {
    if (!editingSet) return;

    await editSet(editingSet.id, {
      weight: editWeight,
      reps: editReps,
    });
    setEditingSet(null);
  };

  const handleDeleteSet = async (setId: string) => {
    if (confirm('Delete this set?')) {
      await deleteSet(setId);
    }
  };

  // Calculate overall progress
  const totalExerciseSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedTotal = loggedSets.length;
  const progressPercent = (completedTotal / totalExerciseSets) * 100;

  // Calculate workout stats for completion screen
  const workoutStats = useMemo(() => {
    const totalVolume = loggedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
    const duration = workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000 / 60) : 0;
    const exerciseCount = workoutData.exercises.length;
    const setCount = loggedSets.length;

    return { totalVolume, duration, exerciseCount, setCount };
  }, [loggedSets, workoutStartTime, workoutData.exercises.length]);

  // Warm-up screen
  if (showWarmup && workoutData.warmup && workoutData.warmup.length > 0 && !warmupSkipped) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F2233' }}>
          {/* Header */}
          <header style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1rem' }}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  sessionStorage.removeItem('currentWorkout');
                  router.push('/');
                }}
                style={{ color: '#C9A75A', fontSize: '1rem', background: 'none', border: 'none' }}
              >
                ✕ End
              </button>
              <span style={{ color: '#22C55E', fontSize: '0.875rem', fontWeight: 600 }}>
                WARM-UP
              </span>
              <button
                onClick={skipWarmup}
                style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', background: 'none', border: 'none' }}
              >
                Skip →
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            <h1
              style={{
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: '1.5rem',
                color: '#F5F1EA',
                marginBottom: '0.5rem',
                textAlign: 'center',
              }}
            >
              Warm-up Stretches
            </h1>
            <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              {workoutData.warmup.length} stretches • ~{Math.round(workoutData.warmup.reduce((acc, w) => acc + w.duration, 0) / 60)} min
            </p>

            <div className="space-y-3">
              {workoutData.warmup.map((stretch, i) => (
                <button
                  key={i}
                  onClick={() => toggleWarmupItem(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: warmupCompleted[i] ? 'rgba(34, 197, 94, 0.1)' : 'rgba(26, 53, 80, 0.8)',
                    border: warmupCompleted[i] ? '2px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(201, 167, 90, 0.2)',
                    borderRadius: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: warmupCompleted[i] ? '2px solid #22C55E' : '2px solid rgba(201, 167, 90, 0.4)',
                      background: warmupCompleted[i] ? '#22C55E' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {warmupCompleted[i] && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F2233" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: warmupCompleted[i] ? 'rgba(245, 241, 234, 0.5)' : '#F5F1EA', fontSize: '1rem', fontWeight: 500, textDecoration: warmupCompleted[i] ? 'line-through' : 'none' }}>
                      {stretch.name}
                    </div>
                    {stretch.primaryMuscles && stretch.primaryMuscles.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {stretch.primaryMuscles.map(m => (
                          <span
                            key={m}
                            style={{
                              fontSize: '0.625rem',
                              color: 'rgba(245, 241, 234, 0.5)',
                              background: 'rgba(0, 0, 0, 0.2)',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '999px',
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div style={{ color: '#22C55E', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
                    {stretch.duration}s
                  </div>
                </button>
              ))}
            </div>
          </main>

          {/* Bottom action */}
          <div style={{ padding: '1.5rem', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}>
            <button
              onClick={finishWarmup}
              className="btn-primary w-full"
              style={{
                fontSize: '1.125rem',
                padding: '1.125rem',
                background: allWarmupCompleted ? '#22C55E' : 'linear-gradient(135deg, #C9A75A 0%, #B8963F 100%)',
              }}
            >
              {allWarmupCompleted ? 'Start Workout →' : 'Continue to Workout →'}
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Completion screen
  if (showComplete) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0F2233' }}>
          {/* Celebration emoji - bigger if PRs hit */}
          <div style={{ fontSize: newPRs.length > 0 ? '4rem' : '3.5rem', marginBottom: '1rem' }}>
            {newPRs.length > 0 ? '🏆' : '🎉'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '2rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
            {newPRs.length > 0 ? 'New Personal Records!' : 'Workout Complete!'}
          </h1>
          <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '1.5rem' }}>
            {newPRs.length > 0
              ? `You crushed ${newPRs.length} PR${newPRs.length > 1 ? 's' : ''} today!`
              : 'Great work. You crushed it.'}
          </p>

          {/* PR Badges */}
          {newPRs.length > 0 && (
            <div
              style={{
                width: '100%',
                maxWidth: '320px',
                marginBottom: '1rem',
              }}
            >
              {newPRs.map((pr, i) => (
                <div
                  key={i}
                  style={{
                    background: 'linear-gradient(135deg, rgba(201, 167, 90, 0.2) 0%, rgba(201, 167, 90, 0.1) 100%)',
                    border: '1px solid rgba(201, 167, 90, 0.4)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🏅</span>
                    <span style={{ color: '#F5F1EA', fontSize: '0.875rem', fontWeight: 500 }}>
                      {pr.exerciseName}
                    </span>
                  </div>
                  <span style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600 }}>
                    {pr.weight} × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              background: 'rgba(26, 53, 80, 0.8)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#C9A75A', fontSize: '2rem', fontWeight: 700 }}>
                  {workoutStats.duration}
                </div>
                <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>minutes</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#C9A75A', fontSize: '2rem', fontWeight: 700 }}>
                  {workoutStats.setCount}
                </div>
                <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>sets logged</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#C9A75A', fontSize: '2rem', fontWeight: 700 }}>
                  {workoutStats.exerciseCount}
                </div>
                <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>exercises</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#C9A75A', fontSize: '2rem', fontWeight: 700 }}>
                  {workoutStats.totalVolume.toLocaleString()}
                </div>
                <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>total lbs</div>
              </div>
            </div>
          </div>

          {/* Workout Rating */}
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              How was this workout?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setWorkoutRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2rem',
                    padding: '0.5rem',
                    minWidth: '48px',
                    minHeight: '48px',
                    cursor: 'pointer',
                    opacity: workoutRating >= star ? 1 : 0.3,
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                    transform: workoutRating >= star ? 'scale(1.1)' : 'scale(1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {pendingSync > 0 && (
            <p style={{ color: '#C9A75A', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              ⏳ {pendingSync} sets syncing...
            </p>
          )}

          <p style={{ color: '#22C55E', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            ✓ Saved to database
          </p>

          <button
            onClick={() => {
              sessionStorage.removeItem('currentWorkout');
              router.push('/');
            }}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            Back to Home
          </button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F2233' }}>
        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: 'rgba(201, 167, 90, 0.2)' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#C9A75A',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Header */}
        <header style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1rem' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                sessionStorage.removeItem('currentWorkout');
                router.push('/');
              }}
              style={{ color: '#C9A75A', fontSize: '1rem', background: 'none', border: 'none' }}
            >
              ✕ End
            </button>
            <div className="flex items-center gap-2">
              {pendingSync > 0 && (
                <span style={{ color: '#C9A75A', fontSize: '0.75rem' }}>
                  ⏳ {pendingSync}
                </span>
              )}
              <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                {currentExerciseIndex + 1} / {exercises.length}
              </span>
            </div>
            <button style={{ color: '#C9A75A', fontSize: '1rem', background: 'none', border: 'none' }}>
              ↻ Swap
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col p-6">
          {isResting ? (
            /* REST SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Rest
              </p>
              <div
                style={{
                  fontSize: '6rem',
                  fontWeight: 700,
                  color: restTimeRemaining <= 3 ? '#22C55E' : '#C9A75A',
                  fontFamily: 'var(--font-geist-mono)',
                  lineHeight: 1,
                  transition: 'color 0.2s ease',
                }}
              >
                {formatTime(restTimeRemaining)}
              </div>

              {/* Rest time adjustment buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => adjustRestTime(-30)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#C9A75A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  -30s
                </button>
                <button
                  onClick={() => adjustRestTime(-15)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#C9A75A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  -15s
                </button>
                <button
                  onClick={() => adjustRestTime(15)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#C9A75A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  +15s
                </button>
                <button
                  onClick={() => adjustRestTime(30)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#C9A75A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  +30s
                </button>
              </div>

              {/* Up Next section */}
              {nextExercise && (
                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'rgba(26, 53, 80, 0.8)',
                    borderRadius: '0.75rem',
                    width: '100%',
                    maxWidth: '320px',
                  }}
                >
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Up Next
                  </div>
                  <div style={{ color: '#F5F1EA', fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    {nextExercise.name}
                  </div>
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                    {nextExercise.sets.length} sets × {nextExercise.sets[0]?.target_reps || 10} reps
                    {nextExercise.sets[0]?.target_weight > 0 && (
                      <> • {nextExercise.sets[0].target_weight} lbs</>
                    )}
                  </div>
                </div>
              )}

              {/* If not next exercise, show current progress */}
              {!nextExercise && (
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem', marginTop: '1rem' }}>
                  Next: Set {currentSetIndex + 1} of {totalSets}
                </p>
              )}

              <button
                onClick={skipRest}
                style={{
                  marginTop: '2rem',
                  background: 'transparent',
                  border: '2px solid rgba(201, 167, 90, 0.3)',
                  color: '#C9A75A',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                }}
              >
                Skip Rest →
              </button>
            </div>
          ) : (
            /* EXERCISE SCREEN */
            <div className="flex-1 flex flex-col">
              {/* Exercise name */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2">
                  <h1
                    style={{
                      fontFamily: 'var(--font-libre-baskerville)',
                      fontSize: '1.75rem',
                      color: '#F5F1EA',
                      marginBottom: '0',
                    }}
                  >
                    {exercise.name}
                  </h1>
                  <button
                    onClick={() => setShowExerciseDetail(exercise.name)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(201, 167, 90, 0.15)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="How to do this exercise"
                  >
                    ?
                  </button>
                  <button
                    onClick={openSwapModal}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(201, 167, 90, 0.15)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Swap exercise"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3l4 4-4 4" />
                      <path d="M20 7H4" />
                      <path d="M8 21l-4-4 4-4" />
                      <path d="M4 17h16" />
                    </svg>
                  </button>
                </div>
                {exercise.notes && (
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {exercise.notes}
                  </p>
                )}
              </div>

              {/* Better Set Progress Indicator */}
              <div
                style={{
                  background: 'rgba(26, 53, 80, 0.8)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#C9A75A', fontSize: '1.25rem', fontWeight: 700 }}>
                    Set {currentSetIndex + 1} of {totalSets}
                  </span>
                  {exercise.lastWeight && (
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                      Last: {exercise.lastWeight} lbs
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {exercise.sets.map((set, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: i < completedSetCount
                          ? '#22C55E'
                          : i === currentSetIndex
                            ? '#C9A75A'
                            : 'rgba(201, 167, 90, 0.2)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Completed sets (tappable to edit) */}
              {exerciseLoggedSets.length > 0 && (
                <div className="mb-4">
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Completed Sets (tap to edit)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exerciseLoggedSets.map((set, i) => (
                      <button
                        key={set.id}
                        onClick={() => openEditSet(set)}
                        style={{
                          background: set.synced ? 'rgba(34, 197, 94, 0.1)' : 'rgba(201, 167, 90, 0.1)',
                          border: `1px solid ${set.synced ? 'rgba(34, 197, 94, 0.3)' : 'rgba(201, 167, 90, 0.3)'}`,
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          color: '#F5F1EA',
                          fontSize: '0.875rem',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{set.weight}</span>
                        <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}> × </span>
                        <span style={{ fontWeight: 600 }}>{set.reps}</span>
                        {!set.synced && <span style={{ color: '#C9A75A', marginLeft: '0.25rem' }}>⏳</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current set targets */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {setType === 'warmup' && (
                  <span style={{
                    color: '#C9A75A',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.5rem',
                  }}>
                    Warm-up Set
                  </span>
                )}

                {showWeightPicker ? (
                  /* Weight Picker */
                  <div className="w-full max-w-sm">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button
                        onClick={() => adjustWeight(-10)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: '2px solid rgba(201, 167, 90, 0.3)',
                          color: '#C9A75A',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                      >
                        -10
                      </button>
                      <button
                        onClick={() => adjustWeight(-5)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: '2px solid rgba(201, 167, 90, 0.3)',
                          color: '#C9A75A',
                          fontSize: '1rem',
                          fontWeight: 600,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                      >
                        -5
                      </button>
                      <div className="text-center px-4">
                        <div style={{ fontSize: '3rem', fontWeight: 700, color: '#C9A75A', lineHeight: 1 }}>
                          {displayWeight}
                        </div>
                        <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>lbs</div>
                      </div>
                      <button
                        onClick={() => adjustWeight(5)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: '2px solid rgba(201, 167, 90, 0.3)',
                          color: '#C9A75A',
                          fontSize: '1rem',
                          fontWeight: 600,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                      >
                        +5
                      </button>
                      <button
                        onClick={() => adjustWeight(10)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: '2px solid rgba(201, 167, 90, 0.3)',
                          color: '#C9A75A',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                      >
                        +10
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowWeightPicker(false)}
                        style={{
                          flex: 1,
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: '1px solid rgba(201, 167, 90, 0.3)',
                          borderRadius: '0.75rem',
                          color: 'rgba(245, 241, 234, 0.7)',
                          fontSize: '0.875rem',
                          padding: '0.75rem',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowWeightPicker(false)}
                        style={{
                          flex: 1,
                          background: '#C9A75A',
                          border: 'none',
                          borderRadius: '0.75rem',
                          color: '#0F2233',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          padding: '0.75rem',
                        }}
                      >
                        Confirm Weight
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal weight × reps display */
                  <div className="flex items-baseline gap-4 mb-2">
                    <button
                      onClick={() => setShowWeightPicker(true)}
                      className="text-center"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{
                        fontSize: '4rem',
                        fontWeight: 700,
                        color: adjustedWeight ? '#C9A75A' : '#F5F1EA',
                        lineHeight: 1,
                        transition: 'color 0.2s',
                      }}>
                        {displayWeight}
                      </div>
                      <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                        lbs <span style={{ color: '#C9A75A' }}>▼</span>
                      </div>
                    </button>
                    <div style={{ color: 'rgba(245, 241, 234, 0.3)', fontSize: '2rem' }}>×</div>
                    <div className="text-center">
                      <div style={{ fontSize: '4rem', fontWeight: 700, color: '#F5F1EA', lineHeight: 1 }}>
                        {targetReps}
                      </div>
                      <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>reps</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Bottom action area */}
        {!isResting && (
          <div style={{ padding: '1.5rem', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)', background: 'linear-gradient(180deg, transparent, #0F2233 30%)' }}>
            {/* Quick log - hit target */}
            <button
              onClick={() => handleLogSet(targetReps, displayWeight)}
              className="btn-primary w-full mb-3"
              style={{ fontSize: '1.25rem', padding: '1.25rem' }}
            >
              Done — {displayWeight} × {targetReps} ✓
            </button>

            {/* Adjust reps row */}
            <div className="flex gap-3">
              <button
                onClick={() => handleLogSet(targetReps - 1, displayWeight)}
                style={{
                  flex: 1,
                  background: 'rgba(201, 167, 90, 0.1)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.875rem',
                  color: '#F5F1EA',
                  fontSize: '0.875rem',
                }}
              >
                {targetReps - 1} reps
              </button>
              <button
                onClick={() => handleLogSet(targetReps + 1, displayWeight)}
                style={{
                  flex: 1,
                  background: 'rgba(201, 167, 90, 0.1)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.875rem',
                  color: '#F5F1EA',
                  fontSize: '0.875rem',
                }}
              >
                {targetReps + 1} reps
              </button>
              <button
                onClick={() => setShowWeightPicker(true)}
                style={{
                  flex: 1,
                  background: 'rgba(201, 167, 90, 0.1)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.875rem',
                  color: '#C9A75A',
                  fontSize: '0.875rem',
                }}
              >
                Adjust lbs
              </button>
            </div>
          </div>
        )}

        {/* Next exercise preview - show when not in rest */}
        {!isLastExercise && !isResting && (
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'rgba(26, 53, 80, 0.5)',
              borderTop: '1px solid rgba(201, 167, 90, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Up Next
                </span>
                <p style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>
                  {exercises[currentExerciseIndex + 1].name}
                </p>
              </div>
              <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem' }}>
                {exercises[currentExerciseIndex + 1].sets.length} sets
              </span>
            </div>
          </div>
        )}

        {/* Edit Set Modal */}
        {editingSet && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1.5rem',
            }}
            onClick={() => setEditingSet(null)}
          >
            <div
              style={{
                background: '#1A3550',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '320px',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ color: '#F5F1EA', fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
                Edit Set {editingSet.set_number}
              </h3>

              {/* Weight adjustment */}
              <div className="mb-4">
                <label style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Weight (lbs)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditWeight(w => Math.max(0, w - 5))}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.5rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    -
                  </button>
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: '#F5F1EA',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {editWeight}
                  </div>
                  <button
                    onClick={() => setEditWeight(w => w + 5)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.5rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reps adjustment */}
              <div className="mb-6">
                <label style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Reps
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditReps(r => Math.max(0, r - 1))}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.5rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    -
                  </button>
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: '#F5F1EA',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {editReps}
                  </div>
                  <button
                    onClick={() => setEditReps(r => r + 1)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.5rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: '#C9A75A',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteSet(editingSet.id)}
                  style={{
                    flex: 1,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    color: '#EF4444',
                    fontSize: '0.875rem',
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={saveEditSet}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Detail Modal */}
        {showExerciseDetail && (
          <ExerciseDetailModal
            exerciseName={showExerciseDetail}
            onClose={() => setShowExerciseDetail(null)}
          />
        )}

        {/* Swap Exercise Modal */}
        {showSwapModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowSwapModal(false)}
          >
            <div
              className="w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{
                background: '#1A3550',
                borderRadius: '1rem',
                border: '1px solid rgba(201, 167, 90, 0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ color: '#C9A75A', fontSize: '1rem', fontWeight: 600 }}>
                  Swap Exercise
                </h3>
                <button
                  onClick={() => setShowSwapModal(false)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    color: 'rgba(245, 241, 234, 0.6)',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Replacing: <span style={{ color: '#F5F1EA' }}>{exercise.name}</span>
                </p>

                {loadingSwap ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-2 mb-3"
                      style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: '#C9A75A' }}
                    />
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                      Finding alternatives...
                    </p>
                  </div>
                ) : swapAlternatives.length === 0 ? (
                  <div className="text-center py-8">
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                      No alternatives found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {swapAlternatives.map(alt => (
                      <button
                        key={alt.id}
                        onClick={() => handleSwapExercise(alt)}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'rgba(15, 34, 51, 0.5)',
                          border: '1px solid rgba(201, 167, 90, 0.2)',
                          borderRadius: '0.75rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'rgba(201, 167, 90, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(201, 167, 90, 0.4)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'rgba(15, 34, 51, 0.5)';
                          e.currentTarget.style.borderColor = 'rgba(201, 167, 90, 0.2)';
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span style={{ color: '#F5F1EA', fontSize: '0.9375rem', fontWeight: 500 }}>
                              {alt.name}
                            </span>
                            {alt.source === 'ai_pending' && (
                              <span
                                style={{
                                  marginLeft: '0.5rem',
                                  padding: '0.125rem 0.375rem',
                                  background: 'rgba(147, 51, 234, 0.2)',
                                  border: '1px solid rgba(147, 51, 234, 0.3)',
                                  borderRadius: '0.25rem',
                                  color: '#A855F7',
                                  fontSize: '0.625rem',
                                  fontWeight: 600,
                                }}
                              >
                                AI
                              </span>
                            )}
                          </div>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="rgba(245, 241, 234, 0.4)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                        <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {alt.primaryMuscles.join(', ')}
                          {alt.equipmentRequired.length > 0 && ` • ${alt.equipmentRequired.join(', ')}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
