'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: { fontSize: '1.25rem', subscriptSize: '0.5rem' },
  md: { fontSize: '1.5rem', subscriptSize: '0.6rem' },
  lg: { fontSize: '2rem', subscriptSize: '0.75rem' },
  xl: { fontSize: '3rem', subscriptSize: '1rem' },
};

export function Logo({ size = 'md' }: LogoProps) {
  const { fontSize, subscriptSize } = sizes[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span
        style={{
          fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
          fontSize,
          fontWeight: 400,
          color: '#F5F1EA',
          letterSpacing: '-0.02em',
        }}
      >
        Iron
      </span>
      <span
        style={{
          fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
          fontSize,
          fontWeight: 700,
          color: '#C9A75A',
          letterSpacing: '-0.02em',
        }}
      >
        Vow
      </span>
    </div>
  );
}
