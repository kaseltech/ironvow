'use client';

import { useTheme } from '@/context/ThemeContext';
import type { ExerciseAlternative, EquipmentType } from '@/lib/generateWorkout';
import { XIcon } from '@/components/Icons';

interface ExerciseSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExerciseName: string;

  // Swap alternatives
  alternatives: ExerciseAlternative[];
  loadingAlternatives: boolean;
  loadingMore: boolean;

  // Equipment variants
  availableEquipment: Map<EquipmentType, string>;
  currentEquipment: EquipmentType | null;
  loadingEquipmentSwap: EquipmentType | null;

  // Callbacks
  onSwapExercise: (alternative: ExerciseAlternative) => void;
  onLoadMore: () => void;
  onEquipmentSwap: (equipment: EquipmentType) => void;
}

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  'smith machine': 'Smith',
  kettlebell: 'KB',
  bodyweight: 'BW',
  band: 'Band',
};

const EQUIPMENT_ORDER: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'smith machine',
  'kettlebell',
  'bodyweight',
  'band',
];

export function ExerciseSwapModal({
  isOpen,
  onClose,
  currentExerciseName,
  alternatives,
  loadingAlternatives,
  loadingMore,
  availableEquipment,
  currentEquipment,
  loadingEquipmentSwap,
  onSwapExercise,
  onLoadMore,
  onEquipmentSwap,
}: ExerciseSwapModalProps) {
  const { colors } = useTheme();

  if (!isOpen) return null;

  // Sort equipment options
  const sortedEquipment = EQUIPMENT_ORDER.filter((eq) => availableEquipment.has(eq) || eq === currentEquipment);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.cardBg,
          borderRadius: '1rem 1rem 0 0',
          width: '100%',
          maxWidth: 'min(500px, calc(100vw - 2rem))',
          maxHeight: '80vh',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: `1px solid ${colors.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: '1.125rem',
                color: colors.text,
                margin: 0,
              }}
            >
              Swap Exercise
            </h3>
            <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
              Replacing: {currentExerciseName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: colors.inputBg,
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <XIcon size={20} color={colors.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {/* Equipment Quick Toggle */}
          {sortedEquipment.length > 1 && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: colors.textMuted,
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                  }}
                >
                  Equipment Variant
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sortedEquipment.map((eq) => {
                    const isActive = eq === currentEquipment;
                    const isLoading = loadingEquipmentSwap === eq;
                    const isAvailable = availableEquipment.has(eq);

                    return (
                      <button
                        key={eq}
                        onClick={() => !isActive && isAvailable && onEquipmentSwap(eq)}
                        disabled={isActive || isLoading || !isAvailable}
                        style={{
                          padding: '0.625rem 1rem',
                          minHeight: '44px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          background: isActive
                            ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                            : colors.inputBg,
                          color: isActive ? '#fff' : isAvailable ? colors.text : colors.textMuted,
                          border: `1px solid ${isActive ? colors.accent : colors.borderSubtle}`,
                          borderRadius: '0.5rem',
                          cursor: isActive || !isAvailable ? 'default' : 'pointer',
                          opacity: isLoading ? 0.5 : isAvailable ? 1 : 0.4,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {isLoading ? '...' : EQUIPMENT_LABELS[eq]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: '1rem 0',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: colors.borderSubtle }} />
                <span style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 500 }}>
                  Other Exercises
                </span>
                <div style={{ flex: 1, height: '1px', background: colors.borderSubtle }} />
              </div>
            </>
          )}

          {/* Loading State */}
          {loadingAlternatives && (
            <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
              Loading alternatives...
            </div>
          )}

          {/* Empty State */}
          {!loadingAlternatives && alternatives.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
              No alternatives found. Try AI suggestions below.
            </div>
          )}

          {/* Alternatives List */}
          {!loadingAlternatives && alternatives.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => onSwapExercise(alt)}
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    minHeight: '60px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: colors.text, fontWeight: 500, fontSize: '0.875rem' }}>{alt.name}</span>
                    {alt.source === 'ai_pending' && (
                      <span
                        style={{
                          background: 'rgba(147, 51, 234, 0.15)',
                          color: 'rgb(147, 51, 234)',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: 600,
                        }}
                      >
                        AI
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {alt.primaryMuscles.slice(0, 3).map((muscle) => (
                      <span
                        key={muscle}
                        style={{
                          background: colors.accentMuted,
                          color: colors.accent,
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '999px',
                        }}
                      >
                        {muscle}
                      </span>
                    ))}
                    {alt.isCompound && (
                      <span
                        style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: 'rgb(34, 197, 94)',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '999px',
                        }}
                      >
                        Compound
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Load More Button */}
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '1rem',
              minHeight: '48px',
              background: 'transparent',
              border: `1px dashed ${colors.borderSubtle}`,
              borderRadius: '0.75rem',
              color: colors.accent,
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              opacity: loadingMore ? 0.6 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {loadingMore ? 'Loading...' : 'Load More (AI)'}
          </button>
        </div>
      </div>
    </div>
  );
}
