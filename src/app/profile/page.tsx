'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BodyMap } from '@/components/BodyMap';
import { ExpandableWorkoutCard } from '@/components/ExpandableWorkoutCard';
import { GymManager } from '@/components/GymManager';
import { Header } from '@/components/Header';
import { Settings } from '@/components/Settings';
import { BottomNav } from '@/components/BottomNav';
import { useProfile, useEquipment, useGymProfiles, useWeightLogs, useWeightGoal, useWorkoutSessions, useInjuries, useBookmarkedWorkouts } from '@/hooks/useSupabase';
import { useStrengthData, convertToMuscleStrength, formatVolume, formatDate, formatDaysAgo, ExercisePR, MuscleVolume } from '@/hooks/useStrengthData';
import { StreakTracker } from '@/components/StreakTracker';
import { WorkoutCalendar } from '@/components/WorkoutCalendar';
import { useWorkoutPlans, DAY_NAMES } from '@/hooks/useWorkoutPlans';
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
  const { goal: weightGoal, setWeightGoal, refetch: refetchWeightGoal } = useWeightGoal();
  const { sessions } = useWorkoutSessions(10);
  const { muscleVolume, exercisePRs, sessions: strengthSessions, streakData, calendarData, loading: strengthLoading } = useStrengthData();
  const { plans, activePlan, setActivePlanById, deletePlan, loading: plansLoading, getAdherenceStats } = useWorkoutPlans();
  const { injuries, addInjury, removeInjury } = useInjuries();
  const { savedWorkouts, loading: savedWorkoutsLoading, unsaveWorkout } = useBookmarkedWorkouts();

  const [activeTab, setActiveTab] = useState<'body' | 'saved' | 'history' | 'settings'>('body');
  const [gender, setGender] = useState<'male' | 'female'>((profile?.gender as 'male' | 'female') || 'male');
  const [savingGoal, setSavingGoal] = useState(false);
  const [gymManagerOpen, setGymManagerOpen] = useState(false);

  // Weight goal editor state
  const [showWeightGoalEditor, setShowWeightGoalEditor] = useState(false);
  const [editGoalType, setEditGoalType] = useState<'cut' | 'bulk' | 'maintain' | 'recomp'>('maintain');
  const [editStartWeight, setEditStartWeight] = useState('');
  const [editTargetWeight, setEditTargetWeight] = useState('');
  const [savingWeightGoal, setSavingWeightGoal] = useState(false);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(true);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [showAllHomeEquipment, setShowAllHomeEquipment] = useState(false);
  const [showAllGymEquipment, setShowAllGymEquipment] = useState(false);

  // Injury editor state
  const [showInjuryEditor, setShowInjuryEditor] = useState(false);
  const [injuryBodyPart, setInjuryBodyPart] = useState('');
  const [injurySeverity, setInjurySeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');
  const [injuryDescription, setInjuryDescription] = useState('');
  const [injuryMovements, setInjuryMovements] = useState('');
  const [savingInjury, setSavingInjury] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

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
              padding: '0.875rem 0.75rem',
              minHeight: '48px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : '2px solid transparent',
              color: activeTab === tab ? colors.accent : colors.textMuted,
              fontSize: '0.8125rem',
              fontWeight: 500,
              textTransform: 'capitalize',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
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
            <div className="profile-body-grid">
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
                      style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: colors.accent }}
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
          <div className="space-y-4">
            {/* Weekly Plans Section */}
            <div>
              <h2 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Weekly Plans
              </h2>

              {plansLoading ? (
                <div className="text-center py-4">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-2 mx-auto"
                    style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: colors.accent }}
                  />
                </div>
              ) : plans.length > 0 ? (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      style={{
                        background: colors.cardBg,
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: plan.is_active ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: colors.text, fontSize: '1rem', fontWeight: 600 }}>
                              {plan.name}
                            </span>
                            {plan.is_active && (
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
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {plan.days.length} days • {plan.description || 'Custom plan'}
                          </div>
                          {/* Completion Progress for Active Plan */}
                          {plan.is_active && (() => {
                            const stats = getAdherenceStats();
                            if (stats.totalDays === 0) return null;
                            return (
                              <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{
                                    flex: 1,
                                    height: '4px',
                                    background: colors.inputBg,
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                  }}>
                                    <div
                                      style={{
                                        width: `${stats.adherencePercent}%`,
                                        height: '100%',
                                        background: stats.adherencePercent >= 80 ? '#22c55e' : stats.adherencePercent >= 50 ? colors.accent : '#f59e0b',
                                        borderRadius: '2px',
                                        transition: 'width 0.3s ease',
                                      }}
                                    />
                                  </div>
                                  <span style={{ color: colors.textMuted, fontSize: '0.6875rem', fontWeight: 500 }}>
                                    {stats.completedDays}/{stats.totalDays}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex gap-2">
                          {!plan.is_active && (
                            <button
                              onClick={() => setActivePlanById(plan.id)}
                              style={{
                                background: 'rgba(201, 167, 90, 0.2)',
                                color: colors.accent,
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.375rem 0.625rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this plan?')) {
                                deletePlan(plan.id);
                              }
                            }}
                            style={{
                              background: 'rgba(248, 113, 113, 0.1)',
                              color: '#F87171',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.625rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Day Schedule */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.days.map((day) => (
                          <div
                            key={day.id}
                            style={{
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.5rem',
                            }}
                          >
                            <div style={{ color: colors.accent, fontSize: '0.6875rem', fontWeight: 600 }}>
                              {DAY_NAMES[day.day_of_week]}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: '0.625rem' }}>
                              {day.workout?.name?.replace(/^\w+:\s*/, '') || day.muscle_focus?.slice(0, 2).join(', ') || 'Rest'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: colors.cardBg,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    border: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    No workout plans yet
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Create a weekly plan from the home page
                  </p>
                </div>
              )}
            </div>

            {/* Saved Workouts Section */}
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ color: colors.accent, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Bookmarked Workouts
              </h2>

              {savedWorkoutsLoading ? (
                <div className="text-center py-4">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-2 mx-auto"
                    style={{ borderColor: 'rgba(201, 167, 90, 0.2)', borderTopColor: colors.accent }}
                  />
                </div>
              ) : savedWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {savedWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      style={{
                        background: colors.cardBg,
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: `1px solid ${colors.borderSubtle}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div style={{ flex: 1 }}>
                          <div style={{ color: colors.text, fontSize: '1rem', fontWeight: 600 }}>
                            {workout.name}
                          </div>
                          {workout.description && (
                            <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {workout.description}
                            </div>
                          )}
                          <div style={{ color: colors.textMuted, fontSize: '0.6875rem', marginTop: '0.375rem' }}>
                            {workout.exercises?.length || 0} exercises • {workout.estimated_duration || 45} min
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm('Remove this workout from bookmarks?')) {
                              const success = await unsaveWorkout(workout.id);
                              if (success) {
                                setSaveSuccess('Workout removed from bookmarks');
                                setTimeout(() => setSaveSuccess(null), 3000);
                              } else {
                                setSaveError('Failed to remove workout');
                                setTimeout(() => setSaveError(null), 4000);
                              }
                            }
                          }}
                          style={{
                            background: 'rgba(248, 113, 113, 0.1)',
                            color: '#F87171',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.375rem 0.625rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            minHeight: '32px',
                          }}
                          aria-label={`Remove ${workout.name} from bookmarks`}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Target Muscles Tags */}
                      {workout.target_muscles && workout.target_muscles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workout.target_muscles.slice(0, 4).map((muscle) => (
                            <span
                              key={muscle}
                              style={{
                                background: colors.accentMuted,
                                borderRadius: '999px',
                                padding: '0.125rem 0.375rem',
                                fontSize: '0.5625rem',
                                color: colors.accent,
                                textTransform: 'capitalize',
                              }}
                            >
                              {muscle.replace('_', ' ')}
                            </span>
                          ))}
                          {workout.target_muscles.length > 4 && (
                            <span style={{ fontSize: '0.5625rem', color: colors.textMuted }}>
                              +{workout.target_muscles.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Use This Workout Button */}
                      <Link
                        href={`/workout?bookmarkId=${workout.id}`}
                        style={{
                          display: 'block',
                          width: '100%',
                          marginTop: '0.75rem',
                          padding: '0.625rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(201, 167, 90, 0.1)',
                          border: `1px solid ${colors.accent}`,
                          color: colors.accent,
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          textAlign: 'center',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Use This Workout
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: colors.cardBg,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    border: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    No bookmarked workouts yet
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Save workouts after generating them to access them here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {/* Streak Tracker */}
            <StreakTracker streakData={streakData} />

            {/* Workout Calendar Heatmap */}
            <WorkoutCalendar calendarData={calendarData} weeks={12} />

            {/* Recent Workouts Header */}
            <div className="flex items-center justify-between" style={{ marginTop: '0.5rem' }}>
              <span style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 600 }}>
                Recent Workouts
              </span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                {strengthSessions.length} sessions
              </span>
            </div>

            {strengthSessions.length === 0 ? (
              <div className="text-center py-8">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏋️</div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                  No workout history yet
                </p>
                <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  Complete a workout to see it here
                </p>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '0.625rem 1.25rem',
                    background: colors.accent,
                    color: colors.bg,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Start Your First Workout
                </Link>
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
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
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
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weight Goal
                </h2>
                <button
                  onClick={() => {
                    // Pre-fill with current values if editing
                    if (weightGoal) {
                      setEditGoalType(weightGoal.goal_type as 'cut' | 'bulk' | 'maintain' | 'recomp');
                      setEditStartWeight(weightGoal.start_weight?.toString() || '');
                      setEditTargetWeight(weightGoal.target_weight?.toString() || '');
                    } else {
                      setEditGoalType('maintain');
                      setEditStartWeight(currentWeight?.toString() || '');
                      setEditTargetWeight('');
                    }
                    setShowWeightGoalEditor(true);
                  }}
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
                  {weightGoal ? 'Edit' : 'Set Goal'}
                </button>
              </div>
              {weightGoal ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-4">
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    No weight goal set
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Set a goal to track your progress
                  </p>
                </div>
              )}
            </div>

            {/* Fitness Goal */}
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
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
                        : colors.inputBg,
                      border: currentGoal === goal.id
                        ? `2px solid ${colors.accent}`
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
                      color: currentGoal === goal.id ? colors.accent : colors.text,
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
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Injuries & Limitations
                </h2>
                <button
                  onClick={() => {
                    setInjuryBodyPart('');
                    setInjurySeverity('moderate');
                    setInjuryDescription('');
                    setInjuryMovements('');
                    setShowInjuryEditor(true);
                  }}
                  style={{
                    color: colors.accent,
                    background: 'rgba(201, 167, 90, 0.2)',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
              </div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '1rem' }}>
                AI will suggest alternatives that work the same muscles without aggravating these areas
              </p>
              {injuries.length > 0 ? (
                <div className="space-y-2">
                  {injuries.map(injury => (
                    <div
                      key={injury.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: colors.text, fontWeight: 500 }}>
                              {injury.body_part}
                            </span>
                            <span
                              style={{
                                fontSize: '0.625rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '999px',
                                background: injury.severity === 'severe' ? 'rgba(239, 68, 68, 0.3)' :
                                           injury.severity === 'moderate' ? 'rgba(251, 146, 60, 0.3)' :
                                           'rgba(250, 204, 21, 0.3)',
                                color: injury.severity === 'severe' ? '#EF4444' :
                                       injury.severity === 'moderate' ? '#FB923C' :
                                       '#FACC15',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                              }}
                            >
                              {injury.severity}
                            </span>
                          </div>
                          {injury.description && (
                            <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {injury.description}
                            </p>
                          )}
                          {injury.movements_to_avoid && injury.movements_to_avoid.length > 0 && (
                            <p style={{ color: 'rgba(239, 68, 68, 0.7)', fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                              Avoid: {injury.movements_to_avoid.join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeInjury(injury.id)}
                          style={{
                            color: colors.textMuted,
                            background: 'none',
                            border: 'none',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>
                    No injuries recorded
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Add any injuries so AI can avoid aggravating movements
                  </p>
                </div>
              )}
            </div>

            {/* Equipment */}
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
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
                      {(showAllHomeEquipment ? homeEquipmentNames : homeEquipmentNames.slice(0, 6)).map(item => (
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
                        <button
                          onClick={() => setShowAllHomeEquipment(!showAllHomeEquipment)}
                          style={{
                            background: 'rgba(201, 167, 90, 0.15)',
                            border: '1px solid rgba(201, 167, 90, 0.3)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: colors.accent,
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {showAllHomeEquipment ? 'Show less' : `+${homeEquipmentNames.length - 6} more`}
                        </button>
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
                      {(showAllGymEquipment ? gymEquipmentNames : gymEquipmentNames.slice(0, 6)).map(item => (
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
                        <button
                          onClick={() => setShowAllGymEquipment(!showAllGymEquipment)}
                          style={{
                            background: 'rgba(201, 167, 90, 0.15)',
                            border: '1px solid rgba(201, 167, 90, 0.3)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: colors.accent,
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {showAllGymEquipment ? 'Show less' : `+${gymEquipmentNames.length - 6} more`}
                        </button>
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
                            background: gym.is_default ? 'rgba(201, 167, 90, 0.2)' : colors.inputBg,
                            border: gym.is_default ? '1px solid rgba(201, 167, 90, 0.4)' : '1px solid rgba(201, 167, 90, 0.1)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: gym.is_default ? colors.accent : colors.textMuted,
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
            <div style={{ background: colors.cardBg, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${colors.borderSubtle}` }}>
              <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Records
              </h2>
              {majorLiftPRs.some(pr => pr.weight > 0) ? (
                <div className="grid grid-cols-2 gap-3">
                  {majorLiftPRs.map(pr => (
                    <div
                      key={pr.lift}
                      style={{
                        background: colors.inputBg,
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{pr.lift}</div>
                      <div style={{ color: pr.weight > 0 ? colors.accent : colors.textMuted, fontSize: '1.25rem', fontWeight: 700 }}>
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
                  <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Complete workouts to track your PRs
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Success Toast */}
      {saveSuccess && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(34, 197, 94, 0.95)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {saveSuccess}
        </div>
      )}

      {/* Error Toast */}
      {saveError && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {saveError}
        </div>
      )}

      {/* Gym Manager Modal */}
      <GymManager isOpen={gymManagerOpen} onClose={() => setGymManagerOpen(false)} />

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Weight Goal Editor Modal */}
      {showWeightGoalEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setShowWeightGoalEditor(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="weight-goal-modal-title"
        >
          <div
            className="w-full max-w-sm"
            style={{
              background: colors.cardBg,
              borderRadius: '1rem',
              border: `1px solid ${colors.borderSubtle}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${colors.borderSubtle}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 id="weight-goal-modal-title" style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
                {weightGoal ? 'Edit Weight Goal' : 'Set Weight Goal'}
              </h3>
              <button
                onClick={() => setShowWeightGoalEditor(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: 'none',
                  color: colors.textMuted,
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1rem' }}>
              {/* Goal Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Goal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cut', label: 'Cut', icon: '📉', desc: 'Lose weight' },
                    { id: 'bulk', label: 'Bulk', icon: '📈', desc: 'Gain muscle' },
                    { id: 'maintain', label: 'Maintain', icon: '⚖️', desc: 'Stay steady' },
                    { id: 'recomp', label: 'Recomp', icon: '🔄', desc: 'Lose fat, gain muscle' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setEditGoalType(type.id as 'cut' | 'bulk' | 'maintain' | 'recomp')}
                      style={{
                        padding: '0.75rem',
                        background: editGoalType === type.id ? 'rgba(201, 167, 90, 0.2)' : colors.inputBg,
                        border: editGoalType === type.id ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{type.icon}</span>
                        <span style={{ color: editGoalType === type.id ? colors.accent : colors.text, fontWeight: 500 }}>
                          {type.label}
                        </span>
                      </div>
                      <p style={{ color: colors.textMuted, fontSize: '0.625rem', marginTop: '0.25rem' }}>
                        {type.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Weight */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Start Weight (lbs)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editStartWeight}
                  onChange={e => setEditStartWeight(e.target.value)}
                  placeholder={currentWeight?.toString() || '180'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.5rem',
                    color: colors.text,
                    fontSize: '1rem',
                  }}
                />
                {currentWeight && (
                  <button
                    onClick={() => setEditStartWeight(currentWeight.toString())}
                    style={{
                      marginTop: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: colors.accent,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Use current weight ({currentWeight} lbs)
                  </button>
                )}
              </div>

              {/* Target Weight */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Target Weight (lbs) {editGoalType === 'maintain' && '(optional)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editTargetWeight}
                  onChange={e => setEditTargetWeight(e.target.value)}
                  placeholder={editGoalType === 'maintain' ? 'Same as start' : '160'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.5rem',
                    color: colors.text,
                    fontSize: '1rem',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeightGoalEditor(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'transparent',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.75rem',
                    color: colors.textMuted,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const startWeight = parseFloat(editStartWeight);
                    if (isNaN(startWeight) || startWeight <= 0) return;

                    const targetWeight = editTargetWeight ? parseFloat(editTargetWeight) : undefined;

                    setSavingWeightGoal(true);
                    setSaveError(null);
                    try {
                      await setWeightGoal(editGoalType, startWeight, targetWeight);
                      await refetchWeightGoal();
                      setShowWeightGoalEditor(false);
                      setSaveSuccess('Weight goal saved');
                      setTimeout(() => setSaveSuccess(null), 3000);
                    } catch (err) {
                      console.error('Failed to save weight goal:', err);
                      setSaveError('Failed to save weight goal. Please try again.');
                      setTimeout(() => setSaveError(null), 4000);
                    } finally {
                      setSavingWeightGoal(false);
                    }
                  }}
                  disabled={savingWeightGoal || !editStartWeight}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    opacity: savingWeightGoal || !editStartWeight ? 0.6 : 1,
                  }}
                >
                  {savingWeightGoal ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Injury Editor Modal */}
      {showInjuryEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setShowInjuryEditor(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="injury-modal-title"
        >
          <div
            className="w-full max-w-sm"
            style={{
              background: colors.cardBg,
              borderRadius: '1rem',
              border: `1px solid ${colors.borderSubtle}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${colors.borderSubtle}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 id="injury-modal-title" style={{ color: colors.accent, fontSize: '1rem', fontWeight: 600 }}>
                Add Injury
              </h3>
              <button
                onClick={() => setShowInjuryEditor(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: 'none',
                  color: colors.textMuted,
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1rem' }}>
              {/* Body Part */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Body Part *
                </label>
                <select
                  value={injuryBodyPart}
                  onChange={e => setInjuryBodyPart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.5rem',
                    color: colors.text,
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select body part...</option>
                  <option value="Shoulder">Shoulder</option>
                  <option value="Elbow">Elbow</option>
                  <option value="Wrist">Wrist</option>
                  <option value="Lower Back">Lower Back</option>
                  <option value="Upper Back">Upper Back</option>
                  <option value="Neck">Neck</option>
                  <option value="Hip">Hip</option>
                  <option value="Knee">Knee</option>
                  <option value="Ankle">Ankle</option>
                  <option value="Chest">Chest</option>
                  <option value="Hamstring">Hamstring</option>
                  <option value="Quadricep">Quadricep</option>
                  <option value="Calf">Calf</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Severity */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Severity
                </label>
                <div className="flex gap-2">
                  {(['minor', 'moderate', 'severe'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setInjurySeverity(sev)}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        border: injurySeverity === sev ? '2px solid' : `1px solid ${colors.borderSubtle}`,
                        borderColor: injurySeverity === sev
                          ? (sev === 'severe' ? '#EF4444' : sev === 'moderate' ? '#FB923C' : '#FACC15')
                          : colors.borderSubtle,
                        background: injurySeverity === sev
                          ? (sev === 'severe' ? 'rgba(239, 68, 68, 0.2)' : sev === 'moderate' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(250, 204, 21, 0.2)')
                          : colors.inputBg,
                        color: injurySeverity === sev
                          ? (sev === 'severe' ? '#EF4444' : sev === 'moderate' ? '#FB923C' : '#FACC15')
                          : colors.textMuted,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={injuryDescription}
                  onChange={e => setInjuryDescription(e.target.value)}
                  placeholder="e.g., Rotator cuff strain"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.5rem',
                    color: colors.text,
                    fontSize: '1rem',
                  }}
                />
              </div>

              {/* Movements to Avoid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: colors.textMuted, fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                  Movements to Avoid (comma separated)
                </label>
                <input
                  type="text"
                  value={injuryMovements}
                  onChange={e => setInjuryMovements(e.target.value)}
                  placeholder="e.g., overhead press, lateral raises"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.5rem',
                    color: colors.text,
                    fontSize: '1rem',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInjuryEditor(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'transparent',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.75rem',
                    color: colors.textMuted,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!injuryBodyPart) return;

                    setSavingInjury(true);
                    setSaveError(null);
                    try {
                      const movements = injuryMovements
                        .split(',')
                        .map(m => m.trim())
                        .filter(m => m.length > 0);

                      await addInjury(
                        injuryBodyPart,
                        injurySeverity,
                        injuryDescription || undefined,
                        movements.length > 0 ? movements : undefined
                      );
                      setShowInjuryEditor(false);
                      setSaveSuccess('Injury added successfully');
                      setTimeout(() => setSaveSuccess(null), 3000);
                    } catch (err) {
                      console.error('Failed to add injury:', err);
                      setSaveError('Failed to add injury. Please try again.');
                      setTimeout(() => setSaveError(null), 4000);
                    } finally {
                      setSavingInjury(false);
                    }
                  }}
                  disabled={savingInjury || !injuryBodyPart}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    opacity: savingInjury || !injuryBodyPart ? 0.6 : 1,
                  }}
                >
                  {savingInjury ? 'Saving...' : 'Add Injury'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
