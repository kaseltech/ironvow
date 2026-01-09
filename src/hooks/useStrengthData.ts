'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Types for the view data
export interface ExercisePR {
  exercise_id: string;
  exercise_name: string;
  exercise_slug: string;
  primary_muscles: string[];
  is_compound: boolean;
  pr_weight: number;
  pr_reps: number;
  estimated_1rm: number;
  achieved_at: string;
}

export interface MuscleVolume {
  muscle: string;
  total_volume: number;
  last_trained: string;
  training_days: number;
}

export interface SessionSummary {
  session_id: string;
  session_name: string;
  location: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  rating: number | null;
  exercise_count: number;
  total_volume: number;
  total_sets: number;
}

export interface MuscleStrength {
  id: string;
  name: string;
  strength: number; // 0-100 score
  volume: string;
  lastTrained: string;
  trend: 'up' | 'stable' | 'down';
}

/**
 * Hook to fetch user's strength data from calculated views
 */
export function useStrengthData() {
  const { user } = useAuth();
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolume[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrengthData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Fetch all data in parallel
      const [prsResult, volumeResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_personal_records')
          .select('*')
          .eq('user_id', user.id),

        supabase
          .from('user_muscle_volume')
          .select('*')
          .eq('user_id', user.id),

        supabase
          .from('user_session_summary')
          .select('*')
          .eq('user_id', user.id)
          .limit(20),
      ]);

      if (prsResult.error) throw prsResult.error;
      if (volumeResult.error) throw volumeResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      setExercisePRs(prsResult.data || []);
      setMuscleVolume(volumeResult.data || []);
      setSessions(sessionsResult.data || []);
    } catch (err) {
      console.error('Error fetching strength data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load strength data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStrengthData();
  }, [fetchStrengthData]);

  return {
    exercisePRs,
    muscleVolume,
    sessions,
    loading,
    error,
    refetch: fetchStrengthData,
  };
}

/**
 * Format volume for display (e.g., "12.4k lbs")
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toString();
}

/**
 * Format days ago for display
 */
export function formatDaysAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Format date for display (e.g., "Jan 6")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format muscle name for display (e.g., "upper_back" → "Upper Back")
 */
export function formatMuscleName(muscle: string): string {
  return muscle
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate muscle strength score based on volume and training frequency
 * Returns a score from 0-100
 */
export function calculateMuscleScore(volume: MuscleVolume): number {
  // Factors:
  // - Training frequency (training_days in last 30 days)
  // - Total volume (relative to expected for muscle group)

  // Base score from training frequency (0-50 points)
  // Ideal is 8-12 training days per month for most muscle groups
  const frequencyScore = Math.min(50, (volume.training_days / 10) * 50);

  // Volume score based on recency (0-50 points)
  const daysSinceTraining = Math.floor(
    (Date.now() - new Date(volume.last_trained).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Decay score if not trained recently
  const recencyMultiplier = daysSinceTraining <= 3 ? 1.0 :
    daysSinceTraining <= 7 ? 0.8 :
    daysSinceTraining <= 14 ? 0.5 : 0.3;

  const volumeScore = 50 * recencyMultiplier;

  return Math.round(frequencyScore + volumeScore);
}

/**
 * Calculate trend based on muscle training data
 */
export function calculateTrend(volume: MuscleVolume): 'up' | 'stable' | 'down' {
  const daysSinceTraining = Math.floor(
    (Date.now() - new Date(volume.last_trained).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Simple heuristic: trending down if not trained in over a week
  if (daysSinceTraining > 7) return 'down';
  if (daysSinceTraining <= 3 && volume.training_days >= 3) return 'up';
  return 'stable';
}

/**
 * Convert muscle volume data to the format expected by BodyMap
 */
export function convertToMuscleStrength(volumeData: MuscleVolume[]): MuscleStrength[] {
  return volumeData.map(mv => ({
    id: mv.muscle,
    name: formatMuscleName(mv.muscle),
    strength: calculateMuscleScore(mv),
    volume: formatVolume(mv.total_volume),
    lastTrained: formatDaysAgo(mv.last_trained),
    trend: calculateTrend(mv),
  }));
}
