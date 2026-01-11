'use client';

import { useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { DAY_NAMES, DAY_NAMES_FULL } from '@/hooks/useWorkoutPlans';
import type { WorkoutStyle } from '@/lib/generateWorkout';

interface DayConfig {
  day_of_week: number;
  muscle_focus: string[];
  workout_style: WorkoutStyle | 'auto';
}

interface WeeklyPlannerProps {
  duration: number;
  onGenerate: (days: DayConfig[], planName: string) => void;
  generating: boolean;
}

const muscleGroups = [
  { id: 'chest', name: 'Chest' },
  { id: 'back', name: 'Back' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'calves', name: 'Calves' },
  { id: 'abs', name: 'Abs' },
];

const workoutStyles: { id: WorkoutStyle | 'auto'; name: string }[] = [
  { id: 'auto', name: 'Auto (AI decides)' },
  { id: 'traditional', name: 'Traditional' },
  { id: 'strength', name: 'Strength (5x5)' },
  { id: 'hiit', name: 'HIIT' },
  { id: 'circuit', name: 'Circuit' },
];

// Preset split suggestions
const presets = [
  { name: 'Push/Pull/Legs', days: [1, 2, 4, 5], description: 'Classic PPL 4-day split' },
  { name: 'Upper/Lower', days: [1, 2, 4, 5], description: '2 upper, 2 lower days' },
  { name: 'Full Body 3x', days: [1, 3, 5], description: 'M/W/F full body' },
  { name: 'Bro Split', days: [1, 2, 3, 4, 5], description: 'Chest/Back/Shoulders/Arms/Legs' },
];

export function WeeklyPlanner({ duration, onGenerate, generating }: WeeklyPlannerProps) {
  const { colors } = useTheme();
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Default M/W/F
  const [dayConfigs, setDayConfigs] = useState<Map<number, DayConfig>>(new Map());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [letAiBalance, setLetAiBalance] = useState(true);
  const [planName, setPlanName] = useState('');

  const toggleDay = useCallback((dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      }
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  }, []);

  const getDayConfig = useCallback((dayIndex: number): DayConfig => {
    return dayConfigs.get(dayIndex) || {
      day_of_week: dayIndex,
      muscle_focus: [],
      workout_style: 'auto',
    };
  }, [dayConfigs]);

  const updateDayConfig = useCallback((dayIndex: number, updates: Partial<DayConfig>) => {
    setDayConfigs(prev => {
      const newMap = new Map(prev);
      const current = getDayConfig(dayIndex);
      newMap.set(dayIndex, { ...current, ...updates });
      return newMap;
    });
  }, [getDayConfig]);

  const toggleMuscleForDay = useCallback((dayIndex: number, muscleId: string) => {
    const current = getDayConfig(dayIndex);
    const newMuscles = current.muscle_focus.includes(muscleId)
      ? current.muscle_focus.filter(m => m !== muscleId)
      : [...current.muscle_focus, muscleId];
    updateDayConfig(dayIndex, { muscle_focus: newMuscles });
  }, [getDayConfig, updateDayConfig]);

  const handleGenerate = useCallback(() => {
    const daysToGenerate = selectedDays.map(day => {
      if (letAiBalance) {
        return { day_of_week: day, muscle_focus: [], workout_style: 'auto' as const };
      }
      return getDayConfig(day);
    });

    const name = planName.trim() || `${selectedDays.length}-Day Plan`;
    onGenerate(daysToGenerate, name);
  }, [selectedDays, letAiBalance, getDayConfig, planName, onGenerate]);

  const applyPreset = useCallback((preset: typeof presets[0]) => {
    setSelectedDays(preset.days);
    setLetAiBalance(true);
    setPlanName(preset.name);
  }, []);

  const getSplitSuggestion = useCallback(() => {
    const count = selectedDays.length;
    if (count <= 2) return 'Full Body recommended';
    if (count === 3) return 'Full Body or Push/Pull/Legs';
    if (count === 4) return 'Upper/Lower split recommended';
    if (count === 5) return 'Push/Pull/Legs or Bro Split';
    return 'Advanced split - AI will optimize';
  }, [selectedDays.length]);

  return (
    <div className="space-y-4">
      {/* Plan Name */}
      <div className="card" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
        <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Plan Name
        </h2>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder={`${selectedDays.length}-Day Training Plan`}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            background: colors.inputBg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Day Selector */}
      <div className="card" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
        <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Training Days
        </h2>

        {/* Day Toggle Buttons */}
        <div className="flex gap-2 mb-3">
          {DAY_NAMES.map((name, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              style={{
                flex: 1,
                padding: '0.75rem 0.25rem',
                borderRadius: '0.75rem',
                background: selectedDays.includes(idx) ? colors.accentMuted : colors.inputBg,
                border: selectedDays.includes(idx) ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                color: selectedDays.includes(idx) ? colors.accent : colors.textMuted,
                fontSize: '0.75rem',
                fontWeight: selectedDays.includes(idx) ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Selected count + suggestion */}
        <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          {selectedDays.length} days selected - {getSplitSuggestion()}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.accent,
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* AI Balance Toggle */}
      <div className="card" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Let AI Balance
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '0.7rem', margin: 0, marginTop: '0.25rem' }}>
              AI will auto-assign muscle groups based on your day count
            </p>
          </div>
          <button
            onClick={() => setLetAiBalance(!letAiBalance)}
            style={{
              width: '48px',
              height: '28px',
              borderRadius: '14px',
              background: letAiBalance ? colors.accent : 'rgba(245, 241, 234, 0.2)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: letAiBalance ? '22px' : '2px',
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                background: colors.text,
                transition: 'left 0.2s ease',
              }}
            />
          </button>
        </div>
      </div>

      {/* Per-Day Configuration - Only when not AI balanced */}
      {!letAiBalance && selectedDays.length > 0 && (
        <div className="card" style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}>
          <h2 style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Day Configuration
          </h2>

          <div className="space-y-2">
            {selectedDays.map((dayIndex) => {
              const config = getDayConfig(dayIndex);
              const isExpanded = expandedDay === dayIndex;

              return (
                <div
                  key={dayIndex}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day Header */}
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: colors.text, fontWeight: 600, fontSize: '0.875rem' }}>
                        {DAY_NAMES_FULL[dayIndex]}
                      </span>
                      {config.muscle_focus.length > 0 && (
                        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                          ({config.muscle_focus.join(', ')})
                        </span>
                      )}
                    </div>
                    <span style={{ color: colors.textMuted, fontSize: '1rem' }}>
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>

                  {/* Expanded Config */}
                  {isExpanded && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      {/* Muscle Focus */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: colors.textMuted, fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          Target Muscles
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {muscleGroups.map((muscle) => (
                            <button
                              key={muscle.id}
                              onClick={() => toggleMuscleForDay(dayIndex, muscle.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '999px',
                                background: config.muscle_focus.includes(muscle.id) ? colors.accentMuted : colors.inputBg,
                                border: config.muscle_focus.includes(muscle.id) ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                                color: config.muscle_focus.includes(muscle.id) ? colors.accent : colors.text,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              {muscle.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Workout Style */}
                      <div>
                        <div style={{ color: colors.textMuted, fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          Workout Style
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {workoutStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => updateDayConfig(dayIndex, { workout_style: style.id })}
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.5rem',
                                background: config.workout_style === style.id ? colors.accentMuted : colors.inputBg,
                                border: config.workout_style === style.id ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                                color: config.workout_style === style.id ? colors.accent : colors.text,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedDays.length === 0 || generating}
        className="btn-primary w-full"
        style={{
          opacity: selectedDays.length === 0 ? 0.5 : 1,
          cursor: selectedDays.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {generating ? (
          <span className="animate-pulse">Generating {selectedDays.length}-day plan...</span>
        ) : (
          `Generate ${selectedDays.length}-Day Plan`
        )}
      </button>

      {/* Info */}
      <p style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'center' }}>
        Each workout will be ~{duration} minutes. AI will balance muscle groups across the week.
      </p>
    </div>
  );
}
