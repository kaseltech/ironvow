'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import type { GeneratedWeeklyPlan, GeneratedWorkout } from '@/lib/generateWorkout';
import { getSupabase } from '@/lib/supabase/client';

interface WeeklyPlanReviewProps {
  plan: GeneratedWeeklyPlan;
  onClose: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

// Get today's day index (0=Sun, 1=Mon...6=Sat)
function getTodayIndex(): number {
  return new Date().getDay();
}

// Format duration
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes}m`;
}

export function WeeklyPlanReview({ plan, onClose, onRegenerate, regenerating }: WeeklyPlanReviewProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayIndex = getTodayIndex();

  // Save plan to database
  const handleSavePlan = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // 1. Create the workout_plan
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

      // 2. Deactivate any other active plans
      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', planData.id);

      // 3. For each day, save the workout and link to plan
      for (const day of plan.days) {
        // Save workout template
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

        // Save workout exercises
        const exerciseInserts = day.workout.exercises.map((ex, idx) => ({
          workout_id: workoutData.id,
          exercise_id: ex.exerciseId || null,
          exercise_name: ex.name,
          sets: ex.sets || 3,
          target_reps: parseInt(ex.reps) || 10,
          target_weight: ex.weight ? parseInt(ex.weight) : null,
          order_index: idx,
          notes: ex.notes || null,
        }));

        const { error: exError } = await supabase
          .from('workout_exercises')
          .insert(exerciseInserts);

        if (exError) throw exError;

        // Link workout to plan day
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
    } catch (err) {
      console.error('Failed to save plan:', err);
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, plan]);

  // Start a specific day's workout
  const handleStartWorkout = useCallback((workout: GeneratedWorkout) => {
    sessionStorage.setItem('currentWorkout', JSON.stringify(workout));
    router.push('/workout');
  }, [router]);

  // Calculate total exercises and volume for summary
  const totalExercises = plan.days.reduce((sum, d) => sum + d.workout.exercises.length, 0);
  const avgDuration = Math.round(
    plan.days.reduce((sum, d) => sum + (d.workout.duration || 45), 0) / plan.days.length
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            style={{ color: colors.accent, fontSize: '0.875rem' }}
          >
            Cancel
          </button>
          {!saved && (
            <button
              onClick={handleSavePlan}
              disabled={saving}
              style={{
                color: colors.bg,
                background: colors.accent,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          )}
          {saved && (
            <span style={{ color: colors.success, fontSize: '0.875rem', fontWeight: 600 }}>
              Saved!
            </span>
          )}
        </div>
        <h1 style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          {plan.name}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {plan.days.length} workouts / ~{formatDuration(avgDuration)} each / {totalExercises} exercises total
        </p>
        {error && (
          <p style={{ color: colors.error, fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>
        )}
      </div>

      {/* Plan Days */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <div className="space-y-3">
          {plan.days.map((day) => {
            const isToday = day.day_of_week === todayIndex;
            const isExpanded = expandedDay === day.day_of_week;
            const workout = day.workout;

            return (
              <div
                key={day.day_of_week}
                style={{
                  background: colors.cardBg,
                  borderRadius: '0.75rem',
                  border: isToday ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                  overflow: 'hidden',
                }}
              >
                {/* Day Header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day.day_of_week)}
                  style={{
                    width: '100%',
                    padding: '1rem',
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
                      <span style={{ color: colors.text, fontWeight: 600, fontSize: '1rem' }}>
                        {day.day_name}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            background: colors.accent,
                            color: colors.bg,
                            fontSize: '0.625rem',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '999px',
                            fontWeight: 600,
                          }}
                        >
                          TODAY
                        </span>
                      )}
                    </div>
                    <div style={{ color: colors.accent, fontSize: '0.875rem', marginTop: '0.125rem' }}>
                      {workout.name}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {workout.exercises.length} exercises / {formatDuration(workout.duration || 45)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {saved && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartWorkout(workout);
                        }}
                        style={{
                          background: isToday ? colors.accent : 'rgba(201, 167, 90, 0.2)',
                          color: isToday ? colors.bg : colors.accent,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Start
                      </button>
                    )}
                    <span style={{ color: colors.textMuted, fontSize: '1.25rem' }}>
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {/* Expanded Exercise List */}
                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: `1px solid ${colors.borderSubtle}` }}>
                    <div style={{ paddingTop: '0.75rem' }}>
                      {workout.exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.625rem 0',
                            borderBottom: idx < workout.exercises.length - 1 ? `1px solid rgba(245, 241, 234, 0.05)` : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500 }}>
                                {ex.name}
                              </div>
                              <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                {ex.primaryMuscles?.join(', ')}
                              </div>
                            </div>
                            <div style={{ color: colors.accent, fontSize: '0.8125rem', textAlign: 'right' }}>
                              {ex.sets || 3} x {ex.reps}
                              {ex.weight && (
                                <span> / {ex.weight}</span>
                              )}
                            </div>
                          </div>
                          {ex.notes && (
                            <div style={{ color: colors.textMuted, fontSize: '0.7rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              {ex.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Start Workout Button */}
                    {saved && (
                      <button
                        onClick={() => handleStartWorkout(workout)}
                        style={{
                          width: '100%',
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          background: colors.accent,
                          color: colors.bg,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Start {day.day_name}'s Workout
                      </button>
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
          padding: '1rem',
          borderTop: `1px solid ${colors.borderSubtle}`,
          background: colors.bg,
        }}
      >
        {!saved ? (
          <div className="flex gap-3">
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'transparent',
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.text,
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.7 : 1,
              }}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={handleSavePlan}
              disabled={saving}
              style={{
                flex: 2,
                padding: '1rem',
                background: colors.accent,
                color: colors.bg,
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                border: 'none',
              }}
            >
              {saving ? 'Saving...' : 'Save & Activate Plan'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p style={{ color: colors.success, fontSize: '0.875rem', textAlign: 'center', fontWeight: 500 }}>
              Plan saved and activated! Start any workout above.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '1rem',
                background: colors.accent,
                color: colors.bg,
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
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
    </div>
  );
}
