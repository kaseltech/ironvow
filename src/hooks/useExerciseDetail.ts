'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { Exercise } from '@/lib/supabase/types';

// Cache for exercise lookups to avoid repeated queries
const exerciseCache = new Map<string, Exercise | null>();

export interface ExerciseDetail extends Exercise {
  youtubeSearchUrl: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getYouTubeSearchUrl(name: string): string {
  const query = encodeURIComponent(`how to ${name} exercise`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export function useExerciseDetail() {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercise = useCallback(async (name: string): Promise<ExerciseDetail | null> => {
    // Check cache first
    const slug = slugify(name);
    const cacheKey = slug;

    if (exerciseCache.has(cacheKey)) {
      const cached = exerciseCache.get(cacheKey);
      if (cached) {
        const result = { ...cached, youtubeSearchUrl: getYouTubeSearchUrl(name) };
        setExercise(result);
        return result;
      }
      // Cached as null (not found)
      setExercise(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Try exact slug match first
      let { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('slug', slug)
        .single();

      // If not found, try fuzzy name match
      if (!data) {
        const { data: fuzzyData } = await supabase
          .from('exercises')
          .select('*')
          .ilike('name', `%${name}%`)
          .limit(1)
          .single();
        data = fuzzyData;
      }

      // Cache the result (even if null)
      exerciseCache.set(cacheKey, data);

      if (data) {
        const result = { ...data, youtubeSearchUrl: getYouTubeSearchUrl(name) };
        setExercise(result);
        return result;
      }

      setExercise(null);
      return null;
    } catch (err) {
      console.error('Failed to fetch exercise:', err);
      setError('Failed to load exercise details');
      exerciseCache.set(cacheKey, null);
      setExercise(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearExercise = useCallback(() => {
    setExercise(null);
    setError(null);
  }, []);

  return {
    exercise,
    loading,
    error,
    fetchExercise,
    clearExercise,
  };
}

// Clear cache (useful for testing or when data updates)
export function clearExerciseCache() {
  exerciseCache.clear();
}
