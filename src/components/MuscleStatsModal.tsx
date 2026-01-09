'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExercisePR, MuscleVolume } from '@/hooks/useStrengthData';

interface MuscleStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  muscleId: string | null;
  muscleName: string;
  exercisePRs: ExercisePR[];
  muscleVolume: MuscleVolume[];
}

// Map broad muscle IDs to specific database muscle values
const muscleMapping: Record<string, string[]> = {
  'chest': ['chest', 'upper_chest', 'lower_chest'],
  'shoulders': ['shoulders', 'front_delts', 'lateral_delts', 'rear_delts', 'delts', 'side_delts'],
  'traps': ['traps', 'upper_traps', 'lower_traps'],
  'biceps': ['biceps', 'brachialis'],
  'triceps': ['triceps'],
  'forearms': ['forearms', 'grip'],
  'core': ['core', 'abs', 'obliques', 'transverse_abdominis'],
  'obliques': ['obliques'],
  'lats': ['lats', 'latissimus'],
  'upper_back': ['upper_back', 'rhomboids', 'mid_back'],
  'lower_back': ['lower_back', 'erector_spinae', 'spinal_erectors'],
  'quads': ['quads', 'quadriceps'],
  'hamstrings': ['hamstrings'],
  'glutes': ['glutes', 'gluteus_maximus', 'gluteus_medius'],
  'calves': ['calves', 'gastrocnemius', 'soleus'],
  'adductors': ['adductors', 'inner_thigh'],
};

// Get all muscle variations for a muscle ID
function getMuscleVariations(muscleId: string): string[] {
  return muscleMapping[muscleId] || [muscleId];
}

// Format volume for display
function formatVolume(volume: number): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k lbs`;
  }
  return `${volume.toLocaleString()} lbs`;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MuscleStatsModal({
  isOpen,
  onClose,
  muscleId,
  muscleName,
  exercisePRs,
  muscleVolume,
}: MuscleStatsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setExercisesExpanded(true);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  }, [onClose]);

  // Filter exercises that target this muscle
  const relevantExercises = useMemo(() => {
    if (!muscleId) return [];
    const variations = getMuscleVariations(muscleId);

    return exercisePRs.filter(pr => {
      const primaryMuscles = pr.primary_muscles || [];
      // Check if any of the exercise's primary muscles match our variations
      return primaryMuscles.some(m =>
        variations.includes(m.toLowerCase())
      );
    }).sort((a, b) => b.estimated_1rm - a.estimated_1rm);
  }, [muscleId, exercisePRs]);

  // Get muscle volume data
  const volumeData = useMemo(() => {
    if (!muscleId) return null;
    const variations = getMuscleVariations(muscleId);

    // Find volume data for any variation of this muscle
    const matchingVolume = muscleVolume.find(mv =>
      variations.includes(mv.muscle.toLowerCase())
    );

    // If no direct match, aggregate all variations
    if (!matchingVolume) {
      const allMatching = muscleVolume.filter(mv =>
        variations.includes(mv.muscle.toLowerCase())
      );
      if (allMatching.length === 0) return null;

      return {
        total_volume: allMatching.reduce((sum, mv) => sum + mv.total_volume, 0),
        last_trained: allMatching.reduce((latest, mv) =>
          new Date(mv.last_trained) > new Date(latest) ? mv.last_trained : latest,
          allMatching[0].last_trained
        ),
        training_days: Math.max(...allMatching.map(mv => mv.training_days)),
      };
    }

    return matchingVolume;
  }, [muscleId, muscleVolume]);

  // Calculate trend based on training frequency
  const trend = useMemo(() => {
    if (!volumeData) return 'stable';
    if (volumeData.training_days >= 3) return 'up';
    if (volumeData.training_days <= 1) return 'down';
    return 'stable';
  }, [volumeData]);

  if (!mounted || !isOpen || !muscleId) return null;

  const hasData = relevantExercises.length > 0 || volumeData;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.25s ease',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#1F3A5A',
          borderRadius: '1.5rem',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(201, 167, 90, 0.3)',
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(201, 167, 90, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(201, 167, 90, 0.15) 0%, transparent 100%)',
          }}
        >
          <h2
            style={{
              color: '#C9A75A',
              fontSize: '1.25rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              margin: 0,
            }}
          >
            {muscleName || muscleId?.replace('_', ' ')}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(245, 241, 234, 0.5)',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflow: 'auto', flex: 1 }}>
          {hasData ? (
            <>
              {/* Summary Stats */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(15, 34, 51, 0.5)', borderRadius: '0.75rem', padding: '0.875rem', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>30d Volume</p>
                    <p style={{ color: '#F5F1EA', fontWeight: 600, fontSize: '1rem' }}>
                      {volumeData ? formatVolume(volumeData.total_volume) : '—'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(15, 34, 51, 0.5)', borderRadius: '0.75rem', padding: '0.875rem', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>Last Trained</p>
                    <p style={{ color: '#F5F1EA', fontWeight: 600, fontSize: '1rem' }}>
                      {volumeData ? formatDate(volumeData.last_trained) : '—'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(15, 34, 51, 0.5)', borderRadius: '0.75rem', padding: '0.875rem', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>Trend</p>
                    <p style={{
                      color: trend === 'up' ? '#4ADE80' : trend === 'down' ? '#F87171' : '#C9A75A',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}>
                      {trend === 'up' ? '↑ Growing' : trend === 'down' ? '↓ Declining' : '→ Stable'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exercises Section */}
              {relevantExercises.length > 0 && (
                <div>
                  <button
                    onClick={() => setExercisesExpanded(!exercisesExpanded)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem 0',
                      marginBottom: exercisesExpanded ? '0.75rem' : 0,
                    }}
                  >
                    <h3 style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Exercises ({relevantExercises.length})
                    </h3>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', transform: exercisesExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>
                      ▼
                    </span>
                  </button>

                  {exercisesExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {relevantExercises.map((exercise) => (
                        <div
                          key={exercise.exercise_id}
                          style={{
                            background: 'rgba(15, 34, 51, 0.5)',
                            borderRadius: '0.75rem',
                            padding: '0.875rem 1rem',
                            border: '1px solid rgba(201, 167, 90, 0.1)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#F5F1EA', fontWeight: 500, fontSize: '0.9375rem' }}>
                              {exercise.exercise_name}
                            </span>
                            <span style={{ color: '#C9A75A', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                              1RM: {Math.round(exercise.estimated_1rm)} lbs
                            </span>
                          </div>
                          <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', margin: 0 }}>
                            PR: {exercise.pr_weight} lbs × {exercise.pr_reps} reps • {formatDate(exercise.achieved_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* No Data State */
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>💪</div>
              <h3 style={{ color: '#C9A75A', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                No {muscleName || muscleId?.replace('_', ' ')} Data Yet
              </h3>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Complete a workout targeting this muscle group to start tracking your progress.
              </p>
              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                We'll show your 1RM, volume, and exercise history here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
