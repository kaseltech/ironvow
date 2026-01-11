'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { SessionDetail, SessionDetailExercise, SessionDetailSet } from '@/lib/supabase/types';

interface RawSessionDetailRow {
  session_id: string;
  user_id: string;
  workout_id: string | null;
  session_name: string;
  location: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  session_notes: string | null;
  rating: number | null;
  set_log_id: string | null;
  exercise_id: string | null;
  exercise_name: string | null;
  exercise_slug: string | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  set_number: number | null;
  set_type: string | null;
  weight: number | null;
  reps: number | null;
  target_weight: number | null;
  target_reps: number | null;
  rpe: number | null;
  rest_seconds: number | null;
  set_notes: string | null;
  logged_at: string | null;
  set_volume: number | null;
}

/**
 * Hook to fetch detailed session data for workout history expansion
 */
export function useSessionDetail() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCache, setSessionCache] = useState<Map<string, SessionDetail>>(new Map());

  /**
   * Fetch session detail by ID
   * Results are cached to avoid refetching on expand/collapse
   */
  const fetchSessionDetail = useCallback(async (sessionId: string): Promise<SessionDetail | null> => {
    // Check cache first
    if (sessionCache.has(sessionId)) {
      return sessionCache.get(sessionId) || null;
    }

    if (!user) {
      setError('Not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      const { data, error: fetchError } = await supabase
        .from('user_session_detail')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setError('Session not found');
        return null;
      }

      // Group sets by exercise
      const rows = data as RawSessionDetailRow[];
      const exerciseMap = new Map<string, SessionDetailExercise>();

      let totalVolume = 0;

      for (const row of rows) {
        if (!row.exercise_id || !row.exercise_name) continue;

        if (!exerciseMap.has(row.exercise_id)) {
          exerciseMap.set(row.exercise_id, {
            exercise_id: row.exercise_id,
            exercise_name: row.exercise_name,
            exercise_slug: row.exercise_slug || '',
            primary_muscles: row.primary_muscles || [],
            secondary_muscles: row.secondary_muscles,
            sets: [],
            total_volume: 0,
          });
        }

        const exercise = exerciseMap.get(row.exercise_id)!;

        if (row.set_log_id && row.set_number !== null) {
          const setVolume = row.set_volume || 0;
          exercise.sets.push({
            set_log_id: row.set_log_id,
            set_number: row.set_number,
            set_type: row.set_type || 'working',
            weight: row.weight,
            reps: row.reps,
            target_weight: row.target_weight,
            target_reps: row.target_reps,
            rpe: row.rpe,
            rest_seconds: row.rest_seconds,
            set_notes: row.set_notes,
            set_volume: setVolume,
          });
          exercise.total_volume += setVolume;
          totalVolume += setVolume;
        }
      }

      // Sort sets by set_number within each exercise
      for (const exercise of exerciseMap.values()) {
        exercise.sets.sort((a, b) => a.set_number - b.set_number);
      }

      const firstRow = rows[0];
      const sessionDetail: SessionDetail = {
        session_id: firstRow.session_id,
        user_id: firstRow.user_id,
        workout_id: firstRow.workout_id,
        session_name: firstRow.session_name,
        location: firstRow.location,
        started_at: firstRow.started_at,
        completed_at: firstRow.completed_at,
        duration_seconds: firstRow.duration_seconds,
        session_notes: firstRow.session_notes,
        rating: firstRow.rating,
        exercises: Array.from(exerciseMap.values()),
        total_volume: totalVolume,
      };

      // Cache the result
      setSessionCache(prev => new Map(prev).set(sessionId, sessionDetail));

      return sessionDetail;
    } catch (err) {
      console.error('Error fetching session detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session detail');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, sessionCache]);

  /**
   * Clear the cache (e.g., when user logs out)
   */
  const clearCache = useCallback(() => {
    setSessionCache(new Map());
  }, []);

  /**
   * Get cached session detail if available
   */
  const getCachedSession = useCallback((sessionId: string): SessionDetail | null => {
    return sessionCache.get(sessionId) || null;
  }, [sessionCache]);

  return {
    fetchSessionDetail,
    clearCache,
    getCachedSession,
    loading,
    error,
  };
}

/**
 * Hook to bookmark/unbookmark a workout
 */
export function useWorkoutBookmark() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBookmark = useCallback(async (workoutId: string, isSaved: boolean): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      const { error: updateError } = await supabase
        .from('workouts')
        .update({ is_saved: isSaved })
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    toggleBookmark,
    loading,
    error,
  };
}
