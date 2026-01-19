'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useExerciseDetail, type ExerciseDetail } from '@/hooks/useExerciseDetail';

interface ExerciseDetailModalProps {
  exerciseName: string;
  onClose: () => void;
}

export function ExerciseDetailModal({ exerciseName, onClose }: ExerciseDetailModalProps) {
  const { colors } = useTheme();
  const { exercise, loading, fetchExercise } = useExerciseDetail();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchExercise(exerciseName);
  }, [exerciseName, fetchExercise]);

  // Get YouTube search URL for fallback
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to ${exerciseName} exercise`)}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          maxWidth: '500px',
          margin: '0 auto',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            {exerciseName}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: colors.textMuted,
              fontSize: '1.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        )}

        {!loading && exercise && (
          <>
            {/* Images */}
            {exercise.image_urls && exercise.image_urls.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    background: colors.cardBg,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img
                    src={exercise.image_urls[currentImageIndex]}
                    alt={`${exerciseName} - step ${currentImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                  {exercise.image_urls.length > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                      }}
                    >
                      {exercise.image_urls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: idx === currentImageIndex ? colors.accent : 'rgba(255,255,255,0.5)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {exercise.image_urls.length > 1 && (
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : exercise.image_urls!.length - 1))}
                      style={{
                        color: colors.accent,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {currentImageIndex + 1} / {exercise.image_urls.length}
                    </span>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i < exercise.image_urls!.length - 1 ? i + 1 : 0))}
                      style={{
                        color: colors.accent,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Info */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
              }}
            >
              {exercise.difficulty && (
                <span
                  style={{
                    background: 'rgba(201, 167, 90, 0.2)',
                    color: colors.accent,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {exercise.difficulty}
                </span>
              )}
              {exercise.category && (
                <span
                  style={{
                    background: 'rgba(201, 167, 90, 0.2)',
                    color: colors.accent,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {exercise.category}
                </span>
              )}
              {exercise.is_compound && (
                <span
                  style={{
                    background: 'rgba(201, 167, 90, 0.2)',
                    color: colors.accent,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                  }}
                >
                  Compound
                </span>
              )}
            </div>

            {/* Muscles */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Primary Muscles
              </div>
              <div style={{ color: colors.text, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                {exercise.primary_muscles.join(', ')}
              </div>
              {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                <>
                  <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    Secondary Muscles
                  </div>
                  <div style={{ color: colors.text, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {exercise.secondary_muscles.join(', ')}
                  </div>
                </>
              )}
            </div>

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Instructions
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', color: colors.text }}>
                  {exercise.instructions.map((instruction, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {/* Not found / YouTube fallback */}
        {!loading && !exercise && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>
              No instructions found in database for "{exerciseName}"
            </p>
          </div>
        )}

        {/* YouTube Button - always show */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            width: '100%',
            padding: '1rem',
            background: '#FF0000',
            color: '#fff',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textAlign: 'center',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          Watch on YouTube
        </a>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '1rem',
            background: colors.cardBg,
            color: colors.text,
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: `1px solid ${colors.borderSubtle}`,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
