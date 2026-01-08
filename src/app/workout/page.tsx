'use client';

import { useState, useEffect } from 'react';

// Mock AI-generated workout data
const workoutData = {
  name: 'Upper Body Push',
  exercises: [
    {
      name: 'Bench Press',
      sets: [
        { target_reps: 10, target_weight: 135, type: 'warmup' },
        { target_reps: 8, target_weight: 165, type: 'working' },
        { target_reps: 8, target_weight: 165, type: 'working' },
        { target_reps: 8, target_weight: 165, type: 'working' },
        { target_reps: 10, target_weight: 155, type: 'working' },
      ],
      rest_seconds: 90,
      notes: 'Control the descent, explode up',
    },
    {
      name: 'Incline DB Press',
      sets: [
        { target_reps: 10, target_weight: 50, type: 'working' },
        { target_reps: 10, target_weight: 50, type: 'working' },
        { target_reps: 10, target_weight: 50, type: 'working' },
      ],
      rest_seconds: 75,
      notes: 'Full stretch at bottom',
    },
    {
      name: 'Overhead Press',
      sets: [
        { target_reps: 8, target_weight: 95, type: 'working' },
        { target_reps: 8, target_weight: 95, type: 'working' },
        { target_reps: 8, target_weight: 95, type: 'working' },
      ],
      rest_seconds: 90,
      notes: 'Brace core, no back lean',
    },
    {
      name: 'Lateral Raises',
      sets: [
        { target_reps: 15, target_weight: 20, type: 'working' },
        { target_reps: 15, target_weight: 20, type: 'working' },
        { target_reps: 15, target_weight: 20, type: 'working' },
      ],
      rest_seconds: 60,
      notes: 'Slight bend in elbows, lead with pinkies',
    },
    {
      name: 'Tricep Pushdowns',
      sets: [
        { target_reps: 12, target_weight: 40, type: 'working' },
        { target_reps: 12, target_weight: 40, type: 'working' },
        { target_reps: 12, target_weight: 40, type: 'working' },
      ],
      rest_seconds: 60,
      notes: 'Lock out at bottom, elbows pinned',
    },
  ],
};

export default function WorkoutPage() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [completedSets, setCompletedSets] = useState<{ reps: number; weight: number }[][]>(
    workoutData.exercises.map(() => [])
  );
  const [showComplete, setShowComplete] = useState(false);
  const [adjustedWeight, setAdjustedWeight] = useState<number | null>(null);
  const [showWeightPicker, setShowWeightPicker] = useState(false);

  const exercise = workoutData.exercises[currentExerciseIndex];
  const currentSet = exercise.sets[currentSetIndex];
  const totalSets = exercise.sets.length;
  const isLastSet = currentSetIndex === totalSets - 1;
  const isLastExercise = currentExerciseIndex === workoutData.exercises.length - 1;

  // Use adjusted weight if set, otherwise target
  const displayWeight = adjustedWeight ?? currentSet.target_weight;

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

  const logSet = (reps: number, weight: number) => {
    // Save the completed set
    const newCompleted = [...completedSets];
    newCompleted[currentExerciseIndex] = [
      ...newCompleted[currentExerciseIndex],
      { reps, weight }
    ];
    setCompletedSets(newCompleted);
    setShowWeightPicker(false);

    // Move to next set or exercise
    if (isLastSet) {
      if (isLastExercise) {
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
    setAdjustedWeight(prev => (prev ?? currentSet.target_weight) + delta);
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

  // Calculate overall progress
  const totalExerciseSets = workoutData.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedTotal = completedSets.reduce((acc, sets) => acc + sets.length, 0);
  const progressPercent = (completedTotal / totalExerciseSets) * 100;

  if (showComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0F2233' }}>
        <div className="text-6xl mb-4">🎉</div>
        <h1 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '2rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
          Workout Complete!
        </h1>
        <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
          Great work. You crushed it.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
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
            onClick={() => window.location.href = '/'}
            style={{ color: '#C9A75A', fontSize: '1rem', background: 'none', border: 'none' }}
          >
            ✕ End
          </button>
          <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
            {currentExerciseIndex + 1} / {workoutData.exercises.length}
          </span>
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
            <div className="text-center mb-8">
              <h1
                style={{
                  fontFamily: 'var(--font-libre-baskerville)',
                  fontSize: '2rem',
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

            {/* Set indicator */}
            <div className="flex justify-center gap-2 mb-8">
              {exercise.sets.map((set, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentSetIndex ? '2.5rem' : '0.75rem',
                    height: '0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: i < currentSetIndex
                      ? '#C9A75A'
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
              {currentSet.type === 'warmup' && (
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
                      {currentSet.target_reps}
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
            onClick={() => logSet(currentSet.target_reps, displayWeight)}
            className="btn-primary w-full mb-3"
            style={{ fontSize: '1.25rem', padding: '1.25rem' }}
          >
            Done — {displayWeight} × {currentSet.target_reps} ✓
          </button>

          {/* Adjust reps row */}
          <div className="flex gap-3">
            <button
              onClick={() => logSet(currentSet.target_reps - 1, displayWeight)}
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
              {currentSet.target_reps - 1} reps
            </button>
            <button
              onClick={() => logSet(currentSet.target_reps + 1, displayWeight)}
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
              {currentSet.target_reps + 1} reps
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
    </div>
  );
}
