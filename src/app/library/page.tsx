'use client';

import { useState, useMemo } from 'react';
import { useExercises } from '@/hooks/useSupabase';
import { useStrengthData, formatDaysAgo, formatVolume, formatDate } from '@/hooks/useStrengthData';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { Settings } from '@/components/Settings';
import { BottomNav } from '@/components/BottomNav';

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
  colors,
}: {
  exercise: { id: string; name: string; primary_muscles?: string[] };
  pr: { pr_weight: number; pr_reps: number; estimated_1rm: number; achieved_at: string } | null;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { history, loading } = useExerciseHistory(exercise.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-2"
            style={{ borderColor: colors.accentMuted, borderTopColor: colors.accent }}
          />
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Loading history...</p>
        </div>
      </div>
    );
  }

  const hasHistory = history && history.sessions.length > 0;
  const lastSession = hasHistory ? history.sessions[0] : null;

  return (
    <>
      {/* PR Card */}
      <div className="card mb-4" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Personal Record</p>
            {pr ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: '3rem', fontWeight: 700, color: colors.accent }}>
                    {pr.pr_weight}
                  </span>
                  <span style={{ color: colors.textMuted }}>lbs × {pr.pr_reps}</span>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                  Set on {formatDate(pr.achieved_at)}
                </p>
              </>
            ) : (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                No PR recorded yet
              </p>
            )}
          </div>
          <div className="text-right">
            <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Est. 1RM</p>
            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text }}>
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
            style={{ background: colors.accentMuted, border: `1px solid ${colors.border}` }}
          >
            <h3 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              What AI Knows
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Trend</span>
                <p style={{ color: history.trend === 'up' ? colors.success : history.trend === 'down' ? colors.error : colors.text, fontWeight: 500 }}>
                  {history.trend === 'up' ? '↑ Progressing' : history.trend === 'down' ? '↓ Needs attention' : '→ Stable'}
                </p>
              </div>
              <div>
                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Avg Rest</span>
                <p style={{ color: colors.text, fontWeight: 500 }}>{history.avgRestDays || '—'} days</p>
              </div>
              <div>
                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Preferred Reps</span>
                <p style={{ color: colors.text, fontWeight: 500 }}>{history.preferredRepRange}</p>
              </div>
              <div>
                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Sessions</span>
                <p style={{ color: colors.text, fontWeight: 500 }}>{history.sessions.length} logged</p>
              </div>
            </div>
          </div>

          {/* Last Workout */}
          {lastSession && (
            <div className="card mb-4" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
              <h3 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last Workout — {formatDate(lastSession.workout_date)}
              </h3>
              <div className="space-y-2">
                {lastSession.sets.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: colors.bg,
                      borderRadius: '0.5rem',
                    }}
                  >
                    <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                      {set.set_type === 'warmup' ? 'Warmup' : `Set ${set.set_number}`}
                    </span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>
                      {set.weight} × {set.reps}
                    </span>
                  </div>
                ))}
              </div>
              {lastSession.sets.length > 0 && (
                <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.75rem' }}>
                  AI will suggest starting at <span style={{ color: colors.accent }}>{lastSession.sets[0].weight + 5} lbs</span> next time
                </p>
              )}
            </div>
          )}

          {/* History Chart - Estimated 1RM over time */}
          {history.sessions.length > 1 && (
            <div className="card mb-4" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
              <h3 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      <span style={{ color: colors.accent, fontSize: '0.625rem', marginBottom: '4px' }}>
                        {h.best_estimated_1rm}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(height, 10)}%`,
                          background: i === arr.length - 1 ? colors.accent : colors.accentMuted,
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ color: colors.textMuted, fontSize: '0.5rem', marginTop: '4px' }}>
                        {formatDate(h.workout_date).split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full History */}
          <div className="card" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
            <h3 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Session History
            </h3>
            <div className="space-y-2">
              {history.sessions.map((h, i) => (
                <div
                  key={h.session_id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '0.5rem 0',
                    borderBottom: i < history.sessions.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none',
                  }}
                >
                  <div>
                    <span style={{ color: colors.text, fontSize: '0.875rem' }}>{formatDate(h.workout_date)}</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                      Top: {h.top_set}
                    </span>
                  </div>
                  <div className="text-right">
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
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
          style={{ background: colors.accentMuted, border: `1px solid ${colors.border}` }}
        >
          <div className="text-center py-4">
            <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              No workout history for this exercise
            </p>
            <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
              Start a workout including {exercise.name} to track your progress
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function LibraryPage() {
  const { colors } = useTheme();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header - different for exercise detail vs list */}
      {selectedExerciseId ? (
        <header
          style={{
            background: colors.cardBg,
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedExerciseId(null)}
              style={{ color: colors.textMuted, background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
            >
              ← Back
            </button>
            <span style={{ color: colors.text, fontWeight: 600 }}>
              {selectedExercise?.name}
            </span>
            <div style={{ width: '48px' }} />
          </div>
        </header>
      ) : (
        <Header onSettingsClick={() => setShowSettings(true)} />
      )}

      <main className="p-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-2"
                style={{ borderColor: colors.accentMuted, borderTopColor: colors.accent }}
              />
              <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Loading exercises...</p>
            </div>
          </div>
        ) : !selectedExerciseId ? (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search exercises, muscles, or difficulty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            {/* Muscle Filter */}
            <div
              className="flex gap-2 mb-4 overflow-x-auto pb-2"
              style={{
                scrollbarWidth: 'none',
                maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                paddingRight: '1rem',
              }}
            >
              <button
                onClick={() => setMuscleFilter(null)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '999px',
                  background: !muscleFilter ? colors.accent : colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  color: !muscleFilter ? colors.bg : colors.textMuted,
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
                    background: muscleFilter === muscle ? colors.accent : colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    color: muscleFilter === muscle ? colors.bg : colors.textMuted,
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
                background: colors.accentMuted,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                <span style={{ color: colors.accent }}>AI uses this data</span> to suggest weights and track your progress over time.
              </p>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: colors.textMuted, marginBottom: '0.75rem' }}>No exercises match your search</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setMuscleFilter(null);
                    }}
                    style={{
                      background: colors.accentMuted,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: colors.accent,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className="card w-full text-left"
                    style={{ display: 'block', background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 style={{ color: colors.text, fontSize: '1rem', fontWeight: 500 }}>
                          {ex.name}
                          {ex.hasHistory && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.625rem',
                                background: `${colors.success}20`,
                                color: colors.success,
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
                                background: colors.accentMuted,
                                borderRadius: '0.25rem',
                                padding: '0.125rem 0.375rem',
                                color: colors.textMuted,
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
                          <div style={{ color: colors.accent, fontSize: '1.125rem', fontWeight: 700 }}>
                            {ex.pr.estimated_1rm}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: '0.625rem' }}>
                            Est. 1RM
                          </div>
                        </div>
                      )}
                    </div>
                    {ex.pr && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
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
            colors={colors}
          />
        )}
      </main>

      <BottomNav />

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
