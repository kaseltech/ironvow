'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { TimerMode, TimerConfig, TimerPreset } from '@/components/FlexTimer/types';

export function useTimerPresets() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch presets
  const fetchPresets = useCallback(async () => {
    if (!user) {
      setPresets([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from('timer_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPresets(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching timer presets:', err);
      setError('Failed to load presets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Create a new preset
  const createPreset = async (
    name: string,
    mode: TimerMode,
    config: Partial<TimerConfig>
  ): Promise<TimerPreset | null> => {
    if (!user) return null;

    try {
      const supabase = getSupabase();
      const { data, error: insertError } = await supabase
        .from('timer_presets')
        .insert({
          user_id: user.id,
          name,
          mode,
          config,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPresets(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating timer preset:', err);
      setError('Failed to save preset');
      return null;
    }
  };

  // Update a preset
  const updatePreset = async (
    id: string,
    updates: {
      name?: string;
      mode?: TimerMode;
      config?: Partial<TimerConfig>;
      is_favorite?: boolean;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from('timer_presets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPresets(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
      return true;
    } catch (err) {
      console.error('Error updating timer preset:', err);
      setError('Failed to update preset');
      return false;
    }
  };

  // Delete a preset
  const deletePreset = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const supabase = getSupabase();
      const { error: deleteError } = await supabase
        .from('timer_presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setPresets(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting timer preset:', err);
      setError('Failed to delete preset');
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string): Promise<boolean> => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return false;

    return updatePreset(id, { is_favorite: !preset.is_favorite });
  };

  // Get favorites
  const favorites = presets.filter(p => p.is_favorite);

  return {
    presets,
    favorites,
    loading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    toggleFavorite,
    refetch: fetchPresets,
  };
}
