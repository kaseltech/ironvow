'use client';

import { useState, useMemo } from 'react';
import { useExercises } from '@/hooks/useSupabase';
import { useStrengthData, formatDaysAgo, formatVolume, formatDate } from '@/hooks/useStrengthData';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';

// Format muscle name for display (e.g., "upper_back" → "Upper Back")
function formatMuscleName(muscle: string): string {
  return muscle
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Exercise detail component (separate to use useExerciseHistory)
function ExerciseDetail({
  exercise,
  pr,
  onBack,
}: {
  exercise: { id: string; name: string; primary_muscles?: string[] };
  pr: { pr_weight: number; pr_reps: number; estimated_1rm: number; achieved_at: string } | null;
  onBack: () => void;
}) {
  const { history, loading } = useExerciseHistory(exercise.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-2"
            style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: '#C9A75A' }}
          />
          <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>Loading history...</p>
        </div>
      </div>
    );
  }

  const hasHistory = history && history.sessions.length > 0;
  const lastSession = hasHistory ? history.sessions[0] : null;

  return (
    <>
      {/* PR Card */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Personal Record</p>
            {pr ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: '3rem', fontWeight: 700, color: '#C9A75A' }}>
                    {pr.pr_weight}
                  </span>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>lbs × {pr.pr_reps}</span>
                </div>
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                  Set on {formatDate(pr.achieved_at)}
                </p>
              </>
            ) : (
              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                No PR recorded yet
              </p>
            )}
          </div>
          <div className="text-right">
            <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Est. 1RM</p>
            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#F5F1EA' }}>
              {pr?.estimated_1rm || '—'}
            </span>
          </div>
        </div>
      </div>

      {hasHistory && history ? (
        <>
          {/* AI Context Card */}
          <div
            className="card mb-4"
            style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
          >
            <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              What AI Knows
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Trend</span>
                <p style={{ color: history.trend === 'up' ? '#4ADE80' : history.trend === 'down' ? '#F87171' : '#F5F1EA', fontWeight: 500 }}>
                  {history.trend === 'up' ? '↑ Progressing' : history.trend === 'down' ? '↓ Needs attention' : '→ Stable'}
                </p>
              </div>
              <div>
                <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Avg Rest</span>
                <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{history.avgRestDays || '—'} days</p>
              </div>
              <div>
                <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Preferred Reps</span>
                <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{history.preferredRepRange}</p>
              </div>
              <div>
                <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Sessions</span>
                <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{history.sessions.length} logged</p>
              </div>
            </div>
          </div>

          {/* Last Workout */}
          {lastSession && (
            <div className="card mb-4">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last Workout — {formatDate(lastSession.workout_date)}
              </h3>
              <div className="space-y-2">
                {lastSession.sets.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                      {set.set_type === 'warmup' ? '🔥 Warmup' : `Set ${set.set_number}`}
                    </span>
                    <span style={{ color: '#F5F1EA', fontWeight: 500 }}>
                      {set.weight} × {set.reps}
                    </span>
                  </div>
                ))}
              </div>
              {lastSession.sets.length > 0 && (
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                  AI will suggest starting at <span style={{ color: '#C9A75A' }}>{lastSession.sets[0].weight + 5} lbs</span> next time
                </p>
              )}
            </div>
          )}

          {/* History Chart - Estimated 1RM over time */}
          {history.sessions.length > 1 && (
            <div className="card mb-4">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Strength Progress (Est. 1RM)
              </h3>
              <div style={{ height: '100px', display: 'flex', alignItems: 'end', gap: '8px', padding: '0 4px' }}>
                {[...history.sessions].reverse().slice(-6).map((h, i, arr) => {
                  const maxE1rm = Math.max(...arr.map(x => x.best_estimated_1rm));
                  const minE1rm = Math.min(...arr.map(x => x.best_estimated_1rm)) - 10;
                  const height = maxE1rm > minE1rm
                    ? ((h.best_estimated_1rm - minE1rm) / (maxE1rm - minE1rm)) * 100
                    : 50;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span style={{ color: '#C9A75A', fontSize: '0.625rem', marginBottom: '4px' }}>
                        {h.best_estimated_1rm}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(height, 10)}%`,
                          background: i === arr.length - 1 ? '#C9A75A' : 'rgba(201, 167, 90, 0.4)',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.5rem', marginTop: '4px' }}>
                        {formatDate(h.workout_date).split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full History */}
          <div className="card">
            <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Session History
            </h3>
            <div className="space-y-2">
              {history.sessions.map((h, i) => (
                <div
                  key={h.session_id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '0.5rem 0',
                    borderBottom: i < history.sessions.length - 1 ? '1px solid rgba(201, 167, 90, 0.1)' : 'none',
                  }}
                >
                  <div>
                    <span style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>{formatDate(h.workout_date)}</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                      Top: {h.top_set}
                    </span>
                  </div>
                  <div className="text-right">
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                      {formatVolume(h.total_volume)} vol
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* No history state */
        <div
          className="card"
          style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
        >
          <div className="text-center py-4">
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              No workout history for this exercise
            </p>
            <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
              Start a workout including {exercise.name} to track your progress
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function LibraryPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  // Fetch all exercises from database
  const { exercises, loading: exercisesLoading } = useExercises();

  // Fetch user's PRs
  const { exercisePRs, loading: prsLoading } = useStrengthData();

  // Merge exercises with user PR data
  const enrichedExercises = useMemo(() => {
    return exercises.map(ex => {
      const pr = exercisePRs.find(p => p.exercise_id === ex.id);
      return {
        ...ex,
        pr,
        hasHistory: !!pr,
        muscleGroups: ex.primary_muscles || [],
      };
    });
  }, [exercises, exercisePRs]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return enrichedExercises.filter(ex => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroups.some((g: string) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      // Muscle filter
      const matchesMuscle = !muscleFilter ||
        ex.muscleGroups.some((g: string) => g.toLowerCase() === muscleFilter.toLowerCase());

      return matchesSearch && matchesMuscle;
    });
  }, [enrichedExercises, searchQuery, muscleFilter]);

  // Get all unique muscle groups for filter
  const allMuscleGroups = useMemo(() => {
    const muscles = new Set<string>();
    exercises.forEach(ex => {
      (ex.primary_muscles || []).forEach((m: string) => muscles.add(m));
    });
    return Array.from(muscles).sort();
  }, [exercises]);

  // Selected exercise
  const selectedExercise = enrichedExercises.find(e => e.id === selectedExerciseId);

  const loading = exercisesLoading || prsLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F2233' }}>
      {/* Header */}
      <header
        className="safe-area-top"
        style={{
          background: '#1A3550',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => selectedExerciseId ? setSelectedExerciseId(null) : window.location.href = '/'}
            style={{ color: '#C9A75A', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            ← {selectedExerciseId ? 'Back' : 'Home'}
          </button>
          <span style={{ color: '#F5F1EA', fontWeight: 600 }}>
            {selectedExerciseId ? selectedExercise?.name : 'Exercise Library'}
          </span>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      <main className="p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-2"
                style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: '#C9A75A' }}
              />
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>Loading exercises...</p>
            </div>
          </div>
        ) : !selectedExerciseId ? (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(26, 53, 80, 0.5)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  color: '#F5F1EA',
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            {/* Muscle Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setMuscleFilter(null)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '999px',
                  background: !muscleFilter ? '#C9A75A' : 'rgba(26, 53, 80, 0.5)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  color: !muscleFilter ? '#0F2233' : 'rgba(245, 241, 234, 0.7)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                All
              </button>
              {allMuscleGroups.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => setMuscleFilter(muscleFilter === muscle ? null : muscle)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '999px',
                    background: muscleFilter === muscle ? '#C9A75A' : 'rgba(26, 53, 80, 0.5)',
                    border: '1px solid rgba(201, 167, 90, 0.2)',
                    color: muscleFilter === muscle ? '#0F2233' : 'rgba(245, 241, 234, 0.7)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatMuscleName(muscle)}
                </button>
              ))}
            </div>

            {/* Info Banner */}
            <div
              style={{
                background: 'rgba(201, 167, 90, 0.1)',
                border: '1px solid rgba(201, 167, 90, 0.2)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '0.8125rem' }}>
                <span style={{ color: '#C9A75A' }}>AI uses this data</span> to suggest weights and track your progress over time.
              </p>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)' }}>No exercises found</p>
                </div>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className="card w-full text-left"
                    style={{ display: 'block' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                          {ex.name}
                          {ex.hasHistory && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.625rem',
                                background: 'rgba(74, 222, 128, 0.1)',
                                color: '#4ADE80',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                              }}
                            >
                              Done
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ex.muscleGroups.map((g: string) => (
                            <span
                              key={g}
                              style={{
                                background: 'rgba(201, 167, 90, 0.1)',
                                borderRadius: '0.25rem',
                                padding: '0.125rem 0.375rem',
                                color: 'rgba(245, 241, 234, 0.6)',
                                fontSize: '0.625rem',
                              }}
                            >
                              {formatMuscleName(g)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {ex.pr && (
                        <div className="text-right">
                          <div style={{ color: '#C9A75A', fontSize: '1.125rem', fontWeight: 700 }}>
                            {ex.pr.estimated_1rm}
                          </div>
                          <div style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>
                            Est. 1RM
                          </div>
                        </div>
                      )}
                    </div>
                    {ex.pr && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                          PR: {ex.pr.pr_weight}×{ex.pr.pr_reps} • {formatDaysAgo(ex.pr.achieved_at)}
                        </span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        ) : selectedExercise && (
          <ExerciseDetail
            exercise={selectedExercise}
            pr={selectedExercise.pr || null}
            onBack={() => setSelectedExerciseId(null)}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          background: '#1A3550',
          borderTop: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex justify-around py-3">
          {[
            { icon: '🏋️', label: 'Workout', href: '/' },
            { icon: '📊', label: 'Progress', href: '/progress' },
            { icon: '📚', label: 'Library', href: '/library', active: true },
            { icon: '👤', label: 'Profile', href: '/profile' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => window.location.href = item.href}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span style={{ fontSize: '1.25rem', opacity: item.active ? 1 : 0.5 }}>{item.icon}</span>
              <span style={{ fontSize: '0.625rem', color: item.active ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
