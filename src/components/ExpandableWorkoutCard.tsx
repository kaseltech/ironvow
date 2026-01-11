'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useSessionDetail } from '@/hooks/useSessionDetail';
import { SessionSummary } from '@/hooks/useStrengthData';
import { SessionDetail, SessionDetailExercise } from '@/lib/supabase/types';

interface ExpandableWorkoutCardProps {
  session: SessionSummary;
  onBookmarkChange?: () => void;
}

// Format duration in minutes
function formatDuration(seconds: number | null): string {
  if (!seconds) return '0';
  return Math.round(seconds / 60).toString();
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
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format weight display
function formatWeight(weight: number | null): string {
  if (!weight) return '—';
  return `${weight}`;
}

// Exercise row component
function ExerciseRow({ exercise, colors }: { exercise: SessionDetailExercise; colors: { text: string; textMuted: string; accent: string } }) {
  return (
    <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(245, 241, 234, 0.08)' }}>
      <div className="flex justify-between items-center mb-1">
        <span style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500 }}>
          {exercise.exercise_name}
        </span>
        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
          {formatVolume(exercise.total_volume)} lbs
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {exercise.sets.map((set) => (
          <span
            key={set.set_log_id}
            style={{
              color: colors.textMuted,
              fontSize: '0.75rem',
              background: 'rgba(245, 241, 234, 0.05)',
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
            }}
          >
            {formatWeight(set.weight)} × {set.reps || '—'}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ExpandableWorkoutCard({ session, onBookmarkChange }: ExpandableWorkoutCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { fetchSessionDetail, getCachedSession, loading } = useSessionDetail();

  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  const handleClick = useCallback(async () => {
    if (isExpanded) {
      // Already expanded - navigate to detail page
      router.push(`/workout-history?id=${session.session_id}`);
      return;
    }

    // Expand the card
    setIsExpanded(true);

    // Check cache first
    const cached = getCachedSession(session.session_id);
    if (cached) {
      setDetail(cached);
      return;
    }

    // Fetch detail data
    const data = await fetchSessionDetail(session.session_id);
    if (data) {
      setDetail(data);
    }
  }, [isExpanded, session.session_id, router, fetchSessionDetail, getCachedSession]);

  const handleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  }, []);

  return (
    <div
      className="card cursor-pointer transition-all"
      onClick={handleClick}
      style={{
        borderLeft: isExpanded ? `3px solid ${colors.accent}` : 'none',
        paddingLeft: isExpanded ? 'calc(1rem - 3px)' : '1rem',
      }}
    >
      {/* Header - always visible */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 style={{ color: colors.text, fontSize: '1rem', fontWeight: 500 }}>
            {session.session_name || 'Workout'}
          </h3>
          {isExpanded && (
            <button
              onClick={handleCollapse}
              style={{
                color: colors.textMuted,
                fontSize: '0.75rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                background: 'rgba(245, 241, 234, 0.1)',
              }}
            >
              Collapse
            </button>
          )}
        </div>
        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
          {formatDate(session.started_at)}
        </span>
      </div>

      {/* Summary stats - always visible */}
      <div className="flex gap-4">
        <div>
          <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
            {formatDuration(session.duration_seconds)}
          </span>
          <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> min</span>
        </div>
        <div>
          <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
            {formatVolume(session.total_volume)}
          </span>
          <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs</span>
        </div>
        <div>
          <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
            {session.exercise_count}
          </span>
          <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> exercises</span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 241, 234, 0.1)' }}>
          {loading && !detail && (
            <div style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
              Loading exercises...
            </div>
          )}

          {detail && detail.exercises.length > 0 && (
            <div>
              {detail.exercises.map((exercise) => (
                <ExerciseRow key={exercise.exercise_id} exercise={exercise} colors={colors} />
              ))}
            </div>
          )}

          {detail && detail.exercises.length === 0 && (
            <div style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
              No exercises logged
            </div>
          )}

          {/* Tap to view full details hint */}
          <div
            style={{
              color: colors.accent,
              fontSize: '0.75rem',
              textAlign: 'center',
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: 'rgba(245, 241, 234, 0.03)',
              borderRadius: '4px',
            }}
          >
            Tap to view full details →
          </div>
        </div>
      )}
    </div>
  );
}
