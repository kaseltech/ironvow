'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { WorkoutStyle } from '@/lib/generateWorkout';

interface AdvancedOptionsProps {
  freeformMode: boolean;
  setFreeformMode: (mode: boolean) => void;
  freeformPrompt: string;
  setFreeformPrompt: (prompt: string) => void;
  selectedWorkoutStyle: WorkoutStyle;
  setSelectedWorkoutStyle: (style: WorkoutStyle) => void;
  selectedMuscles: string[];
  toggleMuscle: (id: string) => void;
}

const moreStyles: { id: WorkoutStyle; name: string; description: string }[] = [
  { id: 'yoga', name: 'Yoga', description: 'Poses, flows & breathwork' },
  { id: 'mobility', name: 'Mobility', description: 'Stretching & recovery' },
  { id: 'rehab', name: 'Rehab/Prehab', description: 'Injury prevention & recovery' },
];

const goalModalities = [
  { id: 'flexibility', name: 'Flexibility' },
  { id: 'endurance', name: 'Endurance' },
  { id: 'balance', name: 'Balance' },
];

export function AdvancedOptions({
  freeformMode,
  setFreeformMode,
  freeformPrompt,
  setFreeformPrompt,
  selectedWorkoutStyle,
  setSelectedWorkoutStyle,
  selectedMuscles,
  toggleMuscle,
}: AdvancedOptionsProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(freeformMode); // Auto-expand if freeform is on

  // Check if any advanced options are active
  const hasActiveAdvancedOptions =
    freeformMode ||
    moreStyles.some(s => s.id === selectedWorkoutStyle) ||
    selectedMuscles.some(m => goalModalities.map(g => g.id).includes(m));

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '1rem',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>
            Advanced Options
          </span>
          {hasActiveAdvancedOptions && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: colors.accent,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            color: colors.textMuted,
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '0 1rem 1rem' }}>
          {/* Freeform Mode */}
          <div
            style={{
              background: colors.inputBg,
              borderRadius: '0.75rem',
              padding: '0.875rem',
              marginBottom: '1rem',
              border: freeformMode ? `1px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: freeformMode ? '0.75rem' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>✨</span>
                <div>
                  <div style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 600 }}>
                    Freeform Mode
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
                    Describe your ideal workout in plain text
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFreeformMode(!freeformMode);
                }}
                style={{
                  width: '44px',
                  height: '26px',
                  borderRadius: '13px',
                  background: freeformMode ? colors.accent : 'rgba(245, 241, 234, 0.2)',
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
                    left: freeformMode ? '20px' : '2px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '11px',
                    background: colors.text,
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {freeformMode && (
              <div>
                <textarea
                  value={freeformPrompt}
                  onChange={(e) => setFreeformPrompt(e.target.value)}
                  placeholder='e.g. "Heavy push day with short rest"'
                  style={{
                    width: '100%',
                    minHeight: '70px',
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <p
                  style={{
                    color: colors.textMuted,
                    fontSize: '0.6875rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <span style={{ color: '#F59E0B' }}>!</span>
                  Overrides muscle and style selections
                </p>
              </div>
            )}
          </div>

          {/* More Workout Styles */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              More Styles
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {moreStyles.map(style => {
                const isSelected = selectedWorkoutStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedWorkoutStyle(style.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: isSelected ? colors.accentMuted : colors.inputBg,
                      border: isSelected
                        ? `1px solid ${colors.accent}`
                        : `1px solid ${colors.borderSubtle}`,
                      color: isSelected ? colors.accent : colors.text,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={style.description}
                  >
                    {style.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Modalities */}
          <div>
            <div
              style={{
                color: colors.textMuted,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Add Focus
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {goalModalities.map(goal => {
                const isSelected = selectedMuscles.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleMuscle(goal.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: isSelected ? colors.accentMuted : colors.inputBg,
                      border: isSelected
                        ? `1px solid ${colors.accent}`
                        : `1px solid ${colors.borderSubtle}`,
                      color: isSelected ? colors.accent : colors.text,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {goal.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
