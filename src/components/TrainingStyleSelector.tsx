'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { WorkoutStyle } from '@/lib/generateWorkout';

interface TrainingStyleSelectorProps {
  selectedWorkoutStyle: WorkoutStyle;
  setSelectedWorkoutStyle: (style: WorkoutStyle) => void;
}

// Main styles shown by default (6 visible, moved Yoga/Mobility/Rehab to Advanced)
const mainStyles: { id: WorkoutStyle; name: string; description: string }[] = [
  { id: 'traditional', name: 'Traditional', description: '3-4 sets x 8-12 reps' },
  { id: 'strength', name: 'Strength', description: '5x5, heavy' },
  { id: 'hiit', name: 'HIIT', description: 'High intensity, short rest' },
  { id: 'circuit', name: 'Circuit', description: 'Back-to-back, minimal rest' },
  { id: 'wod', name: 'WOD', description: 'CrossFit-style AMRAP/EMOM' },
  { id: 'cardio', name: 'Cardio', description: 'Running & conditioning' },
];

export function TrainingStyleSelector({
  selectedWorkoutStyle,
  setSelectedWorkoutStyle,
}: TrainingStyleSelectorProps) {
  const { colors } = useTheme();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Check if a "more styles" option is selected
  const isMoreStyleSelected = ['yoga', 'mobility', 'rehab'].includes(selectedWorkoutStyle);

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <h2
          style={{
            color: colors.text,
            fontSize: '0.9375rem',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Training Style
        </h2>
        {isMoreStyleSelected && (
          <span
            style={{
              fontSize: '0.75rem',
              color: colors.accent,
              fontWeight: 500,
            }}
          >
            {selectedWorkoutStyle.charAt(0).toUpperCase() + selectedWorkoutStyle.slice(1)}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
        }}
      >
        {mainStyles.map(style => {
          const isSelected = selectedWorkoutStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => setSelectedWorkoutStyle(style.id)}
              onMouseEnter={() => setShowTooltip(style.id)}
              onMouseLeave={() => setShowTooltip(null)}
              style={{
                padding: '0.625rem 0.5rem',
                borderRadius: '0.625rem',
                background: isSelected ? colors.accentMuted : colors.inputBg,
                border: isSelected
                  ? `1.5px solid ${colors.accent}`
                  : `1px solid ${colors.borderSubtle}`,
                color: isSelected ? colors.accent : colors.text,
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                textAlign: 'center',
              }}
            >
              {style.name}

              {/* Tooltip on hover */}
              {showTooltip === style.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 0.5rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.375rem 0.625rem',
                    background: colors.bg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.375rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    fontSize: '0.6875rem',
                    color: colors.textMuted,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {style.description}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '8px',
                      height: '8px',
                      background: colors.bg,
                      borderRight: `1px solid ${colors.borderSubtle}`,
                      borderBottom: `1px solid ${colors.borderSubtle}`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
