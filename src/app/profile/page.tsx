'use client';

import { useState, useMemo } from 'react';
import { BodyMap } from '@/components/BodyMap';
import { GymManager } from '@/components/GymManager';
import { useProfile, useEquipment, useGymProfiles, useWeightLogs, useWeightGoal, useWorkoutSessions } from '@/hooks/useSupabase';
import { useStrengthData, convertToMuscleStrength, formatVolume, formatDate, formatDaysAgo } from '@/hooks/useStrengthData';
import { useTheme } from '@/context/ThemeContext';
import { getSupabase } from '@/lib/supabase/client';
import { MAJOR_LIFTS, findStandardForExercise } from '@/lib/strengthStandards';

type FitnessGoal = 'cut' | 'bulk' | 'maintain' | 'endurance' | 'general';

const fitnessGoals: { id: FitnessGoal; name: string; description: string; icon: string }[] = [
  { id: 'cut', name: 'Cut', description: 'Fat loss, higher reps, shorter rest', icon: '📉' },
  { id: 'bulk', name: 'Bulk', description: 'Muscle gain, moderate reps, longer rest', icon: '💪' },
  { id: 'maintain', name: 'Maintain', description: 'Balanced approach, variety', icon: '⚖️' },
  { id: 'endurance', name: 'Endurance', description: 'Higher reps, cardio integration', icon: '🏃' },
  { id: 'general', name: 'General Fitness', description: 'Well-rounded, functional', icon: '🎯' },
];

// Format height in feet and inches
function formatHeight(inches: number | null): string {
  if (!inches) return '—';
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

// Calculate age from date of birth
function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ProfilePage() {
  const { colors } = useTheme();
  const { profile, refetch: refetchProfile } = useProfile();
  const { profiles: gymProfiles } = useGymProfiles();
  const { userEquipment, allEquipment } = useEquipment();
  const { logs: weightLogs } = useWeightLogs(1);
  const { goal: weightGoal } = useWeightGoal();
  const { sessions } = useWorkoutSessions(10);
  const { muscleVolume, exercisePRs, sessions: strengthSessions, loading: strengthLoading } = useStrengthData();

  const [activeTab, setActiveTab] = useState<'body' | 'saved' | 'history' | 'settings'>('body');
  const [gender, setGender] = useState<'male' | 'female'>((profile?.gender as 'male' | 'female') || 'male');
  const [savingGoal, setSavingGoal] = useState(false);
  const [gymManagerOpen, setGymManagerOpen] = useState(false);

  // Convert muscle volume to strength data for BodyMap
  const muscleStrengthData = useMemo(() => {
    if (muscleVolume.length === 0) {
      // Return empty state data
      return [];
    }
    return convertToMuscleStrength(muscleVolume);
  }, [muscleVolume]);

  // Get strongest and weakest muscles
  const { strongest, weakest, imbalances } = useMemo(() => {
    if (muscleStrengthData.length === 0) {
      return { strongest: null, weakest: null, imbalances: [] };
    }

    const sorted = [...muscleStrengthData].sort((a, b) => b.strength - a.strength);
    const strongest = sorted[0];
    // Only show weakest if it's different from strongest (need at least 2 muscles)
    const weakest = sorted.length > 1 ? sorted[sorted.length - 1] : null;

    // Find muscles that haven't been trained in over 7 days
    const imbalances = muscleStrengthData.filter(m => {
      const match = m.lastTrained.match(/(\d+)/);
      if (!match) return false;
      const days = parseInt(match[1]);
      return m.lastTrained.includes('week') || days > 7;
    });

    return { strongest, weakest, imbalances };
  }, [muscleStrengthData]);

  // Get major lift PRs for settings tab
  const majorLiftPRs = useMemo(() => {
    return MAJOR_LIFTS.map(liftName => {
      const pr = exercisePRs.find(p => {
        const standard = findStandardForExercise(p.exercise_name);
        return standard === liftName;
      });
      return {
        lift: liftName === 'Overhead Press' ? 'OHP' : liftName,
        weight: pr?.pr_weight || 0,
        reps: pr?.pr_reps || 0,
        estimated_1rm: pr?.estimated_1rm || 0,
      };
    });
  }, [exercisePRs]);

  const currentGoal = (profile?.fitness_goal as FitnessGoal) || 'general';
  const currentWeight = weightLogs[0]?.weight || null;
  const age = calculateAge(profile?.date_of_birth || null);

  // Get equipment names for home gym
  const homeEquipmentIds = userEquipment.filter(ue => ue.location === 'home').map(ue => ue.equipment_id);
  const homeEquipmentNames = allEquipment
    .filter(eq => homeEquipmentIds.includes(eq.id))
    .map(eq => eq.name);

  // Get equipment names for gym location
  const gymEquipmentIds = userEquipment.filter(ue => ue.location === 'gym').map(ue => ue.equipment_id);
  const gymEquipmentNames = allEquipment
    .filter(eq => gymEquipmentIds.includes(eq.id))
    .map(eq => eq.name);

  const handleGoalChange = async (goalId: FitnessGoal) => {
    if (!profile?.id) return;

    setSavingGoal(true);
    try {
      const supabase = getSupabase();
      await supabase
        .from('profiles')
        .update({ fitness_goal: goalId })
        .eq('id', profile.id);

      refetchProfile();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  // Format duration from seconds
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <header
        className="safe-area-top"
        style={{
          background: colors.cardBg,
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            style={{ color: colors.textMuted, background: 'none', border: 'none', fontSize: '1rem' }}
          >
            ← Back
          </button>
          <span style={{ color: colors.text, fontWeight: 600 }}>Profile</span>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b" style={{ borderColor: colors.borderSubtle }}>
        {(['body', 'saved', 'history', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : '2px solid transparent',
              color: activeTab === tab ? colors.accent : colors.textMuted,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'body' ? 'Body' : tab === 'saved' ? 'Saved' : tab === 'history' ? 'History' : 'Settings'}
          </button>
        ))}
      </div>

      <main className="p-4 pb-24">
        {activeTab === 'body' && (
          <div>
            {/* Imbalance Alert */}
            {imbalances.length > 0 && (
              <div
                style={{
                  background: 'rgba(251, 146, 60, 0.1)',
                  border: '1px solid rgba(251, 146, 60, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="flex items-start gap-2">
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  <div>
                    <p style={{ color: '#FB923C', fontWeight: 500, fontSize: '0.875rem' }}>
                      {imbalances.length === 1 ? `${imbalances[0].name} needs attention!` : 'Muscle imbalance detected!'}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {imbalances.map(m => m.name).join(', ')} {imbalances.length === 1 ? "hasn't" : "haven't"} been trained recently.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Body Map */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Muscle Balance
                </h2>
                {/* Gender Toggle */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setGender('male')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem',
                      background: gender === 'male' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: gender === 'male' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: gender === 'male' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                    }}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem',
                      background: gender === 'female' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: gender === 'female' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: gender === 'female' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                    }}
                  >
                    Female
                  </button>
                </div>
              </div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '1rem' }}>
                {muscleStrengthData.length > 0
                  ? 'Tap a muscle to see details. Colors show relative strength based on your training history.'
                  : 'Complete some workouts to see your muscle balance.'}
              </p>
              {strengthLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-2"
                    style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: '#C9A75A' }}
                  />
                </div>
              ) : (
                <BodyMap
                  gender={gender}
                  muscleData={muscleStrengthData}
                />
              )}
            </div>

            {/* Quick Stats */}
            {muscleStrengthData.length > 0 && (
              <div className={`grid gap-3 mt-4 ${weakest ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="card text-center">
                  <p style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>Strongest</p>
                  <p style={{ color: colors.success, fontWeight: 600, fontSize: '1rem' }}>{strongest?.name || '—'}</p>
                  <p style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>{strongest?.strength || 0}% strength score</p>
                </div>
                {weakest && (
                  <div className="card text-center">
                    <p style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>Needs Work</p>
                    <p style={{ color: colors.error, fontWeight: 600, fontSize: '1rem' }}>{weakest.name}</p>
                    <p style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>{weakest.strength}% strength score</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Suggestion */}
            {imbalances.length > 0 && (
              <div
                className="card mt-4"
                style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
              >
                <h3 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  AI Recommendation
                </h3>
                <p style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                  Based on your muscle balance, your next workout should focus on <span style={{ color: colors.text, fontWeight: 500 }}>{imbalances.slice(0, 2).map(m => m.name.toLowerCase()).join(' and ')}</span>.
                  Consider adding an extra session this week to address the imbalance.
                </p>
                <button
                  className="btn-primary w-full mt-3"
                  style={{ fontSize: '0.875rem', padding: '0.75rem' }}
                  onClick={() => window.location.href = '/'}
                >
                  Generate Balanced Workout
                </button>
              </div>
            )}

            {/* Empty State */}
            {muscleStrengthData.length === 0 && !strengthLoading && (
              <div
                className="card mt-4"
                style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
              >
                <div className="text-center py-4">
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    No workout data yet
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                    Complete some workouts to see your muscle balance and get personalized recommendations.
                  </p>
                  <button
                    className="btn-primary mt-3"
                    style={{ fontSize: '0.875rem', padding: '0.75rem 1.5rem' }}
                    onClick={() => window.location.href = '/'}
                  >
                    Start a Workout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-3">
            <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
              Workouts you've bookmarked to run again
            </p>
            <div className="text-center py-8">
              <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                No saved workouts yet
              </p>
              <p style={{ color: 'rgba(245, 241, 234, 0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Bookmark workouts during your session to save them here
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
              Your recent workouts
            </p>
            {strengthSessions.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                  No workout history yet
                </p>
                <p style={{ color: 'rgba(245, 241, 234, 0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Complete a workout to see it here
                </p>
              </div>
            ) : (
              strengthSessions.map(workout => (
                <div
                  key={workout.session_id}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 style={{ color: colors.text, fontSize: '1rem', fontWeight: 500 }}>
                      {workout.session_name || 'Workout'}
                    </h3>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {formatDate(workout.started_at)}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>{formatDuration(workout.duration_seconds)}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> min</span>
                    </div>
                    <div>
                      <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>{formatVolume(workout.total_volume)}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs volume</span>
                    </div>
                    <div>
                      <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>{workout.exercise_count}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> exercises</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Basic Info
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Age</span>
                  <span style={{ color: colors.text, fontWeight: 500 }}>{age || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Height</span>
                  <span style={{ color: colors.text, fontWeight: 500 }}>{formatHeight(profile?.height_inches || null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Weight</span>
                  <span style={{ color: colors.text, fontWeight: 500 }}>{currentWeight ? `${currentWeight} lbs` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Experience</span>
                  <span style={{ color: colors.text, fontWeight: 500, textTransform: 'capitalize' }}>
                    {profile?.experience_level || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Weight Goal */}
            {weightGoal && (
              <div className="card">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weight Goal
                </h2>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <p style={{ color: colors.textMuted, fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Start</p>
                    <span style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600 }}>{weightGoal.start_weight}</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs</span>
                  </div>
                  <div style={{ color: colors.accent, fontSize: '1.5rem' }}>→</div>
                  <div className="text-center flex-1">
                    <p style={{ color: colors.textMuted, fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Current</p>
                    <span style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>{currentWeight || '—'}</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs</span>
                  </div>
                  <div style={{ color: colors.accent, fontSize: '1.5rem' }}>→</div>
                  <div className="text-center flex-1">
                    <p style={{ color: colors.textMuted, fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Target</p>
                    <span style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600 }}>{weightGoal.target_weight || '—'}</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs</span>
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(201, 167, 90, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>
                    {weightGoal.goal_type === 'cut' ? '📉' : weightGoal.goal_type === 'bulk' ? '📈' : '⚖️'}
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                    {weightGoal.goal_type} — AI will factor recovery needs
                  </span>
                </div>
              </div>
            )}

            {/* Fitness Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fitness Goal
                </h2>
                {savingGoal && (
                  <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                    Saving...
                  </span>
                )}
              </div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                AI will adjust workouts based on your goal
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fitnessGoals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalChange(goal.id)}
                    disabled={savingGoal}
                    style={{
                      background: currentGoal === goal.id
                        ? 'rgba(201, 167, 90, 0.2)'
                        : 'rgba(15, 34, 51, 0.5)',
                      border: currentGoal === goal.id
                        ? '2px solid #C9A75A'
                        : '1px solid rgba(201, 167, 90, 0.1)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: savingGoal ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: savingGoal ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{goal.icon}</div>
                    <div style={{
                      color: currentGoal === goal.id ? '#C9A75A' : '#F5F1EA',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}>
                      {goal.name}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '0.625rem', marginTop: '0.125rem' }}>
                      {goal.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Injuries & Limitations */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Injuries & Limitations
                </h2>
                <button style={{ color: colors.accent, background: 'none', border: 'none', fontSize: '1.5rem' }}>
                  +
                </button>
              </div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '1rem' }}>
                AI will suggest alternatives that work the same muscles without aggravating these areas
              </p>
              <div className="text-center py-4">
                <p style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                  No injuries recorded
                </p>
              </div>
            </div>

            {/* Equipment */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Equipment
                </h2>
                <button
                  onClick={() => setGymManagerOpen(true)}
                  style={{
                    background: 'rgba(201, 167, 90, 0.2)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    color: colors.accent,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Manage Gyms
                </button>
              </div>
              <div className="space-y-3">
                {/* Home Equipment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: colors.text, fontSize: '0.875rem' }}>🏠 Home</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {homeEquipmentNames.length} items
                    </span>
                  </div>
                  {homeEquipmentNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {homeEquipmentNames.slice(0, 6).map(item => (
                        <span
                          key={item}
                          style={{
                            background: 'rgba(201, 167, 90, 0.1)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: colors.textMuted,
                            fontSize: '0.6875rem',
                          }}
                        >
                          {item}
                        </span>
                      ))}
                      {homeEquipmentNames.length > 6 && (
                        <span style={{ color: colors.textMuted, fontSize: '0.6875rem', padding: '0.25rem' }}>
                          +{homeEquipmentNames.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      No home equipment set up
                    </p>
                  )}
                </div>

                {/* Gym Equipment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: colors.text, fontSize: '0.875rem' }}>🏋️ Gym</span>
                    <span style={{ color: gymEquipmentNames.length > 0 ? '#4ADE80' : 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                      {gymEquipmentNames.length > 20 ? 'Full access' : `${gymEquipmentNames.length} items`}
                    </span>
                  </div>
                  {gymEquipmentNames.length > 0 && gymEquipmentNames.length <= 20 && (
                    <div className="flex flex-wrap gap-1">
                      {gymEquipmentNames.slice(0, 6).map(item => (
                        <span
                          key={item}
                          style={{
                            background: 'rgba(201, 167, 90, 0.1)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: colors.textMuted,
                            fontSize: '0.6875rem',
                          }}
                        >
                          {item}
                        </span>
                      ))}
                      {gymEquipmentNames.length > 6 && (
                        <span style={{ color: colors.textMuted, fontSize: '0.6875rem', padding: '0.25rem' }}>
                          +{gymEquipmentNames.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Gym Profiles */}
                {gymProfiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderSubtle}` }}>
                    <div style={{ color: colors.textMuted, fontSize: '0.6875rem', marginBottom: '0.5rem' }}>
                      Saved Gyms
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gymProfiles.map(gym => (
                        <span
                          key={gym.id}
                          style={{
                            background: gym.is_default ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                            border: gym.is_default ? '1px solid rgba(201, 167, 90, 0.4)' : '1px solid rgba(201, 167, 90, 0.1)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: gym.is_default ? '#C9A75A' : 'rgba(245, 241, 234, 0.7)',
                            fontSize: '0.6875rem',
                          }}
                        >
                          {gym.name}
                          {gym.is_default && ' ★'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRs */}
            <div className="card">
              <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Records
              </h2>
              {majorLiftPRs.some(pr => pr.weight > 0) ? (
                <div className="grid grid-cols-2 gap-3">
                  {majorLiftPRs.map(pr => (
                    <div
                      key={pr.lift}
                      style={{
                        background: 'rgba(15, 34, 51, 0.5)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{pr.lift}</div>
                      <div style={{ color: pr.weight > 0 ? '#C9A75A' : 'rgba(245, 241, 234, 0.3)', fontSize: '1.25rem', fontWeight: 700 }}>
                        {pr.weight > 0 ? pr.weight : '—'}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
                        {pr.reps > 0 ? `× ${pr.reps}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                    No PRs recorded yet
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Complete workouts to track your PRs
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          background: colors.cardBg,
          borderTop: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div className="flex justify-around py-3">
          {[
            { icon: '🏋️', label: 'Workout', href: '/' },
            { icon: '📊', label: 'Progress', href: '/progress' },
            { icon: '📚', label: 'Library', href: '/library' },
            { icon: '👤', label: 'Profile', href: '/profile', active: true },
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

      {/* Gym Manager Modal */}
      <GymManager isOpen={gymManagerOpen} onClose={() => setGymManagerOpen(false)} />
    </div>
  );
}
