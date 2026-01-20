'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MuscleIcon, LegIcon, BodyIcon, HeartPulseIcon, ChevronDownIcon, XIcon } from '@/components/Icons';
import type { WorkoutStyle } from '@/lib/generateWorkout';

interface MuscleSelectorProps {
  selectedMuscles: string[];
  setSelectedMuscles: (muscles: string[]) => void;
  selectedWorkoutStyle: WorkoutStyle;
  setSelectedWorkoutStyle: (style: WorkoutStyle) => void;
}

const muscleGroups = {
  upper: [
    { id: 'chest', name: 'Chest' },
    { id: 'back', name: 'Back' },
    { id: 'shoulders', name: 'Shoulders' },
    { id: 'biceps', name: 'Biceps' },
    { id: 'triceps', name: 'Triceps' },
    { id: 'forearms', name: 'Forearms' },
    { id: 'traps', name: 'Traps' },
  ],
  lower: [
    { id: 'quads', name: 'Quads' },
    { id: 'hamstrings', name: 'Hamstrings' },
    { id: 'glutes', name: 'Glutes' },
    { id: 'calves', name: 'Calves' },
  ],
  core: [
    { id: 'abs', name: 'Abs' },
    { id: 'obliques', name: 'Obliques' },
  ],
};

const allMuscleIds = [
  ...muscleGroups.upper.map(m => m.id),
  ...muscleGroups.lower.map(m => m.id),
  ...muscleGroups.core.map(m => m.id),
];

// Quick select presets
const quickSelects = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'traps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
};

type CategoryType = 'upper' | 'lower' | 'full' | 'cardio' | null;
type QuickSelectType = 'push' | 'pull' | 'legs' | null;

export function MuscleSelector({
  selectedMuscles,
  setSelectedMuscles,
  selectedWorkoutStyle,
  setSelectedWorkoutStyle,
}: MuscleSelectorProps) {
  const { colors } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<CategoryType>(null);

  const getActiveCategory = (): CategoryType => {
    if (selectedWorkoutStyle === 'cardio') return 'cardio';
    if (selectedMuscles.length === 0) return null;

    const upperIds = muscleGroups.upper.map(m => m.id);
    const lowerIds = muscleGroups.lower.map(m => m.id);

    const hasUpper = selectedMuscles.some(m => upperIds.includes(m));
    const hasLower = selectedMuscles.some(m => lowerIds.includes(m));

    if (hasUpper && hasLower) return 'full';
    if (hasUpper && !hasLower && selectedMuscles.every(m => upperIds.includes(m) || muscleGroups.core.map(c => c.id).includes(m))) {
      return 'upper';
    }
    if (hasLower && !hasUpper && selectedMuscles.every(m => lowerIds.includes(m) || muscleGroups.core.map(c => c.id).includes(m))) {
      return 'lower';
    }

    return null;
  };

  const activeCategory = getActiveCategory();

  const handleCategoryClick = (category: CategoryType) => {
    if (category === 'full') {
      setSelectedMuscles(allMuscleIds);
      setExpandedCategory(null);
      if (selectedWorkoutStyle === 'cardio') {
        setSelectedWorkoutStyle('traditional');
      }
    } else if (category === 'cardio') {
      setSelectedWorkoutStyle('cardio');
      setSelectedMuscles([]);
      setExpandedCategory(null);
    } else if (category === 'upper' || category === 'lower') {
      if (expandedCategory === category) {
        setExpandedCategory(null);
      } else {
        setExpandedCategory(category);
        if (selectedWorkoutStyle === 'cardio') {
          setSelectedWorkoutStyle('traditional');
        }
        const categoryMuscles = muscleGroups[category].map(m => m.id);
        const hasFromCategory = selectedMuscles.some(m => categoryMuscles.includes(m));
        if (!hasFromCategory) {
          const defaultMuscles = category === 'upper'
            ? ['chest', 'back', 'shoulders']
            : ['quads', 'hamstrings', 'glutes'];
          setSelectedMuscles([...selectedMuscles.filter(m => !categoryMuscles.includes(m)), ...defaultMuscles]);
        }
      }
    }
  };

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(
      selectedMuscles.includes(id)
        ? selectedMuscles.filter(m => m !== id)
        : [...selectedMuscles, id]
    );
  };

  const handleQuickSelect = (preset: QuickSelectType) => {
    if (!preset) return;
    const muscles = quickSelects[preset];
    setSelectedMuscles(muscles);
    setExpandedCategory(null);
    if (selectedWorkoutStyle === 'cardio') {
      setSelectedWorkoutStyle('traditional');
    }
  };

  const getActiveQuickSelect = (): QuickSelectType => {
    if (selectedMuscles.length === 0) return null;

    // Check if current selection matches a quick select exactly
    const sortedSelected = [...selectedMuscles].sort();

    for (const [key, muscles] of Object.entries(quickSelects)) {
      const sortedPreset = [...muscles].sort();
      if (sortedSelected.length === sortedPreset.length &&
          sortedSelected.every((m, i) => m === sortedPreset[i])) {
        return key as QuickSelectType;
      }
    }
    return null;
  };

  const activeQuickSelect = getActiveQuickSelect();

  const isCategoryActive = (category: CategoryType): boolean => {
    if (category === 'cardio') return selectedWorkoutStyle === 'cardio';
    if (category === 'full') return activeCategory === 'full';
    if (category === 'upper') {
      const upperIds = muscleGroups.upper.map(m => m.id);
      return selectedMuscles.some(m => upperIds.includes(m));
    }
    if (category === 'lower') {
      const lowerIds = muscleGroups.lower.map(m => m.id);
      return selectedMuscles.some(m => lowerIds.includes(m));
    }
    return false;
  };

  const categories: { id: CategoryType; label: string; Icon: typeof MuscleIcon }[] = [
    { id: 'upper', label: 'Upper Body', Icon: MuscleIcon },
    { id: 'lower', label: 'Lower Body', Icon: LegIcon },
    { id: 'full', label: 'Full Body', Icon: BodyIcon },
    { id: 'cardio', label: 'Cardio', Icon: HeartPulseIcon },
  ];

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
      <h2
        style={{
          color: colors.text,
          fontSize: '1.125rem',
          fontWeight: 700,
          marginBottom: '1rem',
          fontFamily: 'var(--font-libre-baskerville)',
        }}
      >
        What do you want to train?
      </h2>

      {/* Quick Select - Push/Pull/Legs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {(['push', 'pull', 'legs'] as const).map(preset => {
          const isActive = activeQuickSelect === preset;
          return (
            <button
              key={preset}
              onClick={() => handleQuickSelect(preset)}
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                borderRadius: '0.75rem',
                background: isActive
                  ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                  : 'transparent',
                border: isActive
                  ? 'none'
                  : `1.5px solid ${colors.border}`,
                color: isActive ? colors.bg : colors.text,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
                boxShadow: isActive ? '0 2px 8px rgba(201, 167, 90, 0.3)' : 'none',
              }}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Category Buttons - Responsive Grid */}
      <div className="muscle-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {categories.map(cat => {
          const isActive = isCategoryActive(cat.id);
          const isExpanded = expandedCategory === cat.id;
          const IconComponent = cat.Icon;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                padding: '1rem',
                borderRadius: '1rem',
                background: isActive
                  ? `linear-gradient(135deg, ${colors.accentMuted} 0%, rgba(201, 167, 90, 0.15) 100%)`
                  : colors.inputBg,
                border: isActive
                  ? `2px solid ${colors.accent}`
                  : `1.5px solid ${colors.borderSubtle}`,
                color: isActive ? colors.accent : colors.text,
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                position: 'relative',
              }}
            >
              <IconComponent size={22} color={isActive ? colors.accent : colors.textMuted} strokeWidth={2} />
              <span>{cat.label}</span>
              {(cat.id === 'upper' || cat.id === 'lower') && (
                <div
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <ChevronDownIcon size={16} color={isActive ? colors.accent : colors.textMuted} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Muscle Selection */}
      {expandedCategory && (expandedCategory === 'upper' || expandedCategory === 'lower') && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: `1px solid ${colors.borderSubtle}`,
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {muscleGroups[expandedCategory].map(muscle => {
              const isSelected = selectedMuscles.includes(muscle.id);
              return (
                <button
                  key={muscle.id}
                  onClick={() => toggleMuscle(muscle.id)}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: '2rem',
                    background: isSelected
                      ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                      : colors.inputBg,
                    border: isSelected
                      ? 'none'
                      : `1.5px solid ${colors.border}`,
                    color: isSelected ? colors.bg : colors.text,
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(201, 167, 90, 0.25)' : 'none',
                  }}
                >
                  {muscle.name}
                </button>
              );
            })}
          </div>

          {/* Core Options */}
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.875rem',
              borderTop: `1px dashed ${colors.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              Add Core
            </span>
            {muscleGroups.core.map(muscle => {
              const isSelected = selectedMuscles.includes(muscle.id);
              return (
                <button
                  key={muscle.id}
                  onClick={() => toggleMuscle(muscle.id)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '2rem',
                    background: isSelected ? colors.accentMuted : 'transparent',
                    border: `1.5px solid ${isSelected ? colors.accent : colors.border}`,
                    color: isSelected ? colors.accent : colors.textMuted,
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {muscle.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedMuscles.length > 0 && selectedWorkoutStyle !== 'cardio' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: colors.accentMuted,
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: colors.accent, fontWeight: 600 }}>
            Training:
          </span>
          {selectedMuscles.slice(0, 4).map(muscleId => {
            const muscle = [...muscleGroups.upper, ...muscleGroups.lower, ...muscleGroups.core].find(
              m => m.id === muscleId
            );
            return (
              <span
                key={muscleId}
                style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '1rem',
                  background: colors.accent,
                  color: colors.bg,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {muscle?.name || muscleId}
              </span>
            );
          })}
          {selectedMuscles.length > 4 && (
            <span style={{ fontSize: '0.75rem', color: colors.accent, fontWeight: 500 }}>
              +{selectedMuscles.length - 4} more
            </span>
          )}
          <button
            onClick={() => setSelectedMuscles([])}
            style={{
              marginLeft: 'auto',
              padding: '0.375rem',
              background: 'transparent',
              border: `1px solid ${colors.accent}`,
              borderRadius: '50%',
              color: colors.accent,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={14} color={colors.accent} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
