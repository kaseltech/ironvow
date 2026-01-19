'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';

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
    version: '2.3.0',
    date: 'January 19, 2026',
    title: 'Bookmarks & Stability',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Unsave workouts - click saved button to remove from bookmarks' },
      { type: 'added', description: 'Bookmarked workouts management in Profile > Saved tab' },
      { type: 'added', description: 'Weekly plan progress bar showing completion percentage' },
      { type: 'added', description: 'Swap button in workout header now opens swap modal' },
      { type: 'added', description: 'Success/error toasts for profile saves (injuries, goals)' },
      { type: 'fixed', description: 'Race condition when switching exercises in swap modal' },
      { type: 'fixed', description: 'Double-tap on Generate button could fire twice' },
      { type: 'improved', description: 'Modal accessibility with proper ARIA labels' },
      { type: 'improved', description: 'Performance with memoized exercise lists' },
      { type: 'improved', description: 'Code quality - extracted duplicate muscle validation logic' },
    ],
  },
  {
    version: '2.2.0',
    date: 'January 18, 2026',
    title: 'UX Polish & Accessibility',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Undo button appears for 4 seconds after logging a set' },
      { type: 'added', description: 'Rest complete notification when returning from background' },
      { type: 'added', description: 'Generate confirmation shows workout summary before creating' },
      { type: 'added', description: 'Freeform AI mode indicator badge when using custom prompts' },
      { type: 'added', description: 'End workout confirmation with save or discard options' },
      { type: 'added', description: 'Expandable equipment lists - tap to see all items' },
      { type: 'added', description: 'Keyboard focus rings for accessibility' },
      { type: 'improved', description: 'Tab buttons now 48px height for easier tapping' },
      { type: 'improved', description: 'Error messages include one-click retry button' },
      { type: 'improved', description: '"Tap to edit" badge on completed sets is more visible' },
      { type: 'improved', description: 'Chart labels are larger and easier to read' },
      { type: 'improved', description: 'Muscle selector adapts to small phone screens' },
      { type: 'improved', description: 'Loading indicator is now a subtle toast, not full-screen' },
      { type: 'improved', description: 'Weekly mode has a visual dot indicator for discoverability' },
    ],
  },
  {
    version: '2.1.0',
    date: 'January 18, 2026',
    title: 'Smart Progress & Persistence',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Session persistence - workouts recover automatically on app refresh or crash' },
      { type: 'added', description: 'Progress-aware AI - your PRs inform personalized weight suggestions' },
      { type: 'added', description: 'Deload intelligence - automatic detection when weekly volume exceeds 100k lbs' },
      { type: 'added', description: 'Workout bookmarking - save button now stores workouts to database' },
      { type: 'added', description: 'Weekly plan adherence tracking - see completion percentage for your plans' },
      { type: 'added', description: 'Context tags showing PRs, injuries, and experience level during generation' },
      { type: 'added', description: 'Smart suggestions - "Due for Training" cards for muscles not hit in 4+ days' },
      { type: 'added', description: '"Last Workout" card with "Do Again" button to repeat recent sessions' },
      { type: 'added', description: 'PR celebration on workout completion with trophy badges' },
      { type: 'added', description: '5-star workout rating after completion' },
      { type: 'improved', description: 'Unified swap modal - consistent experience across single and weekly workouts' },
      { type: 'improved', description: 'Mobile optimization - 44-48px touch targets throughout the app' },
      { type: 'improved', description: 'Safe area insets for iPhone notch and home indicator' },
    ],
  },
  {
    version: '2.0.0',
    date: 'January 17, 2026',
    title: 'Workout Session Overhaul',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Warm-up phase at workout start - checklist of stretches with skip option' },
      { type: 'added', description: 'Screen wake lock - phone stays on during workouts (iOS)' },
      { type: 'added', description: 'Audio countdown beeps at 3, 2, 1 seconds during rest timer' },
      { type: 'added', description: '"Up Next" preview during rest showing next exercise details' },
      { type: 'added', description: 'Rest timer adjustment buttons (+30s, +15s, -15s, -30s)' },
      { type: 'added', description: 'Swap exercises mid-workout if equipment is taken' },
      { type: 'added', description: 'Weight goal editor in Profile settings - change goal type and targets anytime' },
      { type: 'added', description: 'Workout completion screen with stats - duration, sets, exercises, total volume' },
      { type: 'improved', description: 'Rest timer now survives app backgrounding (timestamp-based)' },
      { type: 'improved', description: 'Larger touch targets (48px+) for weight/rep adjustment buttons' },
      { type: 'improved', description: 'Better set progress visibility with visual progress bar' },
      { type: 'improved', description: 'Cancel button added to weight adjustment flow' },
      { type: 'improved', description: 'Profile page now mobile responsive (single column on small screens)' },
      { type: 'improved', description: 'Consistent SVG icons in bottom navigation across all pages' },
      { type: 'fixed', description: 'Equipment variant lookup now works for incline/decline exercises' },
      { type: 'fixed', description: 'Added RX weights for incline and seated exercise variants' },
    ],
  },
  {
    version: '1.9.0',
    date: 'January 17, 2026',
    title: 'Warm-up Stretches',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Optional warm-up stretches before workouts - 4-6 stretches targeting your workout muscles' },
      { type: 'added', description: 'Warm-up toggle (on by default) in workout generation' },
      { type: 'added', description: 'Collapsible warm-up section shows stretches with duration and instructions' },
      { type: 'added', description: 'Warm-ups work for both single workouts and weekly plans' },
      { type: 'improved', description: 'Each weekly plan day gets stretches tailored to that day\'s muscle focus' },
    ],
  },
  {
    version: '1.8.0',
    date: 'January 17, 2026',
    title: 'Smart Exercise Swaps',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Equipment toggle in swap modal - quickly switch between barbell, dumbbell, cable, machine variants' },
      { type: 'added', description: 'AI-enhanced swaps - when database lacks alternatives, AI generates more suggestions' },
      { type: 'added', description: 'Load More (AI) button for on-demand alternative exercises' },
      { type: 'added', description: 'Purple "AI" badge on AI-generated alternatives' },
      { type: 'added', description: 'New exercises staging table for human review before adding to main database' },
      { type: 'fixed', description: 'AI no longer suggests exercises from wrong muscle groups' },
    ],
  },
  {
    version: '1.7.0',
    date: 'January 11, 2026',
    title: 'Weekly Workout Plans',
    platform: 'all',
    changes: [
      { type: 'added', description: 'Weekly mode toggle - plan multiple days at once' },
      { type: 'added', description: 'Smart muscle splits - AI auto-balances based on training frequency' },
      { type: 'added', description: 'Per-day customization with preset splits (Push/Pull/Legs, Upper/Lower, Full Body)' },
      { type: 'added', description: 'Today\'s Workout card when you have an active plan' },
      { type: 'added', description: 'Regenerate individual days without regenerating entire plan' },
      { type: 'added', description: 'Swap exercises within weekly plan before saving' },
      { type: 'added', description: 'Exercise info buttons with images, instructions, and YouTube links' },
      { type: 'improved', description: 'SVG icons throughout app (replaced emojis)' },
      { type: 'improved', description: 'Cleaner UI with progressive disclosure design' },
    ],
  },
  {
    version: '1.6.0',
    date: 'January 10, 2026',
    title: 'Flex Timer',
    platform: 'all',
    changes: [
      { type: 'added', description: 'FlexTimer - GymNext-inspired interval timer with 5 modes: Stopwatch, Countdown, Tabata, EMOM, and Interval' },
      { type: 'added', description: 'Tabata mode - classic 20s work / 10s rest intervals (fully configurable)' },
      { type: 'added', description: 'EMOM mode - Every Minute On the Minute with customizable rounds' },
      { type: 'added', description: 'Interval mode - custom work/rest durations with multiple sets' },
      { type: 'added', description: 'Stopwatch with lap tracking' },
      { type: 'added', description: 'Audio beeps for phase transitions using Web Audio API' },
      { type: 'added', description: 'Haptic feedback on iOS for timer events' },
      { type: 'added', description: '3-2-1 prelude countdown before timer starts' },
      { type: 'added', description: 'Timer presets can be saved to cloud (coming soon)' },
      { type: 'improved', description: 'Timer icon in header for quick access from any screen' },
    ],
  },
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
  const { colors } = useTheme();
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
          backgroundColor: colors.cardBg,
          borderRadius: '1.5rem',
          width: '100%',
          maxWidth: '36rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${colors.border}`,
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.bg} 100%)`,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              backgroundColor: colors.accentMuted,
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
                color: colors.text,
                margin: 0,
                fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
              }}>
                What's New
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: colors.textMuted,
                margin: 0,
                marginTop: '0.125rem',
              }}>
                IronVow Changelog
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close changelog"
            style={{
              padding: '0.5rem',
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
              minHeight: '44px',
              minWidth: '44px',
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
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: colors.bg,
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
                  ? colors.accentMuted
                  : colors.inputBg,
                color: platformFilter === platform ? colors.accent : colors.textMuted,
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '44px',
              }}
            >
              {platform === 'all' ? 'All' : platform === 'ios' ? 'iOS' : 'Web'}
            </button>
          ))}
        </div>

        {/* Changelog entries */}
        <div
          className="changelog-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1.75rem',
          }}
        >
          {filteredChangelog.map((entry, index) => (
            <div
              key={entry.version}
              style={{
                marginBottom: index < filteredChangelog.length - 1 ? '2rem' : 0,
                paddingBottom: index < filteredChangelog.length - 1 ? '2rem' : 0,
                borderBottom: index < filteredChangelog.length - 1
                  ? `1px solid ${colors.borderSubtle}`
                  : 'none',
              }}
            >
              {/* Version header */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    backgroundColor: colors.accentMuted,
                    color: colors.accent,
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
                    color: colors.textMuted,
                  }}>
                    {entry.date}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: colors.text,
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
                        color: colors.text,
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
          borderTop: `1px solid ${colors.borderSubtle}`,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: colors.textMuted,
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
