'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  showIcon?: boolean;
}

const sizes = {
  sm: { fontSize: '1.25rem', iconSize: 24 },
  md: { fontSize: '1.5rem', iconSize: 28 },
  lg: { fontSize: '2rem', iconSize: 32 },
  xl: { fontSize: '3rem', iconSize: 48 },
};

export function Logo({ size = 'md', href, showIcon = true }: LogoProps) {
  const { fontSize, iconSize } = sizes[size];

  const content = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {showIcon && (
        <Image
          src="/logo.png"
          alt=""
          width={iconSize}
          height={iconSize}
          style={{ borderRadius: '6px' }}
        />
      )}
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
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}
