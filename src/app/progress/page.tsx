'use client';

import { useState, useMemo } from 'react';
import { useWeightLogs, useWeightGoal, useProfile } from '@/hooks/useSupabase';
import { useStrengthData, formatDate, formatVolume } from '@/hooks/useStrengthData';
import {
  MAJOR_LIFTS,
  findStandardForExercise,
  calculateStrengthScore,
  getStrengthLabel,
  getExpected1RM,
  calculateOverallStrengthLevel,
  type ExperienceLevel,
} from '@/lib/strengthStandards';
import { AuthGuard } from '@/components/AuthGuard';

export default function ProgressPage() {
  const { logs: weightLogs, loading: logsLoading, addWeightLog } = useWeightLogs(30);
  const { goal, loading: goalLoading } = useWeightGoal();
  const { profile } = useProfile();
  const { exercisePRs, sessions, loading: strengthLoading } = useStrengthData();

  const [showWeightInput, setShowWeightInput] = useState(false);
  const [activeView, setActiveView] = useState<'weight' | 'strength'>('weight');
  const [saving, setSaving] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  // Format weight data for display
  const weightHistory = useMemo(() => {
    return weightLogs
      .slice()
      .reverse()
      .map(log => ({
        date: new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: log.weight,
      }));
  }, [weightLogs]);

  // Get current/start/target weights
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : 0;
  const startWeight = goal?.start_weight || currentWeight || 0;
  const targetWeight = goal?.target_weight || currentWeight || 0;
  const progressPercent = startWeight !== targetWeight && startWeight > 0
    ? ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100
    : 0;

  // User context for strength calculations
  const userGender = (profile?.gender as 'male' | 'female') || 'male';
  const userExperience = (profile?.experience_level as ExperienceLevel) || 'intermediate';
  const userBodyWeight = currentWeight || 180;

  // Get PRs for major lifts
  const majorLiftPRs = useMemo(() => {
    return MAJOR_LIFTS.map(liftName => {
      const pr = exercisePRs.find(p => {
        const standard = findStandardForExercise(p.exercise_name);
        return standard === liftName;
      });

      const expected = getExpected1RM(liftName, userBodyWeight, userExperience, userGender) || 0;
      const actual = pr?.estimated_1rm || 0;
      const score = actual > 0
        ? calculateStrengthScore(actual, liftName, userBodyWeight, userExperience, userGender)
        : 0;
      const { label, color } = getStrengthLabel(score);

      return {
        lift: liftName,
        actual,
        expected,
        weight: pr?.pr_weight || 0,
        reps: pr?.pr_reps || 0,
        date: pr?.achieved_at ? formatDate(pr.achieved_at) : null,
        score,
        level: label,
        levelColor: color,
      };
    });
  }, [exercisePRs, userBodyWeight, userExperience, userGender]);

  // Overall strength level
  const overallStrength = useMemo(() => {
    return calculateOverallStrengthLevel(
      exercisePRs.map(p => ({ exercise_name: p.exercise_name, estimated_1rm: p.estimated_1rm })),
      userBodyWeight,
      userExperience,
      userGender
    );
  }, [exercisePRs, userBodyWeight, userExperience, userGender]);

  // Recent session volume
  const recentVolume = useMemo(() => {
    // Get sessions from last 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(s =>
      new Date(s.started_at).getTime() > weekAgo
    );
    return recentSessions.reduce((sum, s) => sum + (s.total_volume || 0), 0);
  }, [sessions]);

  // Calculate chart dimensions
  const chartWeights = weightHistory.length > 0 ? weightHistory.map(w => w.weight) : [0];
  const maxWeight = Math.max(...chartWeights, targetWeight) + 2;
  const minWeight = Math.min(targetWeight, Math.min(...chartWeights)) - 2;
  const range = maxWeight - minWeight || 1;

  const getY = (weight: number) => {
    return 100 - ((weight - minWeight) / range) * 100;
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    setSaving(true);
    try {
      await addWeightLog(weight);
      setShowWeightInput(false);
    } catch (err) {
      console.error('Failed to log weight:', err);
    } finally {
      setSaving(false);
    }
  };

  const loading = logsLoading || goalLoading || strengthLoading;

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ backgroundColor: '#0F2233' }}>
      {/* Loading state */}
      {loading && (
        <div className="fixed inset-0 bg-[#0F2233] flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-[#C9A75A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

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
            onClick={() => window.location.href = '/'}
            style={{ color: '#C9A75A', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            ← Back
          </button>
          <span style={{ color: '#F5F1EA', fontWeight: 600 }}>Progress</span>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex p-4 gap-2">
        {(['weight', 'strength'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: activeView === view ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
              border: activeView === view ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.1)',
              color: activeView === view ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {view === 'weight' ? '⚖️ Weight' : '💪 Strength'}
          </button>
        ))}
      </div>

      <main className="p-4 pb-24">
        {activeView === 'weight' ? (
          <>
            {/* Current Weight Card */}
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Current Weight
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: '3rem', fontWeight: 700, color: '#F5F1EA' }}>
                      {currentWeight}
                    </span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '1rem' }}>lbs</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWeightInput(true)}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem' }}
                >
                  Log Weight
                </button>
              </div>

              {/* Goal Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                    Start: {startWeight} lbs
                  </span>
                  <span style={{ color: '#C9A75A', fontSize: '0.75rem' }}>
                    Goal: {targetWeight} lbs
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(201, 167, 90, 0.1)', borderRadius: '4px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
                      backgroundColor: '#C9A75A',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                    {(startWeight - currentWeight).toFixed(1)} lbs lost
                  </span>
                  <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                    {(currentWeight - targetWeight).toFixed(1)} lbs to go
                  </span>
                </div>
              </div>
            </div>

            {/* Weight Chart */}
            <div className="card mb-4">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weight Trend
              </h2>

              {weightHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                    No weight data yet. Log your first weigh-in to see your progress!
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative', height: '160px', padding: '0 2.5rem 0 0' }}>
                  {/* Y-axis labels */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: '20px', width: '35px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>{maxWeight.toFixed(0)}</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>{((maxWeight + minWeight) / 2).toFixed(0)}</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>{minWeight.toFixed(0)}</span>
                  </div>

                  {/* Chart area */}
                  <div style={{ marginLeft: '40px', height: '120px', position: 'relative' }}>
                    {/* Grid lines */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ borderBottom: '1px solid rgba(201, 167, 90, 0.1)', width: '100%' }} />
                      ))}
                    </div>

                    {/* Target line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${getY(targetWeight)}%`,
                        borderTop: '2px dashed rgba(201, 167, 90, 0.4)',
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        right: '-2.5rem',
                        top: '-0.5rem',
                        color: '#C9A75A',
                        fontSize: '0.625rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {targetWeight}
                      </span>
                    </div>

                    {/* Data points and line */}
                    <svg
                      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
                      viewBox={`0 0 ${Math.max(weightHistory.length - 1, 1)} 100`}
                      preserveAspectRatio="none"
                    >
                      {/* Area fill */}
                      <path
                        d={`M0,${getY(weightHistory[0].weight)} ${weightHistory.map((w, i) =>
                          `L${i},${getY(w.weight)}`
                        ).join(' ')} L${weightHistory.length - 1},100 L0,100 Z`}
                        fill="url(#gradient)"
                        opacity="0.3"
                      />
                      {/* Line */}
                      <polyline
                        fill="none"
                        stroke="#C9A75A"
                        strokeWidth="0.15"
                        strokeLinejoin="round"
                        points={weightHistory.map((w, i) =>
                          `${i},${getY(w.weight)}`
                        ).join(' ')}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#C9A75A" />
                          <stop offset="100%" stopColor="#C9A75A" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Data points as absolute positioned dots */}
                    {weightHistory.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(i / Math.max(weightHistory.length - 1, 1)) * 100}%`,
                          top: `${getY(w.weight)}%`,
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#C9A75A',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 8px rgba(201, 167, 90, 0.5)',
                        }}
                      />
                    ))}
                  </div>

                  {/* X-axis labels */}
                  <div style={{ marginLeft: '40px', display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    {weightHistory.filter((_, i) => i === 0 || i === Math.floor(weightHistory.length / 2) || i === weightHistory.length - 1).map((w, i) => (
                      <span key={i} style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>
                        {w.date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Weigh-ins */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent Weigh-ins
              </h2>
              {weightHistory.length === 0 ? (
                <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                  No weigh-ins logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {[...weightHistory].reverse().slice(0, 5).map((w, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center"
                      style={{
                        padding: '0.5rem 0',
                        borderBottom: i < 4 ? '1px solid rgba(201, 167, 90, 0.1)' : 'none',
                      }}
                    >
                      <span style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '0.875rem' }}>
                        {w.date}
                      </span>
                      <span style={{ color: '#F5F1EA', fontWeight: 500 }}>
                        {w.weight} lbs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Overall Strength Level */}
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                    Overall Strength ({userExperience})
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#C9A75A' }}>
                      {overallStrength.overallScore}
                    </span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '1rem' }}>/100</span>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(201, 167, 90, 0.15)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                }}>
                  <span style={{ color: '#C9A75A', fontWeight: 600 }}>
                    {overallStrength.level}
                  </span>
                </div>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                Based on your {userExperience} level expected standards at {userBodyWeight} lbs body weight
              </p>
            </div>

            {/* Personal Records with Standards */}
            <div className="card mb-4">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Records
              </h2>

              {exercisePRs.length === 0 ? (
                <div className="text-center py-6">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    No lift data yet
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                    Complete workouts to start tracking your PRs
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {majorLiftPRs.map((pr, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(15, 34, 51, 0.5)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: '#F5F1EA', fontWeight: 500 }}>{pr.lift}</span>
                        <span style={{
                          color: pr.levelColor,
                          fontSize: '0.75rem',
                          background: `${pr.levelColor}20`,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '1rem',
                        }}>
                          {pr.level}
                        </span>
                      </div>

                      {pr.actual > 0 ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#C9A75A' }}>
                              {pr.actual}
                            </span>
                            <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                              lbs (e1RM)
                            </span>
                            {pr.date && (
                              <span style={{ color: 'rgba(245, 241, 234, 0.3)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                                {pr.date}
                              </span>
                            )}
                          </div>

                          {/* Progress bar to expected */}
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ height: '6px', backgroundColor: 'rgba(201, 167, 90, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min((pr.actual / pr.expected) * 100, 100)}%`,
                                  backgroundColor: pr.levelColor,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem' }}>
                              Best: {pr.weight}×{pr.reps}
                            </span>
                            <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem' }}>
                              Expected: {pr.expected} lbs
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '0.5rem 0' }}>
                          <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.875rem' }}>
                            No data yet • Expected: {pr.expected} lbs
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Volume */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Week's Volume
              </h2>
              <div className="text-center py-4">
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#C9A75A' }}>
                  {formatVolume(recentVolume)}
                </span>
                <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '1rem', marginLeft: '0.5rem' }}>
                  lbs
                </span>
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Total volume from {sessions.filter(s => new Date(s.started_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length} workouts
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Weight Input Modal */}
      {showWeightInput && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
          onClick={() => setShowWeightInput(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '320px' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ color: '#F5F1EA', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
              Log Weight
            </h2>

            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setNewWeight((parseFloat(newWeight) - 0.5).toFixed(1))}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(201, 167, 90, 0.1)',
                  border: '2px solid rgba(201, 167, 90, 0.3)',
                  color: '#C9A75A',
                  fontSize: '1.5rem',
                }}
              >
                −
              </button>
              <div className="text-center">
                <input
                  type="number"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  style={{
                    width: '120px',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: '#F5F1EA',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                  step="0.1"
                />
                <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>lbs</div>
              </div>
              <button
                onClick={() => setNewWeight((parseFloat(newWeight) + 0.5).toFixed(1))}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(201, 167, 90, 0.1)',
                  border: '2px solid rgba(201, 167, 90, 0.3)',
                  color: '#C9A75A',
                  fontSize: '1.5rem',
                }}
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWeightInput(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleLogWeight}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            { icon: '📊', label: 'Progress', href: '/progress', active: true },
            { icon: '📚', label: 'Library', href: '/library' },
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
    </AuthGuard>
  );
}
