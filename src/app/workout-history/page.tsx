'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useSessionDetail, useWorkoutBookmark } from '@/hooks/useSessionDetail';
import { useAuth } from '@/context/AuthContext';
import { SessionDetail, SessionDetailExercise } from '@/lib/supabase/types';
import { getSupabase } from '@/lib/supabase/client';

// Format duration in minutes
function formatDuration(seconds: number | null): string {
  if (!seconds) return '0';
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins} min`;
}

// Format volume with K suffix for thousands
function formatVolume(volume: number | null): string {
  if (!volume) return '0';
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toLocaleString();
}

// Format date for display
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Set type badge colors
function getSetTypeBadge(setType: string, colors: { accent: string; textMuted: string }): { bg: string; text: string } {
  switch (setType) {
    case 'warmup':
      return { bg: 'rgba(255, 200, 100, 0.2)', text: 'rgb(255, 200, 100)' };
    case 'working':
      return { bg: 'rgba(100, 200, 100, 0.2)', text: 'rgb(100, 200, 100)' };
    case 'dropset':
      return { bg: 'rgba(200, 100, 200, 0.2)', text: 'rgb(200, 100, 200)' };
    case 'failure':
      return { bg: 'rgba(255, 100, 100, 0.2)', text: 'rgb(255, 100, 100)' };
    default:
      return { bg: 'rgba(245, 241, 234, 0.1)', text: colors.textMuted };
  }
}

// Exercise card component
function ExerciseCard({ exercise, colors }: { exercise: SessionDetailExercise; colors: { text: string; textMuted: string; accent: string } }) {
  return (
    <div className="card" style={{ marginBottom: '0.75rem' }}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 style={{ color: colors.text, fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {exercise.exercise_name}
          </h3>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
            {exercise.primary_muscles.join(', ')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
            {formatVolume(exercise.total_volume)}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
            lbs volume
          </div>
        </div>
      </div>

      {/* Sets table */}
      <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex" style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(245, 241, 234, 0.1)' }}>
          <div style={{ width: '40px', color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>Set</div>
          <div style={{ flex: 1, color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>Type</div>
          <div style={{ width: '80px', textAlign: 'right', color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>Weight</div>
          <div style={{ width: '50px', textAlign: 'right', color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>Reps</div>
          <div style={{ width: '50px', textAlign: 'right', color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>RPE</div>
        </div>

        {/* Rows */}
        {exercise.sets.map((set, idx) => {
          const badge = getSetTypeBadge(set.set_type, colors);
          return (
            <div
              key={set.set_log_id}
              className="flex items-center"
              style={{
                padding: '0.625rem 0.75rem',
                borderBottom: idx < exercise.sets.length - 1 ? '1px solid rgba(245, 241, 234, 0.05)' : 'none',
              }}
            >
              <div style={{ width: '40px', color: colors.text, fontSize: '0.875rem' }}>{set.set_number}</div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px',
                    background: badge.bg,
                    color: badge.text,
                  }}
                >
                  {set.set_type}
                </span>
              </div>
              <div style={{ width: '80px', textAlign: 'right', color: colors.text, fontSize: '0.875rem' }}>
                {set.weight ? `${set.weight}` : '—'}
              </div>
              <div style={{ width: '50px', textAlign: 'right', color: colors.text, fontSize: '0.875rem' }}>
                {set.reps || '—'}
              </div>
              <div style={{ width: '50px', textAlign: 'right', color: colors.textMuted, fontSize: '0.875rem' }}>
                {set.rpe || '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Set notes if any */}
      {exercise.sets.some((s) => s.set_notes) && (
        <div style={{ marginTop: '0.75rem' }}>
          {exercise.sets
            .filter((s) => s.set_notes)
            .map((s) => (
              <div key={s.set_log_id} style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Set {s.set_number}: {s.set_notes}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function WorkoutHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const { colors } = useTheme();
  const { user } = useAuth();
  const { fetchSessionDetail, loading, error } = useSessionDetail();
  const { toggleBookmark, loading: bookmarkLoading } = useWorkoutBookmark();

  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (sessionId && user) {
      fetchSessionDetail(sessionId).then((data) => {
        if (data) {
          setDetail(data);
          // Check if workout is bookmarked
          if (data.workout_id) {
            checkBookmarkStatus(data.workout_id);
          }
        }
      });
    }
  }, [sessionId, user, fetchSessionDetail]);

  const checkBookmarkStatus = async (workoutId: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('workouts')
        .select('is_saved')
        .eq('id', workoutId)
        .single();
      if (data) {
        setIsBookmarked(data.is_saved || false);
      }
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const handleBookmark = async () => {
    if (!detail?.workout_id) return;
    const success = await toggleBookmark(detail.workout_id, !isBookmarked);
    if (success) {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleDoAgain = useCallback(() => {
    if (!detail?.workout_id) return;
    // Store the workout ID to load, then navigate to workout page
    sessionStorage.setItem('loadWorkoutId', detail.workout_id);
    router.push('/workout');
  }, [detail, router]);

  const handleBack = () => {
    router.back();
  };

  if (!sessionId) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, padding: '1rem' }}>
        <button
          onClick={handleBack}
          style={{
            color: colors.accent,
            fontSize: '0.875rem',
            padding: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          Back
        </button>
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: '2rem' }}>
          No workout selected
        </div>
      </div>
    );
  }

  if (loading && !detail) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, padding: '1rem' }}>
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: '4rem' }}>
          Loading workout details...
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, padding: '1rem' }}>
        <button
          onClick={handleBack}
          style={{
            color: colors.accent,
            fontSize: '0.875rem',
            padding: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          Back
        </button>
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: '2rem' }}>
          {error || 'Workout not found'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(245, 241, 234, 0.1)',
          background: colors.cardBg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBack}
            style={{ color: colors.accent, fontSize: '0.875rem' }}
          >
            Back
          </button>
          {detail.workout_id && (
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              style={{
                color: isBookmarked ? colors.accent : colors.textMuted,
                fontSize: '1.25rem',
                opacity: bookmarkLoading ? 0.5 : 1,
              }}
            >
              {isBookmarked ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        <h1 style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600 }}>
          {detail.session_name || 'Workout'}
        </h1>
        <div style={{ color: colors.textMuted, fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {formatFullDate(detail.started_at)} at {formatTime(detail.started_at)}
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="flex justify-around"
        style={{
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(245, 241, 234, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
            {formatDuration(detail.duration_seconds)}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Duration</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
            {formatVolume(detail.total_volume)}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Total Volume</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
            {detail.exercises.length}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Exercises</div>
        </div>
        {detail.rating && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
              {detail.rating}/5
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Rating</div>
          </div>
        )}
      </div>

      {/* Session notes */}
      {detail.session_notes && (
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(245, 241, 234, 0.1)' }}>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Notes</div>
          <div style={{ color: colors.text, fontSize: '0.875rem' }}>{detail.session_notes}</div>
        </div>
      )}

      {/* Exercises */}
      <div style={{ padding: '1rem' }}>
        <h2 style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Exercises
        </h2>
        {detail.exercises.map((exercise) => (
          <ExerciseCard key={exercise.exercise_id} exercise={exercise} colors={colors} />
        ))}
      </div>

      {/* Location */}
      {detail.location && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
            Location: {detail.location}
          </div>
        </div>
      )}

      {/* Do Again button */}
      {detail.workout_id && (
        <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
          <button
            onClick={handleDoAgain}
            style={{
              width: '100%',
              padding: '1rem',
              background: colors.accent,
              color: colors.bg,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Do This Workout Again
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkoutHistoryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', padding: '1rem' }}>Loading...</div>}>
      <WorkoutHistoryContent />
    </Suspense>
  );
}
