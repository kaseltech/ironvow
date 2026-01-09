'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useWorkoutSessions, useSetLogs, type LoggedSet } from '@/hooks/useSupabase';
import type { GeneratedWorkout } from '@/lib/generateWorkout';

interface WorkoutExercise {
  name: string;
  exerciseId: string | null; // Can be null for unmatched AI exercises
  sets: { target_reps: number; target_weight: number; type: 'warmup' | 'working' }[];
  rest_seconds: number;
  notes?: string;
}

interface WorkoutData {
  name: string;
  exercises: WorkoutExercise[];
}

// Convert GeneratedWorkout to our internal format
function convertGeneratedWorkout(generated: GeneratedWorkout): WorkoutData {
  return {
    name: generated.name,
    exercises: generated.exercises.map(ex => {
      // Parse reps (could be "8-10" or "AMRAP" or "12")
      const repsStr = ex.reps.split('-')[0].replace(/[^0-9]/g, '');
      const targetReps = parseInt(repsStr) || 10;

      // Parse suggested weight from RX system (could be "135" or undefined)
      const suggestedWeight = ex.weight ? parseInt(ex.weight) || 0 : 0;

      // Create sets array
      const sets: { target_reps: number; target_weight: number; type: 'warmup' | 'working' }[] = [];
      for (let i = 0; i < ex.sets; i++) {
        sets.push({
          target_reps: targetReps,
          target_weight: suggestedWeight, // Use RX suggested weight
          type: 'working',
        });
      }

      return {
        name: ex.name,
        exerciseId: ex.exerciseId || null, // Use real ID or null
        sets,
        rest_seconds: ex.restSeconds,
        notes: ex.notes,
      };
    }),
  };
}

// Fallback workout if none in sessionStorage
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

export default function WorkoutPage() {
  const router = useRouter();
  const { startSession, completeSession } = useWorkoutSessions();
  const { sets: loggedSets, logSet, editSet, deleteSet, getSetsForExercise, pendingSync } = useSetLogs();

  // Load workout from sessionStorage or use fallback
  const workoutData = useMemo<WorkoutData>(() => {
    if (typeof window === 'undefined') return fallbackWorkout;

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
  }, []);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [adjustedWeight, setAdjustedWeight] = useState<number | null>(null);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Edit mode state
  const [editingSet, setEditingSet] = useState<LoggedSet | null>(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editReps, setEditReps] = useState(0);

  // Start workout session on mount
  useEffect(() => {
    const initSession = async () => {
      if (!sessionStarted && workoutData.name) {
        try {
          const session = await startSession(workoutData.name, undefined, 'gym');
          if (session) {
            setSessionId(session.id);
            setSessionStarted(true);
          }
        } catch (err) {
          console.error('Failed to start session:', err);
        }
      }
    };
    initSession();
  }, [startSession, sessionStarted, workoutData.name]);

  // Guard against empty exercises
  if (workoutData.exercises.length === 0) {
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

  const exercise = workoutData.exercises[currentExerciseIndex];
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
  const isLastExercise = currentExerciseIndex === workoutData.exercises.length - 1;

  // Get logged sets for current exercise
  const exerciseLoggedSets = getSetsForExercise(exercise.exerciseId, exercise.name);
  const completedSetCount = exerciseLoggedSets.length;

  // Use adjusted weight if set, otherwise target or last logged weight
  const lastLoggedWeight = exerciseLoggedSets.length > 0
    ? exerciseLoggedSets[exerciseLoggedSets.length - 1].weight
    : null;
  const displayWeight = adjustedWeight ?? lastLoggedWeight ?? (currentSet?.target_weight || 0);
  const targetReps = currentSet?.target_reps || 10;
  const setType = currentSet?.type || 'working';

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime(t => t - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const handleLogSet = async (reps: number, weight: number) => {
    if (!sessionId) return;

    setShowWeightPicker(false);

    // Log to database with proper exercise ID
    try {
      await logSet(
        sessionId,
        exercise.exerciseId, // Real UUID or null
        exercise.name,
        currentSetIndex + 1,
        weight,
        reps,
        currentSet?.target_weight ?? 0,
        targetReps,
        setType === 'warmup' ? 'warmup' : 'working'
      );
    } catch (err) {
      console.error('Failed to log set:', err);
      // Continue anyway - offline queue will handle it
    }

    // Move to next set or exercise
    if (isLastSet) {
      if (isLastExercise) {
        // Complete the session
        try {
          await completeSession(sessionId);
        } catch (err) {
          console.error('Failed to complete session:', err);
        }
        setShowComplete(true);
      } else {
        setCurrentExerciseIndex(i => i + 1);
        setCurrentSetIndex(0);
        setAdjustedWeight(null); // Reset for new exercise
        setIsResting(true);
        setRestTime(exercise.rest_seconds);
      }
    } else {
      setCurrentSetIndex(i => i + 1);
      // Keep adjusted weight for next set (same exercise)
      setIsResting(true);
      setRestTime(exercise.rest_seconds);
    }
  };

  const adjustWeight = (delta: number) => {
    setAdjustedWeight(prev => (prev ?? lastLoggedWeight ?? (currentSet?.target_weight || 0)) + delta);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
  const totalExerciseSets = workoutData.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedTotal = loggedSets.length;
  const progressPercent = (completedTotal / totalExerciseSets) * 100;

  if (showComplete) {
    return (
      <AuthGuard>
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0F2233' }}>
        <div className="text-6xl mb-4">🎉</div>
        <h1 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '2rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
          Workout Complete!
        </h1>
        <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
          Great work. You crushed it.
        </p>
        {pendingSync > 0 && (
          <p style={{ color: '#C9A75A', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⏳ {pendingSync} sets syncing...
          </p>
        )}
        <button
          onClick={() => {
            sessionStorage.removeItem('currentWorkout');
            router.push('/');
          }}
          className="btn-primary"
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
      <header className="safe-area-top" style={{ padding: '1rem 1.5rem' }}>
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
              {currentExerciseIndex + 1} / {workoutData.exercises.length}
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
                color: '#C9A75A',
                fontFamily: 'var(--font-geist-mono)',
                lineHeight: 1,
              }}
            >
              {formatTime(restTime)}
            </div>
            <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem', marginTop: '1rem' }}>
              Next: Set {currentSetIndex + 1} of {totalSets}
            </p>
            <button
              onClick={skipRest}
              style={{
                marginTop: '3rem',
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
              <h1
                style={{
                  fontFamily: 'var(--font-libre-baskerville)',
                  fontSize: '1.75rem',
                  color: '#F5F1EA',
                  marginBottom: '0.5rem',
                }}
              >
                {exercise.name}
              </h1>
              {exercise.notes && (
                <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                  {exercise.notes}
                </p>
              )}
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

            {/* Set indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {exercise.sets.map((set, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentSetIndex ? '2.5rem' : '0.75rem',
                    height: '0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: i < completedSetCount
                      ? '#22C55E' // Green for completed
                      : i === currentSetIndex
                        ? '#C9A75A'
                        : 'rgba(201, 167, 90, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

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
                      }}
                    >
                      +10
                    </button>
                  </div>
                  <button
                    onClick={() => setShowWeightPicker(false)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(245, 241, 234, 0.5)',
                      fontSize: '0.875rem',
                      padding: '0.5rem',
                    }}
                  >
                    Done adjusting
                  </button>
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

              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem', marginTop: '1rem' }}>
                Set {currentSetIndex + 1} of {totalSets}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom action area */}
      {!isResting && (
        <div className="safe-area-bottom p-6" style={{ background: 'linear-gradient(180deg, transparent, #0F2233 30%)' }}>
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

      {/* Next exercise preview */}
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
                {workoutData.exercises[currentExerciseIndex + 1].name}
              </p>
            </div>
            <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem' }}>
              {workoutData.exercises[currentExerciseIndex + 1].sets.length} sets
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
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.5rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
                    fontSize: '1.25rem',
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={editWeight}
                  onChange={e => setEditWeight(parseInt(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 34, 51, 0.5)',
                    border: '1px solid rgba(201, 167, 90, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#F5F1EA',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                  }}
                />
                <button
                  onClick={() => setEditWeight(w => w + 5)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.5rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
                    fontSize: '1.25rem',
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
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.5rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
                    fontSize: '1.25rem',
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={editReps}
                  onChange={e => setEditReps(parseInt(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 34, 51, 0.5)',
                    border: '1px solid rgba(201, 167, 90, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#F5F1EA',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                  }}
                />
                <button
                  onClick={() => setEditReps(r => r + 1)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.5rem',
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
                    fontSize: '1.25rem',
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
    </div>
    </AuthGuard>
  );
}
