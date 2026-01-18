'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import type { GeneratedWeeklyPlan, GeneratedWorkout, GeneratedExercise, ExerciseAlternative } from '@/lib/generateWorkout';
import { getSwapAlternatives } from '@/lib/generateWorkout';
import { getSupabase } from '@/lib/supabase/client';
import { RefreshIcon, ChevronDownIcon, XIcon } from '@/components/Icons';

interface WeeklyPlanReviewProps {
  plan: GeneratedWeeklyPlan;
  onClose: () => void;
  onRegenerate: () => void;
  onRegenerateDay?: (dayIndex: number) => Promise<GeneratedWorkout | null>;
  regenerating: boolean;
  // Context for swaps
  location?: 'gym' | 'home' | 'outdoor';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  customEquipment?: string[];
}

function getTodayIndex(): number {
  return new Date().getDay();
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes}m`;
}

// Infer muscles from exercise name
function inferMusclesFromName(name: string): string[] {
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
  }
  return ['chest', 'back', 'shoulders'];
}

export function WeeklyPlanReview({
  plan: initialPlan,
  onClose,
  onRegenerate,
  onRegenerateDay,
  regenerating,
  location = 'gym',
  experienceLevel = 'intermediate',
  equipment = [],
  customEquipment = [],
}: WeeklyPlanReviewProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Local state for the plan (so we can modify it)
  const [plan, setPlan] = useState(initialPlan);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Swap state
  const [swappingDayIndex, setSwappingDayIndex] = useState<number | null>(null);
  const [swappingExerciseIndex, setSwappingExerciseIndex] = useState<number | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  // Regenerate day state
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);

  const todayIndex = getTodayIndex();

  // Open swap modal for an exercise
  const handleOpenSwap = async (dayIndex: number, exerciseIndex: number) => {
    const day = plan.days[dayIndex];
    const exercise = day.workout.exercises[exerciseIndex];

    setSwappingDayIndex(dayIndex);
    setSwappingExerciseIndex(exerciseIndex);
    setLoadingAlternatives(true);
    setSwapAlternatives([]);

    try {
      let targetMuscles: string[] = [];

      if (exercise.primaryMuscles?.length) {
        targetMuscles = [...exercise.primaryMuscles];
      }
      if (exercise.secondaryMuscles?.length) {
        targetMuscles = [...targetMuscles, ...exercise.secondaryMuscles];
      }
      if (targetMuscles.length === 0 && day.workout.targetMuscles?.length) {
        targetMuscles = [...day.workout.targetMuscles];
      }
      if (targetMuscles.length === 0) {
        targetMuscles = inferMusclesFromName(exercise.name);
      }

      const alternatives = await getSwapAlternatives({
        userId: user!.id,
        location,
        experienceLevel,
        equipment,
        customEquipment,
        swapExerciseId: exercise.exerciseId || '',
        swapTargetMuscles: targetMuscles,
        workoutStyle: day.workout.workoutStyle,
      });

      setSwapAlternatives(alternatives || []);
    } catch (err) {
      console.error('[Swap] Failed to get alternatives:', err);
      setSwapAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Swap an exercise with selected alternative
  const handleSwapExercise = (alternative: ExerciseAlternative) => {
    if (swappingDayIndex === null || swappingExerciseIndex === null) return;

    const day = plan.days[swappingDayIndex];
    const currentExercise = day.workout.exercises[swappingExerciseIndex];

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

    const updatedExercises = [...day.workout.exercises];
    updatedExercises[swappingExerciseIndex] = newExercise;

    const updatedDays = [...plan.days];
    updatedDays[swappingDayIndex] = {
      ...day,
      workout: {
        ...day.workout,
        exercises: updatedExercises,
      },
    };

    setPlan({ ...plan, days: updatedDays });
    setSwappingDayIndex(null);
    setSwappingExerciseIndex(null);
    setSwapAlternatives([]);
  };

  // Regenerate a single day
  const handleRegenerateDay = async (dayIndex: number) => {
    if (!onRegenerateDay) return;

    setRegeneratingDay(dayIndex);
    try {
      const newWorkout = await onRegenerateDay(dayIndex);
      if (newWorkout) {
        const updatedDays = [...plan.days];
        updatedDays[dayIndex] = {
          ...updatedDays[dayIndex],
          workout: newWorkout,
        };
        setPlan({ ...plan, days: updatedDays });
      }
    } catch (err) {
      console.error('Failed to regenerate day:', err);
    } finally {
      setRegeneratingDay(null);
    }
  };

  // Save plan to database
  const handleSavePlan = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = getSupabase();

      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: plan.name,
          description: `${plan.days.length}-day training plan`,
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', planData.id);

      for (const day of plan.days) {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            name: day.workout.name,
            workout_type: day.workout.workoutType || 'traditional',
            target_muscles: day.workout.targetMuscles || [],
            estimated_duration: day.workout.duration || 45,
            is_saved: true,
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        const exerciseInserts = day.workout.exercises.map((ex, idx) => ({
          workout_id: workoutData.id,
          exercise_id: ex.exerciseId || null,
          target_sets: ex.sets || 3,
          target_reps: parseInt(ex.reps) || 10,
          target_weight: ex.weight ? parseFloat(ex.weight) : null,
          order_index: idx,
          notes: ex.notes || null,
        }));

        const { error: exError } = await supabase
          .from('workout_exercises')
          .insert(exerciseInserts);

        if (exError) throw exError;

        const { error: dayError } = await supabase
          .from('workout_plan_days')
          .insert({
            plan_id: planData.id,
            day_of_week: day.day_of_week,
            workout_id: workoutData.id,
            muscle_focus: day.workout.targetMuscles || [],
            workout_style: day.workout.workoutType || 'traditional',
          });

        if (dayError) throw dayError;
      }

      setSaved(true);
    } catch (err: any) {
      console.error('Failed to save plan:', err);
      setError(`Failed to save plan: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [user, plan]);

  const handleStartWorkout = useCallback((workout: GeneratedWorkout) => {
    sessionStorage.setItem('currentWorkout', JSON.stringify(workout));
    router.push('/workout');
  }, [router]);

  const totalExercises = plan.days.reduce((sum, d) => sum + d.workout.exercises.length, 0);
  const avgDuration = Math.round(
    plan.days.reduce((sum, d) => sum + (d.workout.duration || 45), 0) / plan.days.length
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            style={{
              color: colors.textMuted,
              fontSize: '0.875rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          {!saved && (
            <button
              onClick={handleSavePlan}
              disabled={saving}
              style={{
                color: colors.bg,
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          )}
          {saved && (
            <span style={{ color: colors.success, fontSize: '0.875rem', fontWeight: 600 }}>
              ✓ Saved!
            </span>
          )}
        </div>
        <h1 style={{ color: colors.text, fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
          {plan.name}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.375rem 0 0' }}>
          {plan.days.length} workouts · ~{formatDuration(avgDuration)} each · {totalExercises} exercises
        </p>
        {error && (
          <p style={{ color: colors.error, fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>
        )}
      </div>

      {/* Plan Days */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {plan.days.map((day, dayIdx) => {
            const isToday = day.day_of_week === todayIndex;
            const isExpanded = expandedDay === dayIdx;
            const workout = day.workout;
            const isRegenerating = regeneratingDay === dayIdx;

            return (
              <div
                key={dayIdx}
                style={{
                  background: colors.cardBg,
                  borderRadius: '1rem',
                  border: isToday ? `2px solid ${colors.accent}` : `1.5px solid ${colors.borderSubtle}`,
                  overflow: 'hidden',
                }}
              >
                {/* Day Header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: colors.text, fontWeight: 600, fontSize: '1.0625rem' }}>
                        {day.day_name}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                            color: colors.bg,
                            fontSize: '0.625rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <div style={{ color: colors.accent, fontSize: '0.9375rem', marginTop: '0.25rem', fontWeight: 500 }}>
                      {workout.name}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      {workout.exercises.length} exercises · {formatDuration(workout.duration || 45)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {saved && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartWorkout(workout);
                        }}
                        style={{
                          background: isToday
                            ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                            : colors.accentMuted,
                          color: isToday ? colors.bg : colors.accent,
                          padding: '0.5rem 1rem',
                          borderRadius: '0.625rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Start
                      </button>
                    )}
                    <div
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDownIcon size={20} color={colors.textMuted} />
                    </div>
                  </div>
                </button>

                {/* Expanded Exercise List */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                    {/* Day Actions */}
                    {!saved && (
                      <div
                        style={{
                          padding: '0.75rem 1.25rem',
                          background: colors.inputBg,
                          display: 'flex',
                          gap: '0.5rem',
                        }}
                      >
                        <button
                          onClick={() => handleRegenerateDay(dayIdx)}
                          disabled={isRegenerating || !onRegenerateDay}
                          style={{
                            flex: 1,
                            padding: '0.625rem 0.75rem',
                            borderRadius: '0.5rem',
                            background: 'transparent',
                            border: `1.5px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            cursor: isRegenerating || !onRegenerateDay ? 'not-allowed' : 'pointer',
                            opacity: isRegenerating || !onRegenerateDay ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <RefreshIcon size={16} color={colors.textMuted} />
                          {isRegenerating ? 'Regenerating...' : 'Regenerate Day'}
                        </button>
                      </div>
                    )}

                    {/* Exercises */}
                    <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                      {workout.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          style={{
                            padding: '0.875rem',
                            background: colors.inputBg,
                            borderRadius: '0.75rem',
                            marginBottom: exIdx < workout.exercises.length - 1 ? '0.5rem' : 0,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: colors.text, fontSize: '0.9375rem', fontWeight: 600 }}>
                                {ex.name}
                              </div>
                              {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
                                <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                  {ex.primaryMuscles.join(', ')}
                                </div>
                              )}
                              {ex.notes && (
                                <div style={{ color: colors.textMuted, fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.375rem' }}>
                                  {ex.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', marginLeft: '0.75rem' }}>
                              <div style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600 }}>
                                {ex.sets || 3} × {ex.reps}
                              </div>
                              <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                {ex.restSeconds || 60}s rest
                              </div>
                              {!saved && (
                                <button
                                  onClick={() => handleOpenSwap(dayIdx, exIdx)}
                                  style={{
                                    marginTop: '0.5rem',
                                    padding: '0.375rem 0.625rem',
                                    borderRadius: '0.375rem',
                                    background: 'transparent',
                                    border: `1px solid ${colors.border}`,
                                    color: colors.textMuted,
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Swap
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Start Button in expanded view */}
                    {saved && (
                      <div style={{ padding: '0 1.25rem 1.25rem' }}>
                        <button
                          onClick={() => handleStartWorkout(workout)}
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                            color: colors.bg,
                            borderRadius: '0.75rem',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Start {day.day_name}'s Workout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: '1rem 1.25rem',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${colors.borderSubtle}`,
          background: colors.bg,
        }}
      >
        {!saved ? (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'transparent',
                border: `1.5px solid ${colors.border}`,
                color: colors.text,
                borderRadius: '0.875rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <RefreshIcon size={18} color={colors.textMuted} />
              {regenerating ? 'Regenerating...' : 'Regenerate All'}
            </button>
            <button
              onClick={handleSavePlan}
              disabled={saving}
              style={{
                flex: 2,
                padding: '1rem',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                color: colors.bg,
                borderRadius: '0.875rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                border: 'none',
                boxShadow: '0 4px 12px rgba(201, 167, 90, 0.3)',
              }}
            >
              {saving ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: colors.success, fontSize: '0.9375rem', textAlign: 'center', fontWeight: 500, marginBottom: '0.75rem' }}>
              ✓ Plan saved and activated!
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '1rem',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                color: colors.bg,
                borderRadius: '0.875rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Swap Modal */}
      {swappingExerciseIndex !== null && swappingDayIndex !== null && (
        <div
          onClick={() => {
            setSwappingDayIndex(null);
            setSwappingExerciseIndex(null);
            setSwapAlternatives([]);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
                <h3 style={{ color: colors.text, margin: 0, fontSize: '1.0625rem', fontWeight: 600 }}>
                  Swap Exercise
                </h3>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Replacing: {plan.days[swappingDayIndex]?.workout.exercises[swappingExerciseIndex]?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSwappingDayIndex(null);
                  setSwappingExerciseIndex(null);
                  setSwapAlternatives([]);
                }}
                style={{
                  background: colors.inputBg,
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <XIcon size={18} color={colors.textMuted} />
              </button>
            </div>
            <div style={{
              padding: '1rem 1.25rem',
              overflow: 'auto',
              flex: 1,
            }}>
              {loadingAlternatives ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${colors.accent}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 0.75rem',
                    }}
                  />
                  Finding alternatives...
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
                        padding: '0.875rem 1rem',
                        background: colors.inputBg,
                        border: `1.5px solid ${colors.borderSubtle}`,
                        borderRadius: '0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ color: colors.text, fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {alt.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {alt.primaryMuscles.map(m => (
                          <span
                            key={m}
                            style={{
                              background: colors.accentMuted,
                              color: colors.accent,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.6875rem',
                              fontWeight: 500,
                            }}
                          >
                            {m}
                          </span>
                        ))}
                        {alt.isCompound && (
                          <span
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: colors.success,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.6875rem',
                              fontWeight: 500,
                            }}
                          >
                            compound
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
  );
}
