'use client';

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

// Workout / Dumbbell icon
export function DumbbellIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
      <path d="M21.5 6.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
      <path d="M6.5 17.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
      <path d="M21.5 17.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M6.5 12h11" />
    </svg>
  );
}

// Simple weight/barbell icon
export function BarbellIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <path d="M3 8v8" />
      <path d="M21 8v8" />
      <path d="M6 12h12" />
      <rect x="1" y="9" width="4" height="6" rx="1" />
      <rect x="19" y="9" width="4" height="6" rx="1" />
    </svg>
  );
}

// Home icon
export function HomeIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// Outdoor/Tree icon
export function TreeIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-7" />
      <path d="M8 22h8" />
      <path d="M12 2L5 9h3l-3 5h4l-4 6h14l-4-6h4l-3-5h3L12 2z" />
    </svg>
  );
}

// Chart/Progress icon
export function ChartIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-6 6" />
    </svg>
  );
}

// Library/Book icon
export function BookIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

// User/Profile icon
export function UserIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// Upper body / Arm flexing icon
export function FlexIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// Bicep/Muscle icon (simpler, more iconic)
export function MuscleIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 11c.3-1.3 1-2.5 2-3.2C9.6 7 11.2 7 12 7c1.3 0 2.7.5 3.6 1.5.6.7 1 1.6 1.2 2.5.3 1.7-.3 3.5-1.5 4.7-.8.8-1.8 1.3-3 1.3H11c-1.2 0-2.3-.4-3.2-1.3-1.2-1.2-1.8-3-1.3-4.7z" />
      <path d="M12 7V4" />
      <path d="M8 17l-2 3" />
      <path d="M16 17l2 3" />
    </svg>
  );
}

// Leg icon
export function LegIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h-3a2 2 0 0 0-2 2v5" />
      <path d="M11 10v5c0 1.1-.4 2.2-1 3l-3 4" />
      <path d="M11 15l4 6" />
      <circle cx="16" cy="4" r="1" />
    </svg>
  );
}

// Full body / Person icon
export function BodyIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v6" />
      <path d="M12 12l-4 6" />
      <path d="M12 12l4 6" />
      <path d="M6 10h12" />
    </svg>
  );
}

// Running/Cardio icon
export function RunIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="17" cy="4" r="2" />
      <path d="M15 7l-2.5 2.5L9 8l-4 4" />
      <path d="M15 7l2 5-3 2 1 5" />
      <path d="M9 8l-1 7" />
    </svg>
  );
}

// Heart rate / cardio icon
export function HeartPulseIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 1 1 7.5 6.572" />
      <path d="M12 6v3l2 2-2 2v3" />
    </svg>
  );
}

// Timer/Clock icon
export function TimerIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Chevron down
export function ChevronDownIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Check icon
export function CheckIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Plus icon
export function PlusIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// X/Close icon
export function XIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Zap/Lightning for HIIT
export function ZapIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// Repeat/Circuit icon
export function RepeatIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// Target/WOD icon
export function TargetIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// Stretch/Yoga icon
export function StretchIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M4 17l4-4 4 4 4-4 4 4" />
      <path d="M12 6v5" />
      <path d="M8 11l4 0 4 0" />
    </svg>
  );
}

// Weight/Strength icon
export function WeightIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M7.8 7.8L5.6 5.6" />
      <path d="M18.4 18.4l-2.2-2.2" />
      <path d="M7.8 16.2l-2.2 2.2" />
      <path d="M18.4 5.6l-2.2 2.2" />
    </svg>
  );
}

// Sparkles/AI icon
export function SparklesIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z" />
      <path d="M19 14l.5 1.5L21 16l-1.5.5-.5 1.5-.5-1.5L17 16l1.5-.5.5-1.5z" />
    </svg>
  );
}

// Gym building icon
export function GymIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1" />
      <path d="M12 3L3 10h18L12 3z" />
      <path d="M10 21v-5h4v5" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  );
}

// Play icon for starting workout
export function PlayIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// Arrow right
export function ArrowRightIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Refresh/Regenerate icon
export function RefreshIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
