'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Workout',
    href: '/',
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="9" width="4" height="6" rx="1" />
        <rect x="19" y="9" width="4" height="6" rx="1" />
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M6 12h12" />
      </svg>
    ),
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 9l-5 5-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Library',
    href: '/library',
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0"
      style={{
        background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.cardBg} 100%)`,
        borderTop: `1px solid ${colors.borderSubtle}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.75rem 0 0.625rem',
        }}
      >
        {navItems.map(item => {
          // Handle both exact match and trailing slash variants
          const normalizedPath = pathname?.replace(/\/$/, '') || '/';
          const isActive = item.href === '/'
            ? normalizedPath === '/' || normalizedPath === ''
            : normalizedPath === item.href || normalizedPath.startsWith(item.href + '/');
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                background: isActive ? colors.accentMuted : 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.75rem',
                position: 'relative',
                transition: 'all 0.2s ease',
                minHeight: '48px',
                minWidth: '48px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {item.icon(isActive ? colors.accent : colors.textMuted)}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isActive ? colors.accent : colors.textMuted,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
