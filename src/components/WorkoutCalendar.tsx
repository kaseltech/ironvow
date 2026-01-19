'use client';

import { useMemo, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { CalendarDay } from '@/hooks/useStrengthData';

interface WorkoutCalendarProps {
  calendarData: Map<string, CalendarDay>;
  weeks?: number; // Number of weeks to show (default 12)
}

// Days of week labels
const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

export function WorkoutCalendar({ calendarData, weeks = 12 }: WorkoutCalendarProps) {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Generate grid data for the last N weeks
  const gridData = useMemo(() => {
    const today = new Date();
    const grid: (CalendarDay | null)[][] = [];

    // Start from the beginning of the first week we want to show
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Adjust to start on Monday
    const dayOfWeek = startDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysFromMonday);

    // Build grid (columns are weeks, rows are days)
    let currentDate = new Date(startDate);
    const actualWeeks = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;

    for (let week = 0; week < actualWeeks; week++) {
      const weekData: (CalendarDay | null)[] = [];

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInFuture = currentDate > today;

        if (isInFuture) {
          weekData.push(null);
        } else {
          const dayData = calendarData.get(dateStr);
          weekData.push(dayData || {
            date: dateStr,
            workoutCount: 0,
            totalVolume: 0,
            exerciseCount: 0,
            hasPR: false,
            sessionIds: [],
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      grid.push(weekData);
    }

    return grid;
  }, [calendarData, weeks]);

  // Calculate max volume for color intensity
  const maxVolume = useMemo(() => {
    let max = 0;
    calendarData.forEach(day => {
      if (day.totalVolume > max) max = day.totalVolume;
    });
    return max || 1;
  }, [calendarData]);

  // Get cell color based on workout data
  const getCellColor = (day: CalendarDay | null): string => {
    if (!day || day.workoutCount === 0) {
      return colors.inputBg;
    }

    // Color intensity based on volume
    const intensity = Math.min(1, day.totalVolume / maxVolume);
    const baseOpacity = 0.3 + (intensity * 0.7);

    // Use accent color with varying opacity
    // Parse the hex color and create rgba
    const hex = colors.accent.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${baseOpacity})`;
  };

  // Format date for tooltip
  const formatTooltipDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get month labels for the grid
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    gridData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(d => d !== null);
      if (firstDayOfWeek) {
        const date = new Date(firstDayOfWeek.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [gridData]);

  const cellSize = 12;
  const cellGap = 3;
  const labelWidth = 16;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 600 }}>
          Activity
        </span>
        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
          Last {weeks} weeks
        </span>
      </div>

      {/* Calendar Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {/* Month labels */}
        <div
          style={{
            display: 'flex',
            marginLeft: `${labelWidth}px`,
            marginBottom: '4px',
            gap: `${cellGap}px`,
          }}
        >
          {gridData.map((_, weekIndex) => {
            const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
            return (
              <div
                key={weekIndex}
                style={{
                  width: `${cellSize}px`,
                  fontSize: '0.5625rem',
                  color: colors.textMuted,
                  textAlign: 'left',
                }}
              >
                {monthLabel?.label || ''}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex' }}>
          {/* Day labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${cellGap}px`,
              marginRight: '2px',
              width: `${labelWidth}px`,
            }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  height: `${cellSize}px`,
                  fontSize: '0.5625rem',
                  color: colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '2px',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'flex', gap: `${cellGap}px` }}>
            {gridData.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${cellGap}px`,
                }}
              >
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    onClick={() => day && day.workoutCount > 0 && setSelectedDay(selectedDay?.date === day.date ? null : day)}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      borderRadius: '2px',
                      background: getCellColor(day),
                      cursor: day && day.workoutCount > 0 ? 'pointer' : 'default',
                      border: day?.hasPR ? `1px solid ${colors.accent}` : 'none',
                      boxSizing: 'border-box',
                    }}
                    title={day ? `${formatTooltipDate(day.date)}: ${day.workoutCount} workout${day.workoutCount !== 1 ? 's' : ''}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center justify-end gap-2 mt-2"
        style={{ fontSize: '0.625rem', color: colors.textMuted }}
      >
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => {
          const hex = colors.accent.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const opacity = intensity === 0 ? 0 : 0.3 + (intensity * 0.7);
          const bg = intensity === 0 ? colors.inputBg : `rgba(${r}, ${g}, ${b}, ${opacity})`;

          return (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: bg,
              }}
            />
          );
        })}
        <span>More</span>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && selectedDay.workoutCount > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500 }}>
              {formatTooltipDate(selectedDay.date)}
            </span>
            {selectedDay.hasPR && (
              <span style={{ color: colors.accent, fontSize: '0.75rem' }}>
                🏆 PR Day!
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <div>
              <span style={{ color: colors.accent, fontWeight: 600 }}>{selectedDay.workoutCount}</span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> workout{selectedDay.workoutCount !== 1 ? 's' : ''}</span>
            </div>
            <div>
              <span style={{ color: colors.accent, fontWeight: 600 }}>
                {selectedDay.totalVolume >= 1000 ? `${(selectedDay.totalVolume / 1000).toFixed(1)}k` : selectedDay.totalVolume}
              </span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> lbs</span>
            </div>
            <div>
              <span style={{ color: colors.accent, fontWeight: 600 }}>{selectedDay.exerciseCount}</span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}> exercises</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
