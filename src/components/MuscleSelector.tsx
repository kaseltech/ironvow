'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
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

type CategoryType = 'upper' | 'lower' | 'full' | 'cardio' | null;

export function MuscleSelector({
  selectedMuscles,
  setSelectedMuscles,
  selectedWorkoutStyle,
  setSelectedWorkoutStyle,
}: MuscleSelectorProps) {
  const { colors } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<CategoryType>(null);

  // Determine which category is active based on selected muscles
  const getActiveCategory = (): CategoryType => {
    if (selectedWorkoutStyle === 'cardio') return 'cardio';
    if (selectedMuscles.length === 0) return null;

    const upperIds = muscleGroups.upper.map(m => m.id);
    const lowerIds = muscleGroups.lower.map(m => m.id);
    const allIds = allMuscleIds;

    const hasUpper = selectedMuscles.some(m => upperIds.includes(m));
    const hasLower = selectedMuscles.some(m => lowerIds.includes(m));

    // If has both upper and lower, it's full body
    if (hasUpper && hasLower) return 'full';
    // If all muscles are from upper
    if (hasUpper && !hasLower && selectedMuscles.every(m => upperIds.includes(m) || muscleGroups.core.map(c => c.id).includes(m))) {
      return 'upper';
    }
    // If all muscles are from lower
    if (hasLower && !hasUpper && selectedMuscles.every(m => lowerIds.includes(m) || muscleGroups.core.map(c => c.id).includes(m))) {
      return 'lower';
    }

    return null;
  };

  const activeCategory = getActiveCategory();

  const handleCategoryClick = (category: CategoryType) => {
    if (category === 'full') {
      // Full body - select all muscles, collapse
      setSelectedMuscles(allMuscleIds);
      setExpandedCategory(null);
      if (selectedWorkoutStyle === 'cardio') {
        setSelectedWorkoutStyle('traditional');
      }
    } else if (category === 'cardio') {
      // Cardio - set style and clear muscles
      setSelectedWorkoutStyle('cardio');
      setSelectedMuscles([]);
      setExpandedCategory(null);
    } else if (category === 'upper' || category === 'lower') {
      // Toggle expansion for upper/lower
      if (expandedCategory === category) {
        // Clicking again collapses
        setExpandedCategory(null);
      } else {
        // Expand and select default muscles for this category
        setExpandedCategory(category);
        if (selectedWorkoutStyle === 'cardio') {
          setSelectedWorkoutStyle('traditional');
        }
        // Auto-select main muscles for the category if nothing from that category selected
        const categoryMuscles = muscleGroups[category].map(m => m.id);
        const hasFromCategory = selectedMuscles.some(m => categoryMuscles.includes(m));
        if (!hasFromCategory) {
          // Select first 3-4 muscles from category
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

  const categories: { id: CategoryType; label: string; icon: string }[] = [
    { id: 'upper', label: 'Upper Body', icon: '💪' },
    { id: 'lower', label: 'Lower Body', icon: '🦵' },
    { id: 'full', label: 'Full Body', icon: '🏋️' },
    { id: 'cardio', label: 'Cardio', icon: '🏃' },
  ];

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
      <h2
        style={{
          color: colors.text,
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.875rem',
        }}
      >
        What do you want to train?
      </h2>

      {/* Category Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const isActive = isCategoryActive(cat.id);
          const isExpanded = expandedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                flex: '1 1 calc(50% - 0.25rem)',
                minWidth: '120px',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive ? colors.accentMuted : colors.inputBg,
                border: isActive
                  ? `2px solid ${colors.accent}`
                  : `1px solid ${colors.borderSubtle}`,
                color: isActive ? colors.accent : colors.text,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.125rem' }}>{cat.icon}</span>
              <span>{cat.label}</span>
              {(cat.id === 'upper' || cat.id === 'lower') && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    color: colors.textMuted,
                    marginLeft: '0.25rem',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Muscle Selection */}
      {expandedCategory && (expandedCategory === 'upper' || expandedCategory === 'lower') && (
        <div
          style={{
            marginTop: '0.875rem',
            paddingTop: '0.875rem',
            borderTop: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {muscleGroups[expandedCategory].map(muscle => {
              const isSelected = selectedMuscles.includes(muscle.id);
              return (
                <button
                  key={muscle.id}
                  onClick={() => toggleMuscle(muscle.id)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '999px',
                    background: isSelected ? colors.accentMuted : colors.inputBg,
                    border: isSelected
                      ? `1px solid ${colors.accent}`
                      : `1px solid ${colors.border}`,
                    color: isSelected ? colors.accent : colors.text,
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {muscle.name}
                </button>
              );
            })}

            {/* Add core options when in upper or lower */}
            <div
              style={{
                width: '100%',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: `1px dashed ${colors.borderSubtle}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: colors.textMuted,
                  marginRight: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Add Core:
              </span>
              {muscleGroups.core.map(muscle => {
                const isSelected = selectedMuscles.includes(muscle.id);
                return (
                  <button
                    key={muscle.id}
                    onClick={() => toggleMuscle(muscle.id)}
                    style={{
                      padding: '0.375rem 0.625rem',
                      borderRadius: '999px',
                      background: isSelected ? colors.accentMuted : 'transparent',
                      border: isSelected
                        ? `1px solid ${colors.accent}`
                        : `1px solid ${colors.border}`,
                      color: isSelected ? colors.accent : colors.textMuted,
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      marginRight: '0.375rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {muscle.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedMuscles.length > 0 && selectedWorkoutStyle !== 'cardio' && (
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
            Selected:
          </span>
          {selectedMuscles.slice(0, 5).map(muscleId => {
            const muscle = [...muscleGroups.upper, ...muscleGroups.lower, ...muscleGroups.core].find(
              m => m.id === muscleId
            );
            return (
              <span
                key={muscleId}
                style={{
                  padding: '0.1875rem 0.5rem',
                  borderRadius: '999px',
                  background: colors.accentMuted,
                  color: colors.accent,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                }}
              >
                {muscle?.name || muscleId}
              </span>
            );
          })}
          {selectedMuscles.length > 5 && (
            <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>
              +{selectedMuscles.length - 5} more
            </span>
          )}
          <button
            onClick={() => setSelectedMuscles([])}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '0.375rem',
              color: colors.textMuted,
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
