'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Types for exercise history
export interface ExerciseSet {
  set_number: number;
  weight: number;
  reps: number;
  set_type: 'warmup' | 'working' | 'dropset' | 'failure';
  estimated_1rm: number;
  set_volume: number;
}

export interface ExerciseSession {
  session_id: string;
  workout_date: string;
  sets: ExerciseSet[];
  top_set: string; // e.g., "165×8"
  total_volume: number;
  best_estimated_1rm: number;
}

export interface ExercisePR {
  weight: number;
  reps: number;
  estimated_1rm: number;
  achieved_at: string;
}

export interface ExerciseHistoryData {
  exercise_id: string;
  exercise_name: string;
  sessions: ExerciseSession[];
  pr: ExercisePR | null;
  trend: 'up' | 'stable' | 'down';
  avgRestDays: number;
  preferredRepRange: string;
}

/**
 * Hook to fetch detailed history for a specific exercise
 */
export function useExerciseHistory(exerciseId: string | null) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ExerciseHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user || !exerciseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Fetch all sets for this exercise
      const { data: rawSets, error: setsError } = await supabase
        .from('user_exercise_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .order('logged_at', { ascending: false });

      if (setsError) throw setsError;

      if (!rawSets || rawSets.length === 0) {
        setHistory(null);
        setLoading(false);
        return;
      }

      // Group sets by session/date
      const sessionMap = new Map<string, ExerciseSet[]>();

      for (const set of rawSets) {
        const dateKey = set.workout_date;
        if (!sessionMap.has(dateKey)) {
          sessionMap.set(dateKey, []);
        }
        sessionMap.get(dateKey)!.push({
          set_number: set.set_number,
          weight: set.weight,
          reps: set.reps,
          set_type: set.set_type,
          estimated_1rm: set.estimated_1rm,
          set_volume: set.set_volume,
        });
      }

      // Convert to sessions array
      const sessions: ExerciseSession[] = [];
      const e1rmHistory: number[] = [];

      sessionMap.forEach((sets, dateKey) => {
        const sortedSets = sets.sort((a, b) => a.set_number - b.set_number);
        const topSet = sortedSets.reduce((best, s) =>
          s.estimated_1rm > best.estimated_1rm ? s : best
        );
        const totalVolume = sortedSets.reduce((sum, s) => sum + s.set_volume, 0);

        sessions.push({
          session_id: dateKey, // Using date as key
          workout_date: dateKey,
          sets: sortedSets,
          top_set: `${topSet.weight}×${topSet.reps}`,
          total_volume: totalVolume,
          best_estimated_1rm: topSet.estimated_1rm,
        });

        e1rmHistory.push(topSet.estimated_1rm);
      });

      // Calculate PR (best ever)
      const allSets = rawSets;
      const bestSet = allSets.reduce((best, s) =>
        s.estimated_1rm > best.estimated_1rm ? s : best
      );
      const pr: ExercisePR = {
        weight: bestSet.weight,
        reps: bestSet.reps,
        estimated_1rm: bestSet.estimated_1rm,
        achieved_at: bestSet.logged_at,
      };

      // Calculate trend (compare last 3 sessions to previous 3)
      const trend = calculateTrend(e1rmHistory);

      // Calculate avg rest days between sessions
      const avgRestDays = calculateAvgRestDays(sessions.map(s => s.workout_date));

      // Calculate preferred rep range
      const allReps = allSets.filter(s => s.set_type === 'working').map(s => s.reps);
      const avgReps = allReps.length > 0
        ? Math.round(allReps.reduce((a, b) => a + b, 0) / allReps.length)
        : 8;
      const preferredRepRange = `${avgReps - 2}-${avgReps + 2}`;

      setHistory({
        exercise_id: exerciseId,
        exercise_name: rawSets[0].exercise_name,
        sessions: sessions.slice(0, 10), // Last 10 sessions
        pr,
        trend,
        avgRestDays,
        preferredRepRange,
      });
    } catch (err) {
      console.error('Error fetching exercise history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exercise history');
    } finally {
      setLoading(false);
    }
  }, [user, exerciseId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
}

/**
 * Calculate trend from estimated 1RM history
 * Compares recent sessions to older sessions
 */
function calculateTrend(e1rmHistory: number[]): 'up' | 'stable' | 'down' {
  if (e1rmHistory.length < 3) return 'stable';

  // Recent average (first 3 - most recent)
  const recentAvg = e1rmHistory.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

  // Older average (next 3)
  const olderAvg = e1rmHistory.slice(3, 6).reduce((a, b) => a + b, 0) /
    Math.min(3, e1rmHistory.slice(3, 6).length);

  if (!olderAvg) return 'stable';

  const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (percentChange > 3) return 'up';
  if (percentChange < -3) return 'down';
  return 'stable';
}

/**
 * Calculate average rest days between sessions
 */
function calculateAvgRestDays(dates: string[]): number {
  if (dates.length < 2) return 0;

  const sortedDates = dates
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a); // Most recent first

  let totalDays = 0;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    totalDays += (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
  }

  return Math.round(totalDays / (sortedDates.length - 1));
}
