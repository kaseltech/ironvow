'use client';

import { useState, useMemo } from 'react';
import { BodyMap } from '@/components/BodyMap';
import { ExpandableWorkoutCard } from '@/components/ExpandableWorkoutCard';
import { GymManager } from '@/components/GymManager';
import { Header } from '@/components/Header';
import { Settings } from '@/components/Settings';
import { useProfile, useEquipment, useGymProfiles, useWeightLogs, useWeightGoal, useWorkoutSessions } from '@/hooks/useSupabase';
import { useStrengthData, convertToMuscleStrength, formatVolume, formatDate, formatDaysAgo, ExercisePR, MuscleVolume } from '@/hooks/useStrengthData';
import { useTheme } from '@/context/ThemeContext';
import { getSupabase } from '@/lib/supabase/client';
import { MAJOR_LIFTS, findStandardForExercise } from '@/lib/strengthStandards';

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

function getMuscleVariations(muscleId: string): string[] {
  return muscleMapping[muscleId] || [muscleId];
}

// Format volume for inline display
function formatVolumeShort(volume: number): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toLocaleString();
}

// Format date for inline display
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return '1w ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// All muscle groups ordered head-to-toe for the front view menu
const FRONT_MUSCLES = [
  { id: 'traps', name: 'Traps' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'chest', name: 'Chest' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'core', name: 'Core' },
  { id: 'obliques', name: 'Obliques' },
  { id: 'quads', name: 'Quads' },
  { id: 'adductors', name: 'Adductors' },
];

// All muscle groups ordered head-to-toe for the back view menu
const BACK_MUSCLES = [
  { id: 'traps', name: 'Traps' },
  { id: 'shoulders', name: 'Rear Delts' },
  { id: 'upper_back', name: 'Upper Back' },
  { id: 'lats', name: 'Lats' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'lower_back', name: 'Lower Back' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'calves', name: 'Calves' },
];

// Combined for lookups
const MUSCLE_GROUPS = [
  { id: 'traps', name: 'Traps' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'chest', name: 'Chest' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'lats', name: 'Lats' },
  { id: 'upper_back', name: 'Upper Back' },
  { id: 'lower_back', name: 'Lower Back' },
  { id: 'core', name: 'Core' },
  { id: 'obliques', name: 'Obliques' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'adductors', name: 'Adductors' },
  { id: 'calves', name: 'Calves' },
];

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
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(true);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');

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

  // Get selected muscle name
  const selectedMuscleName = useMemo(() => {
    const muscle = MUSCLE_GROUPS.find(m => m.id === selectedMuscleId);
    return muscle?.name || selectedMuscleId?.replace('_', ' ') || '';
  }, [selectedMuscleId]);

  // Get exercises that target the selected muscle
  const selectedMuscleExercises = useMemo(() => {
    if (!selectedMuscleId) return [];
    const variations = getMuscleVariations(selectedMuscleId);

    return exercisePRs.filter(pr => {
      const primaryMuscles = pr.primary_muscles || [];
      return primaryMuscles.some(m =>
        variations.includes(m.toLowerCase())
      );
    }).sort((a, b) => b.estimated_1rm - a.estimated_1rm);
  }, [selectedMuscleId, exercisePRs]);

  // Get volume data for selected muscle
  const selectedMuscleVolume = useMemo(() => {
    if (!selectedMuscleId) return null;
    const variations = getMuscleVariations(selectedMuscleId);

    const matchingVolume = muscleVolume.find(mv =>
      variations.includes(mv.muscle.toLowerCase())
    );

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
  }, [selectedMuscleId, muscleVolume]);

  // Calculate trend based on training frequency
  const selectedMuscleTrend = useMemo(() => {
    if (!selectedMuscleVolume) return 'stable';
    if (selectedMuscleVolume.training_days >= 3) return 'up';
    if (selectedMuscleVolume.training_days <= 1) return 'down';
    return 'stable';
  }, [selectedMuscleVolume]);

  // Handle muscle selection from menu or body map
  const handleMuscleSelect = (muscleId: string) => {
    setSelectedMuscleId(prev => prev === muscleId ? null : muscleId);
    setExercisesExpanded(true);
  };

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
      <Header onSettingsClick={() => setShowSettings(true)} />

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

      <main className="p-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
        {activeTab === 'body' && (
          <div>
            {/* Responsive Three-Column Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr minmax(200px, 320px) 1fr',
                gap: '1rem',
                alignItems: 'start',
                minHeight: '60vh',
              }}
            >
              {/* Left Panel - Muscle Menu */}
              <div
                style={{
                  background: colors.cardBg,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <div style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  {bodyView === 'front' ? 'Front' : 'Back'} Muscles
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(bodyView === 'front' ? FRONT_MUSCLES : BACK_MUSCLES).map(muscle => {
                    const muscleData = muscleStrengthData.find(d => d.id === muscle.id);
                    const isSelected = selectedMuscleId === muscle.id;
                    const strengthColor = muscleData
                      ? muscleData.strength >= 70 ? '#4ADE80' : muscleData.strength >= 40 ? '#FACC15' : '#F87171'
                      : colors.borderSubtle;

                    return (
                      <button
                        key={muscle.id}
                        onClick={() => handleMuscleSelect(muscle.id)}
                        onMouseEnter={() => {
                          // Switch to back view if hovering over back-only muscles
                          const backOnlyMuscles = ['lats', 'upper_back', 'lower_back', 'glutes', 'hamstrings', 'calves', 'triceps'];
                          if (backOnlyMuscles.includes(muscle.id) && bodyView === 'front') {
                            setBodyView('back');
                          }
                          // Switch to front view if hovering over front-only muscles
                          const frontOnlyMuscles = ['chest', 'biceps', 'core', 'obliques', 'quads', 'adductors'];
                          if (frontOnlyMuscles.includes(muscle.id) && bodyView === 'back') {
                            setBodyView('front');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: isSelected ? 'rgba(201, 167, 90, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          border: isSelected ? `2px solid ${colors.accent}` : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ color: isSelected ? colors.accent : colors.text, fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400 }}>
                          {muscle.name}
                        </span>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: strengthColor,
                            boxShadow: muscleData ? `0 0 6px ${strengthColor}` : 'none',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center - Body Map */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {strengthLoading ? (
                  <div className="flex items-center justify-center" style={{ height: '400px' }}>
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-2"
                      style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: '#C9A75A' }}
                    />
                  </div>
                ) : (
                  <BodyMap
                    gender={gender}
                    muscleData={muscleStrengthData}
                    selectedMuscleId={selectedMuscleId}
                    onMuscleSelect={(muscle) => handleMuscleSelect(muscle.id)}
                    view={bodyView}
                    onViewChange={setBodyView}
                  />
                )}
              </div>

              {/* Right Panel - Details & Summary */}
              <div
                style={{
                  background: colors.cardBg,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                {selectedMuscleId ? (
                  <>
                    {/* Selected Muscle Header */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                      <span style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {selectedMuscleName}
                      </span>
                      <button
                        onClick={() => setSelectedMuscleId(null)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1rem', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ×
                      </button>
                    </div>

                    {selectedMuscleExercises.length > 0 || selectedMuscleVolume ? (
                      <>
                        {/* Stats */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: colors.textMuted }}>Volume (30d)</span>
                            <span style={{ color: colors.text, fontWeight: 600 }}>
                              {selectedMuscleVolume ? formatVolumeShort(selectedMuscleVolume.total_volume) : '—'} lbs
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: colors.textMuted }}>Last Trained</span>
                            <span style={{ color: colors.text, fontWeight: 600 }}>
                              {selectedMuscleVolume ? formatDateShort(selectedMuscleVolume.last_trained) : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: colors.textMuted }}>Trend</span>
                            <span style={{
                              color: selectedMuscleTrend === 'up' ? '#4ADE80' : selectedMuscleTrend === 'down' ? '#F87171' : colors.accent,
                              fontWeight: 600,
                            }}>
                              {selectedMuscleTrend === 'up' ? '↑ Improving' : selectedMuscleTrend === 'down' ? '↓ Declining' : '→ Stable'}
                            </span>
                          </div>
                        </div>

                        {/* Top Exercises */}
                        {selectedMuscleExercises.length > 0 && (
                          <div>
                            <div style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                              Top Exercises
                            </div>
                            {selectedMuscleExercises.slice(0, 4).map((exercise) => (
                              <div
                                key={exercise.exercise_id}
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  marginBottom: '0.375rem',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderRadius: '0.5rem',
                                }}
                              >
                                <div style={{ color: colors.text, fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.125rem' }}>
                                  {exercise.exercise_name}
                                </div>
                                <div style={{ color: colors.accent, fontSize: '0.75rem' }}>
                                  {exercise.pr_weight} × {exercise.pr_reps} reps • {Math.round(exercise.estimated_1rm)} e1RM
                                </div>
                              </div>
                            ))}
                            {selectedMuscleExercises.length > 4 && (
                              <div style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'center', paddingTop: '0.25rem' }}>
                                +{selectedMuscleExercises.length - 4} more exercises
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No data yet for this muscle</p>
                        <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                          Complete workouts targeting this muscle to see stats
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Summary when no muscle selected */}
                    <div style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                      Balance Summary
                    </div>

                    {muscleStrengthData.length > 0 ? (
                      <>
                        {strongest && (
                          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                            <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Strongest Muscle</div>
                            <div style={{ color: '#4ADE80', fontSize: '1rem', fontWeight: 600 }}>{strongest.name}</div>
                          </div>
                        )}
                        {weakest && (
                          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                            <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Needs Attention</div>
                            <div style={{ color: '#F87171', fontSize: '1rem', fontWeight: 600 }}>{weakest.name}</div>
                          </div>
                        )}
                        {imbalances.length > 0 && (
                          <div style={{ background: 'rgba(251, 146, 60, 0.1)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
                            <div style={{ color: '#FB923C', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Potential Imbalances</div>
                            <div style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                              {imbalances.slice(0, 3).map(m => m.name).join(', ')} haven't been trained recently
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No workout data yet</p>
                        <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                          Complete workouts to see your muscle balance
                        </p>
                      </div>
                    )}

                    {/* View Toggle */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>Body Model</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setGender('male')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            background: gender === 'male' ? 'rgba(201, 167, 90, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            border: gender === 'male' ? `1px solid ${colors.accent}` : '1px solid transparent',
                            color: gender === 'male' ? colors.accent : colors.textMuted,
                            cursor: 'pointer',
                          }}
                        >
                          Male
                        </button>
                        <button
                          onClick={() => setGender('female')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            background: gender === 'female' ? 'rgba(201, 167, 90, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            border: gender === 'female' ? `1px solid ${colors.accent}` : '1px solid transparent',
                            color: gender === 'female' ? colors.accent : colors.textMuted,
                            cursor: 'pointer',
                          }}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tap instruction */}
            <p className="text-center mt-4" style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
              Tap a muscle on the body or in the list to see detailed stats
            </p>
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
                <ExpandableWorkoutCard
                  key={workout.session_id}
                  session={workout}
                />
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
        className="fixed bottom-0 left-0 right-0"
        style={{
          background: colors.cardBg,
          borderTop: `1px solid ${colors.borderSubtle}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
