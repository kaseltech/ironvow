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
  platform?: 'ios' | 'web' | 'all'; // Which platform this applies to
  changes: {
    type: 'added' | 'improved' | 'fixed' | 'changed';
    description: string;
  }[];
}

// Changelog data - add new entries at the top
const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.5.1',
    date: 'January 9, 2026',
    title: 'UI & Workout Fixes',
    platform: 'all',
    changes: [
      { type: 'improved', description: 'Duration selector now uses tappable buttons instead of slider - much easier to use on mobile' },
      { type: 'fixed', description: 'Rehab/Prehab workouts no longer include heavy compound lifts like Bench Press' },
      { type: 'fixed', description: 'Mobility workouts now properly suggest stretches, foam rolling, and yoga poses' },
      { type: 'improved', description: 'Better exercise suggestions for shoulder, hip, and back rehab' },
    ],
  },
  {
    version: '1.5.0',
    date: 'January 9, 2026',
    title: 'iOS App Launch',
    platform: 'ios',
    changes: [
      { type: 'added', description: 'Native iOS app available - install from Xcode or TestFlight' },
      { type: 'added', description: 'Native Google Sign-In - no more browser redirects on iOS' },
      { type: 'added', description: 'Native Apple Sign-In support' },
      { type: 'fixed', description: 'Session persistence - stay logged in between app launches' },
      { type: 'fixed', description: 'Safe area support - UI respects notch and home indicator' },
      { type: 'improved', description: 'Hybrid storage - sessions sync properly on native platforms' },
    ],
  },
  {
    version: '1.4.1',
    date: 'January 9, 2026',
    title: 'Smart Starting Weights',
    platform: 'all',
    changes: [
      { type: 'added', description: 'RX weight system - exercises now start with intelligent default weights' },
      { type: 'added', description: 'Weights based on your experience level, gender, and body weight' },
      { type: 'added', description: 'Compound lifts use body weight percentages (squats, deadlifts, bench)' },
      { type: 'improved', description: 'No more starting at 0 lbs - workouts have realistic starting weights' },
    ],
  },
  {
    version: '1.4.0',
    date: 'January 9, 2026',
    title: 'Themes & UI Refresh',
    platform: 'all',
    changes: [
      { type: 'added', description: '8 color themes - Navy, Charcoal, Midnight, Forest, Slate, Plum, Coffee, Ocean' },
      { type: 'added', description: 'Themes persist across sessions on both web and iOS' },
      { type: 'added', description: 'Logout button in header for quick sign out' },
      { type: 'changed', description: 'Settings icon now uses traditional gear design' },
      { type: 'changed', description: 'Reordered workout builder: Freeform toggle and Duration now appear before muscle selection' },
      { type: 'improved', description: 'UI now uses theme colors throughout the app' },
      { type: 'improved', description: 'Equipment editor is now a full-screen modal' },
      { type: 'improved', description: 'Gym profile selection bug fixes - profiles refresh properly' },
    ],
  },
  {
    version: '1.3.0',
    date: 'January 8, 2026',
    title: 'Regenerate & Swap',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Regenerate workout - get completely different exercises' },
      { type: 'added', description: 'Swap individual exercises - pick alternatives that hit the same muscles' },
      { type: 'improved', description: 'Regenerated workouts exclude your previous exercises' },
      { type: 'improved', description: 'Swap alternatives filtered by your location and equipment' },
    ],
  },
  {
    version: '1.2.1',
    date: 'January 8, 2026',
    title: 'AI Workout Fixes',
    platform: 'all',
    changes: [
      { type: 'fixed', description: 'Outdoor workouts now correctly use only bodyweight exercises' },
      { type: 'fixed', description: 'AI now properly focuses on selected muscle groups' },
      { type: 'improved', description: 'Much better AI prompts for workout generation' },
      { type: 'improved', description: 'Exercise filtering is now location-aware (outdoor vs gym vs home)' },
      { type: 'added', description: 'ESC key closes all modals' },
    ],
  },
  {
    version: '1.2.0',
    date: 'January 8, 2026',
    title: 'Gym Profiles',
    platform: 'all',
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
    platform: 'all',
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
    platform: 'all',
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
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'web'>('all');

  // Filter changelog entries based on selected platform
  const filteredChangelog = CHANGELOG.filter(entry => {
    if (platformFilter === 'all') return true;
    return entry.platform === 'all' || entry.platform === platformFilter;
  });

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

        {/* Platform Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.15)',
          background: BRAND.navyDark,
        }}>
          {(['all', 'ios', 'web'] as const).map(platform => (
            <button
              key={platform}
              onClick={() => setPlatformFilter(platform)}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: platformFilter === platform
                  ? 'rgba(201, 167, 90, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: platformFilter === platform ? BRAND.gold : 'rgba(245, 241, 234, 0.6)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {platform === 'all' ? 'All' : platform === 'ios' ? 'iOS' : 'Web'}
            </button>
          ))}
        </div>

        {/* Changelog entries */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.75rem',
        }}>
          {filteredChangelog.map((entry, index) => (
            <div
              key={entry.version}
              style={{
                marginBottom: index < filteredChangelog.length - 1 ? '2rem' : 0,
                paddingBottom: index < filteredChangelog.length - 1 ? '2rem' : 0,
                borderBottom: index < filteredChangelog.length - 1
                  ? '1px solid rgba(201, 167, 90, 0.15)'
                  : 'none',
              }}
            >
              {/* Version header */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
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
                  {entry.platform && entry.platform !== 'all' && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: entry.platform === 'ios' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: entry.platform === 'ios' ? '#3b82f6' : '#10b981',
                      borderRadius: '0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {entry.platform === 'ios' ? 'iOS' : 'Web'}
                    </span>
                  )}
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
