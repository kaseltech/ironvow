'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// IronVow brand colors
const BRAND = {
  navy: '#1F3A5A',
  navyDark: '#0F2233',
  cream: '#F5F1EA',
  gold: '#C9A75A',
  goldMuted: '#B8A070',
};

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'added' | 'improved' | 'fixed' | 'changed';
    description: string;
  }[];
}

// Changelog data - add new entries at the top
const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: 'January 8, 2026',
    title: 'Gym Profiles',
    changes: [
      { type: 'added', description: 'Named gym profiles - save multiple gyms with their equipment' },
      { type: 'added', description: 'Preset templates: CrossFit, Hyrox, Commercial, Powerlifting, Hotel, Olympic Lifting' },
      { type: 'added', description: 'Gym selector when choosing gym location' },
      { type: 'added', description: 'Set a default gym for quick workout generation' },
      { type: 'improved', description: 'AI now uses your specific gym\'s equipment for better workout suggestions' },
      { type: 'changed', description: 'Gym location now requires selecting a gym profile' },
    ],
  },
  {
    version: '1.1.0',
    date: 'January 8, 2026',
    title: 'AI & Equipment Update',
    changes: [
      { type: 'added', description: 'Claude AI integration for intelligent workout generation' },
      { type: 'added', description: '35+ new garage gym equipment options' },
      { type: 'added', description: 'Custom equipment input - add your own gear for AI to consider' },
      { type: 'added', description: 'Settings modal with equipment management' },
      { type: 'added', description: 'Debug mode to see AI request details (tap version 5x)' },
      { type: 'improved', description: 'AI now considers your injuries when generating workouts' },
      { type: 'improved', description: 'Better exercise filtering based on available equipment' },
    ],
  },
  {
    version: '1.0.0',
    date: 'January 8, 2026',
    title: 'Initial Release',
    changes: [
      { type: 'added', description: 'AI-powered workout generation based on your goals, equipment, and schedule' },
      { type: 'added', description: 'Personalized onboarding with experience level, body stats, and fitness goals' },
      { type: 'added', description: 'Equipment tracking for home and gym with custom equipment support' },
      { type: 'added', description: 'Interactive body map showing muscle strength and training history' },
      { type: 'added', description: 'Workout logging with set tracking and weight adjustments' },
      { type: 'added', description: 'Progress tracking with weight logs and goal visualization' },
      { type: 'added', description: 'Injury tracking to avoid problematic exercises' },
      { type: 'added', description: 'Exercise library with detailed instructions and muscle targeting' },
      { type: 'added', description: 'Dark theme with gold accents' },
      { type: 'added', description: 'Google authentication and email/password login' },
      { type: 'added', description: 'iOS native app with Capacitor' },
    ],
  },
];

const typeColors = {
  added: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'New' },
  improved: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Improved' },
  fixed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Fixed' },
  changed: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Changed' },
};

interface ChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Changelog({ isOpen, onClose }: ChangelogProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      <div
        style={{
          backgroundColor: BRAND.navy,
          borderRadius: '1.5rem',
          width: '100%',
          maxWidth: '36rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(201, 167, 90, 0.2)',
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDark} 100%)`,
          borderBottom: '1px solid rgba(201, 167, 90, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(201, 167, 90, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}>
              📋
            </div>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: BRAND.cream,
                margin: 0,
                fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
              }}>
                What's New
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: BRAND.goldMuted,
                margin: 0,
                marginTop: '0.125rem',
              }}>
                IronVow Changelog
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: BRAND.cream,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Changelog entries */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.75rem',
        }}>
          {CHANGELOG.map((entry, index) => (
            <div
              key={entry.version}
              style={{
                marginBottom: index < CHANGELOG.length - 1 ? '2rem' : 0,
                paddingBottom: index < CHANGELOG.length - 1 ? '2rem' : 0,
                borderBottom: index < CHANGELOG.length - 1
                  ? '1px solid rgba(201, 167, 90, 0.15)'
                  : 'none',
              }}
            >
              {/* Version header */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    backgroundColor: 'rgba(201, 167, 90, 0.2)',
                    color: BRAND.gold,
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}>
                    v{entry.version}
                  </span>
                  <span style={{
                    fontSize: '0.8125rem',
                    color: 'rgba(245, 241, 234, 0.5)',
                  }}>
                    {entry.date}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: BRAND.cream,
                  margin: 0,
                }}>
                  {entry.title}
                </h3>
              </div>

              {/* Changes list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {entry.changes.map((change, changeIndex) => {
                  const typeStyle = typeColors[change.type];
                  return (
                    <div
                      key={changeIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                      }}
                    >
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.text,
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        flexShrink: 0,
                        marginTop: '0.125rem',
                      }}>
                        {typeStyle.label}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'rgba(245, 241, 234, 0.85)',
                        lineHeight: 1.5,
                      }}>
                        {change.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(201, 167, 90, 0.15)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(245, 241, 234, 0.4)',
            margin: 0,
          }}>
            Built for your fitness journey
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
