'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  onSettingsClick?: () => void;
  onTimerClick?: () => void;
  onRunClick?: () => void;
  showSettings?: boolean;
  showTimer?: boolean;
  showRun?: boolean;
}

export function Header({ onSettingsClick, onTimerClick, onRunClick, showSettings = true, showTimer = true, showRun = false }: HeaderProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colors } = useTheme();

  return (
    <header
      style={{
        background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.bg} 100%)`,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <div className="flex items-center justify-between">
        <Logo size="lg" href="/" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Run Button */}
          {showRun && onRunClick && (
            <button
              onClick={onRunClick}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.75rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Go for a Run"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="17" cy="4" r="2" />
                <path d="M15 7l-2.5 2.5L9 8l-4 4" />
                <path d="M15 7l2 5-3 2 1 5" />
                <path d="M9 8l-1 7" />
              </svg>
            </button>
          )}
          {/* Timer Button */}
          {showTimer && onTimerClick && (
            <button
              onClick={onTimerClick}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.75rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Timer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          )}
          {/* Logout Button */}
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.75rem',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
          {/* Settings Button */}
          {showSettings && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.75rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
