'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDownIcon, SparklesIcon, StretchIcon } from '@/components/Icons';
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
  { id: 'rehab', name: 'Rehab', description: 'Injury prevention' },
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
  const [isExpanded, setIsExpanded] = useState(freeformMode);

  const hasActiveAdvancedOptions =
    freeformMode ||
    moreStyles.some(s => s.id === selectedWorkoutStyle) ||
    selectedMuscles.some(m => goalModalities.map(g => g.id).includes(m));

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1.5px solid ${colors.borderSubtle}`,
        borderRadius: '1.25rem',
        marginBottom: '1.25rem',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1rem', color: colors.text, fontWeight: 600 }}>
            Advanced Options
          </span>
          {hasActiveAdvancedOptions && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                boxShadow: `0 0 8px ${colors.accent}`,
              }}
            />
          )}
        </div>
        <div
          style={{
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDownIcon size={20} color={colors.textMuted} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          {/* Freeform Mode */}
          <div
            style={{
              background: freeformMode
                ? `linear-gradient(135deg, ${colors.accentMuted} 0%, rgba(201, 167, 90, 0.1) 100%)`
                : colors.inputBg,
              borderRadius: '1rem',
              padding: '1rem',
              marginBottom: '1.25rem',
              border: freeformMode ? `2px solid ${colors.accent}` : `1.5px solid ${colors.borderSubtle}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: freeformMode ? '1rem' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.75rem',
                    background: freeformMode ? colors.accent : colors.accentMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SparklesIcon size={20} color={freeformMode ? colors.bg : colors.accent} />
                </div>
                <div>
                  <div style={{ color: colors.text, fontSize: '0.9375rem', fontWeight: 600 }}>
                    AI Freeform Mode
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.125rem' }}>
                    Describe your ideal workout
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFreeformMode(!freeformMode);
                }}
                style={{
                  width: '52px',
                  height: '30px',
                  borderRadius: '15px',
                  background: freeformMode
                    ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                    : 'rgba(245, 241, 234, 0.15)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: freeformMode ? '0 2px 8px rgba(201, 167, 90, 0.3)' : 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: freeformMode ? '25px' : '3px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    background: colors.text,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>

            {freeformMode && (
              <div>
                <textarea
                  value={freeformPrompt}
                  onChange={(e) => setFreeformPrompt(e.target.value)}
                  placeholder='e.g. "Heavy push day focusing on chest with short rest periods"'
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    color: colors.text,
                    fontSize: '0.9375rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
                <div
                  style={{
                    marginTop: '0.625rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ color: colors.warning, fontSize: '0.875rem' }}>⚡</span>
                  <span style={{ color: colors.warning, fontSize: '0.75rem', fontWeight: 500 }}>
                    This overrides muscle and style selections
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* More Workout Styles */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <StretchIcon size={14} color={colors.textMuted} />
              More Styles
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {moreStyles.map(style => {
                const isSelected = selectedWorkoutStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedWorkoutStyle(style.id)}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '0.75rem',
                      background: isSelected
                        ? `linear-gradient(135deg, ${colors.accentMuted} 0%, rgba(201, 167, 90, 0.15) 100%)`
                        : colors.inputBg,
                      border: isSelected
                        ? `2px solid ${colors.accent}`
                        : `1.5px solid ${colors.borderSubtle}`,
                      color: isSelected ? colors.accent : colors.text,
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 500,
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
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              Add Focus
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {goalModalities.map(goal => {
                const isSelected = selectedMuscles.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleMuscle(goal.id)}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '0.75rem',
                      background: isSelected
                        ? `linear-gradient(135deg, ${colors.accentMuted} 0%, rgba(201, 167, 90, 0.15) 100%)`
                        : colors.inputBg,
                      border: isSelected
                        ? `2px solid ${colors.accent}`
                        : `1.5px solid ${colors.borderSubtle}`,
                      color: isSelected ? colors.accent : colors.text,
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 500,
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
