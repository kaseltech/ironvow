'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { DumbbellIcon, WeightIcon, ZapIcon, RepeatIcon, TargetIcon, HeartPulseIcon } from '@/components/Icons';
import type { WorkoutStyle } from '@/lib/generateWorkout';

interface TrainingStyleSelectorProps {
  selectedWorkoutStyle: WorkoutStyle;
  setSelectedWorkoutStyle: (style: WorkoutStyle) => void;
}

const mainStyles: { id: WorkoutStyle; name: string; description: string; Icon: typeof DumbbellIcon }[] = [
  { id: 'traditional', name: 'Traditional', description: '3-4 sets × 8-12 reps', Icon: DumbbellIcon },
  { id: 'strength', name: 'Strength', description: '5×5, heavy loads', Icon: WeightIcon },
  { id: 'hiit', name: 'HIIT', description: 'High intensity intervals', Icon: ZapIcon },
  { id: 'circuit', name: 'Circuit', description: 'Minimal rest, rotate', Icon: RepeatIcon },
  { id: 'wod', name: 'WOD', description: 'AMRAP / EMOM style', Icon: TargetIcon },
  { id: 'cardio', name: 'Cardio', description: 'Running & conditioning', Icon: HeartPulseIcon },
];

export function TrainingStyleSelector({
  selectedWorkoutStyle,
  setSelectedWorkoutStyle,
}: TrainingStyleSelectorProps) {
  const { colors } = useTheme();
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  const isMoreStyleSelected = ['yoga', 'mobility', 'rehab'].includes(selectedWorkoutStyle);

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1.5px solid ${colors.borderSubtle}`,
        borderRadius: '1.25rem',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            color: colors.text,
            fontSize: '1.125rem',
            fontWeight: 700,
            margin: 0,
            fontFamily: 'var(--font-libre-baskerville)',
          }}
        >
          Training Style
        </h2>
        {isMoreStyleSelected && (
          <span
            style={{
              fontSize: '0.8125rem',
              color: colors.accent,
              fontWeight: 600,
              padding: '0.25rem 0.625rem',
              background: colors.accentMuted,
              borderRadius: '0.5rem',
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
          gap: '0.625rem',
        }}
      >
        {mainStyles.map(style => {
          const isSelected = selectedWorkoutStyle === style.id;
          const isHovered = hoveredStyle === style.id;
          const IconComponent = style.Icon;

          return (
            <button
              key={style.id}
              onClick={() => setSelectedWorkoutStyle(style.id)}
              onMouseEnter={() => setHoveredStyle(style.id)}
              onMouseLeave={() => setHoveredStyle(null)}
              style={{
                padding: '0.875rem 0.625rem',
                borderRadius: '0.875rem',
                background: isSelected
                  ? `linear-gradient(135deg, ${colors.accentMuted} 0%, rgba(201, 167, 90, 0.15) 100%)`
                  : colors.inputBg,
                border: isSelected
                  ? `2px solid ${colors.accent}`
                  : `1.5px solid ${colors.borderSubtle}`,
                color: isSelected ? colors.accent : colors.text,
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <IconComponent
                size={20}
                color={isSelected ? colors.accent : colors.textMuted}
                strokeWidth={isSelected ? 2.5 : 2}
              />
              <span>{style.name}</span>

              {/* Tooltip on hover */}
              {isHovered && !isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 0.625rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.5rem 0.75rem',
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                    color: colors.text,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {style.description}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '10px',
                      height: '10px',
                      background: colors.bg,
                      borderRight: `1.5px solid ${colors.border}`,
                      borderBottom: `1.5px solid ${colors.border}`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected style description */}
      {selectedWorkoutStyle && !isMoreStyleSelected && (
        <div
          style={{
            marginTop: '0.875rem',
            padding: '0.625rem 0.875rem',
            background: colors.accentMuted,
            borderRadius: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {(() => {
            const style = mainStyles.find(s => s.id === selectedWorkoutStyle);
            const IconComponent = style?.Icon || DumbbellIcon;
            return (
              <>
                <IconComponent size={16} color={colors.accent} strokeWidth={2} />
                <span style={{ fontSize: '0.8125rem', color: colors.accent, fontWeight: 500 }}>
                  {style?.description}
                </span>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
