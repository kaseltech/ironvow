'use client';

import { useTheme } from '@/context/ThemeContext';
import { StreakData } from '@/hooks/useStrengthData';

interface StreakTrackerProps {
  streakData: StreakData;
}

export function StreakTracker({ streakData }: StreakTrackerProps) {
  const { colors } = useTheme();

  const {
    currentStreak,
    longestStreak,
    daysSinceLastWorkout,
    thisWeekWorkouts,
    thisMonthWorkouts,
  } = streakData;

  // Determine streak status message
  const getStreakMessage = () => {
    if (currentStreak === 0 && daysSinceLastWorkout > 0) {
      if (daysSinceLastWorkout === 1) return "Get back on track today!";
      if (daysSinceLastWorkout <= 3) return "Time to get moving!";
      return "Start a new streak today!";
    }
    if (currentStreak >= 7) return "Incredible consistency!";
    if (currentStreak >= 3) return "Great momentum!";
    if (currentStreak >= 1) return "Keep it going!";
    return "Start your streak!";
  };

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: '1rem',
        padding: '1rem',
        border: `1px solid ${colors.borderSubtle}`,
        marginBottom: '1rem',
      }}
    >
      {/* Current Streak - Hero */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            style={{
              fontSize: '2rem',
              lineHeight: 1,
            }}
          >
            🔥
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  color: currentStreak > 0 ? colors.accent : colors.textMuted,
                  fontSize: '2rem',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {currentStreak}
              </span>
              <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                day{currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.125rem' }}>
              {getStreakMessage()}
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        {longestStreak > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: colors.textMuted, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Best
            </div>
            <div className="flex items-baseline gap-1">
              <span style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600 }}>
                {longestStreak}
              </span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                days
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div
        className="flex justify-around"
        style={{
          paddingTop: '0.75rem',
          borderTop: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div className="text-center">
          <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
            {thisWeekWorkouts}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
            This Week
          </div>
        </div>

        <div
          style={{
            width: '1px',
            background: colors.borderSubtle,
          }}
        />

        <div className="text-center">
          <div style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 600 }}>
            {thisMonthWorkouts}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
            This Month
          </div>
        </div>

        <div
          style={{
            width: '1px',
            background: colors.borderSubtle,
          }}
        />

        <div className="text-center">
          <div style={{ color: daysSinceLastWorkout === 0 ? '#4ADE80' : colors.text, fontSize: '1.25rem', fontWeight: 600 }}>
            {daysSinceLastWorkout === 0 ? 'Today' : daysSinceLastWorkout === 1 ? '1d' : `${daysSinceLastWorkout}d`}
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
            Last Workout
          </div>
        </div>
      </div>
    </div>
  );
}
