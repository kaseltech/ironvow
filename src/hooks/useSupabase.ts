'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type {
  Profile,
  WeightLog,
  WeightGoal,
  Equipment,
  Exercise,
  WorkoutSession,
  Injury,
  MuscleStrength,
  EquipmentPreset,
  GymProfile,
} from '@/lib/supabase/types';

// Profile hook
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: {
    display_name?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    date_of_birth?: string | null;
    height_inches?: number | null;
    experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
    preferred_units?: 'imperial' | 'metric';
    custom_equipment?: string[];
  }) => {
    if (!user) return;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  // Check if profile is complete (has required onboarding fields)
  const isProfileComplete = profile && profile.gender && profile.experience_level;

  return { profile, loading, error, updateProfile, refetch: fetchProfile, isProfileComplete };
}

// Weight logs hook
export function useWeightLogs(limit = 30) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight logs');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addWeightLog = async (weight: number, notes?: string) => {
    if (!user) return;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: user.id,
        weight,
        notes,
        logged_at: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      }, {
        onConflict: 'user_id,logged_at',
      })
      .select()
      .single();

    if (error) throw error;
    await fetchLogs(); // Refresh list
    return data;
  };

  return { logs, loading, error, addWeightLog, refetch: fetchLogs };
}

// Weight goal hook
export function useWeightGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    if (!user) {
      setGoal(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('weight_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setGoal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight goal');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const setWeightGoal = async (
    goalType: 'cut' | 'bulk' | 'maintain' | 'recomp',
    startWeight: number,
    targetWeight?: number,
    targetDate?: string
  ) => {
    if (!user) return;

    const supabase = getSupabase();

    // Deactivate existing goals
    await supabase
      .from('weight_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Create new goal
    const { data, error } = await supabase
      .from('weight_goals')
      .insert({
        user_id: user.id,
        goal_type: goalType,
        start_weight: startWeight,
        target_weight: targetWeight,
        target_date: targetDate,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    setGoal(data);
    return data;
  };

  return { goal, loading, error, setWeightGoal, refetch: fetchGoal };
}

// Equipment hook
export function useEquipment() {
  const { user } = useAuth();
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [userEquipment, setUserEquipment] = useState<{ equipment_id: string; location: 'home' | 'gym' }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      // Fetch all available equipment
      const { data: allEq, error: allError } = await supabase
        .from('equipment')
        .select('*')
        .order('category', { ascending: true });

      if (allError) throw allError;
      setAllEquipment(allEq || []);

      // Fetch user's equipment if logged in
      if (user) {
        const { data: userEq, error: userError } = await supabase
          .from('user_equipment')
          .select('equipment_id, location')
          .eq('user_id', user.id);

        if (userError) throw userError;
        setUserEquipment(userEq || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const toggleEquipment = async (equipmentId: string, location: 'home' | 'gym') => {
    if (!user) return;

    const supabase = getSupabase();
    const existing = userEquipment.find(
      e => e.equipment_id === equipmentId && e.location === location
    );

    if (existing) {
      // Remove
      await supabase
        .from('user_equipment')
        .delete()
        .eq('user_id', user.id)
        .eq('equipment_id', equipmentId)
        .eq('location', location);
    } else {
      // Add
      await supabase
        .from('user_equipment')
        .insert({ user_id: user.id, equipment_id: equipmentId, location });
    }

    await fetchEquipment();
  };

  const hasEquipment = (equipmentId: string, location?: 'home' | 'gym') => {
    return userEquipment.some(
      e => e.equipment_id === equipmentId && (location ? e.location === location : true)
    );
  };

  return { allEquipment, userEquipment, loading, toggleEquipment, hasEquipment, refetch: fetchEquipment };
}

// Exercises hook
export function useExercises(filters?: { muscleGroup?: string; equipment?: string[] }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        let query = supabase.from('exercises').select('*');

        if (filters?.muscleGroup) {
          query = query.contains('primary_muscles', [filters.muscleGroup]);
        }

        const { data, error } = await query.order('name');
        if (error) throw error;
        setExercises(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [filters?.muscleGroup, filters?.equipment]);

  return { exercises, loading };
}

// Workout sessions hook
export function useWorkoutSessions(limit = 10) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setSessions(data || []);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (
    name: string,
    workoutId?: string,
    location?: 'home' | 'gym' | 'travel' | 'outdoor'
  ) => {
    if (!user) return;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        name,
        location,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const completeSession = async (sessionId: string, rating?: number, notes?: string) => {
    const supabase = getSupabase();
    const startedAt = sessions.find(s => s.id === sessionId)?.started_at;
    const durationSeconds = startedAt
      ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      : null;

    const { error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        rating,
        notes,
      })
      .eq('id', sessionId);

    if (error) throw error;
    await fetchSessions();
  };

  return { sessions, loading, startSession, completeSession, refetch: fetchSessions };
}

// Injuries hook
export function useInjuries() {
  const { user } = useAuth();
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInjuries = useCallback(async () => {
    if (!user) {
      setInjuries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setInjuries(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInjuries();
  }, [fetchInjuries]);

  const addInjury = async (
    bodyPart: string,
    severity: 'minor' | 'moderate' | 'severe',
    description?: string,
    movementsToAvoid?: string[]
  ) => {
    if (!user) return;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('injuries')
      .insert({
        user_id: user.id,
        body_part: bodyPart,
        severity,
        description,
        movements_to_avoid: movementsToAvoid,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchInjuries();
    return data;
  };

  const removeInjury = async (injuryId: string) => {
    const supabase = getSupabase();
    await supabase
      .from('injuries')
      .update({ is_active: false })
      .eq('id', injuryId);
    await fetchInjuries();
  };

  return { injuries, loading, addInjury, removeInjury, refetch: fetchInjuries };
}

// Logged set with full details
export interface LoggedSet {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string; // For display when exercise_id is missing
  set_number: number;
  weight: number;
  reps: number;
  target_weight?: number;
  target_reps?: number;
  set_type: 'warmup' | 'working' | 'dropset' | 'failure';
  logged_at: string;
  synced: boolean; // For offline queue
}

// Offline queue storage key
const OFFLINE_QUEUE_KEY = 'ironvow_offline_sets';

// Get pending sets from localStorage
function getPendingSets(): LoggedSet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save pending sets to localStorage
function savePendingSets(sets: LoggedSet[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(sets));
}

// Set logs hook for workout sessions with offline support
export function useSetLogs() {
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [pendingSync, setPendingSync] = useState(0);

  // Load any pending offline sets on mount
  useEffect(() => {
    const pending = getPendingSets();
    if (pending.length > 0) {
      setPendingSync(pending.length);
      // Try to sync them
      syncPendingSets();
    }
  }, []);

  // Sync pending offline sets to database
  const syncPendingSets = async () => {
    const pending = getPendingSets();
    if (pending.length === 0) return;

    const supabase = getSupabase();
    const stillPending: LoggedSet[] = [];

    for (const set of pending) {
      try {
        const { error } = await supabase
          .from('set_logs')
          .upsert({
            id: set.id,
            session_id: set.session_id,
            exercise_id: set.exercise_id || null, // Allow null for unmatched exercises
            set_number: set.set_number,
            weight: set.weight,
            reps: set.reps,
            target_weight: set.target_weight,
            target_reps: set.target_reps,
            set_type: set.set_type,
          });

        if (error) {
          console.error('Failed to sync set:', error);
          stillPending.push(set);
        }
      } catch {
        stillPending.push(set);
      }
    }

    savePendingSets(stillPending);
    setPendingSync(stillPending.length);
  };

  // Log a new set (with offline fallback)
  const logSet = async (
    sessionId: string,
    exerciseId: string | null, // Can be null for unmatched AI exercises
    exerciseName: string,
    setNumber: number,
    weight: number,
    reps: number,
    targetWeight?: number,
    targetReps?: number,
    setType: 'warmup' | 'working' | 'dropset' | 'failure' = 'working'
  ): Promise<LoggedSet> => {
    const tempId = crypto.randomUUID();
    const loggedAt = new Date().toISOString();

    const newSet: LoggedSet = {
      id: tempId,
      session_id: sessionId,
      exercise_id: exerciseId || '',
      exercise_name: exerciseName,
      set_number: setNumber,
      weight,
      reps,
      target_weight: targetWeight,
      target_reps: targetReps,
      set_type: setType,
      logged_at: loggedAt,
      synced: false,
    };

    // Add to local state immediately
    setSets(prev => [...prev, newSet]);

    // Try to sync to database
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('set_logs')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId || null,
          set_number: setNumber,
          weight,
          reps,
          target_weight: targetWeight,
          target_reps: targetReps,
          set_type: setType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update with real ID from database
      const syncedSet = { ...newSet, id: data.id, synced: true };
      setSets(prev => prev.map(s => s.id === tempId ? syncedSet : s));
      return syncedSet;
    } catch (err) {
      console.warn('Failed to sync set, queuing offline:', err);
      // Add to offline queue
      const pending = getPendingSets();
      pending.push(newSet);
      savePendingSets(pending);
      setPendingSync(pending.length);
      return newSet;
    }
  };

  // Edit an existing set
  const editSet = async (
    setId: string,
    updates: { weight?: number; reps?: number; set_type?: 'warmup' | 'working' | 'dropset' | 'failure' }
  ): Promise<boolean> => {
    // Update local state immediately
    setSets(prev => prev.map(s =>
      s.id === setId ? { ...s, ...updates } : s
    ));

    // Find the set to check if it's synced
    const set = sets.find(s => s.id === setId);
    if (!set) return false;

    // If not synced yet, just update the pending queue
    if (!set.synced) {
      const pending = getPendingSets();
      const updatedPending = pending.map(s =>
        s.id === setId ? { ...s, ...updates } : s
      );
      savePendingSets(updatedPending);
      return true;
    }

    // Sync update to database
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('set_logs')
        .update(updates)
        .eq('id', setId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to update set:', err);
      return false;
    }
  };

  // Delete a logged set
  const deleteSet = async (setId: string): Promise<boolean> => {
    const set = sets.find(s => s.id === setId);
    if (!set) return false;

    // Remove from local state
    setSets(prev => prev.filter(s => s.id !== setId));

    // If not synced, remove from pending queue
    if (!set.synced) {
      const pending = getPendingSets();
      savePendingSets(pending.filter(s => s.id !== setId));
      setPendingSync(prev => Math.max(0, prev - 1));
      return true;
    }

    // Delete from database
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('set_logs')
        .delete()
        .eq('id', setId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to delete set:', err);
      // Re-add to local state on failure
      setSets(prev => [...prev, set]);
      return false;
    }
  };

  // Get sets for a specific exercise in the current session
  const getSetsForExercise = (exerciseId: string | null, exerciseName: string): LoggedSet[] => {
    return sets.filter(s =>
      (exerciseId && s.exercise_id === exerciseId) ||
      (!exerciseId && s.exercise_name === exerciseName)
    );
  };

  return {
    sets,
    logSet,
    editSet,
    deleteSet,
    getSetsForExercise,
    pendingSync,
    syncPendingSets,
  };
}

// Muscle strength hook
export function useMuscleStrength() {
  const { user } = useAuth();
  const [muscleData, setMuscleData] = useState<MuscleStrength[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMuscleData = useCallback(async () => {
    if (!user) {
      setMuscleData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('muscle_strength')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMuscleData(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMuscleData();
  }, [fetchMuscleData]);

  return { muscleData, loading, refetch: fetchMuscleData };
}

// Equipment presets hook
export function useEquipmentPresets() {
  const [presets, setPresets] = useState<EquipmentPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('equipment_presets')
          .select('*')
          .order('name');

        if (error) throw error;
        setPresets(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  return { presets, loading };
}

// Gym profiles hook
export function useGymProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<GymProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('gym_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = async (
    name: string,
    gymType: GymProfile['gym_type'],
    equipmentIds: string[],
    customEquipment: string[] = [],
    isDefault: boolean = false
  ) => {
    if (!user) return;

    const supabase = getSupabase();

    // If setting as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from('gym_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('gym_profiles')
      .insert({
        user_id: user.id,
        name,
        gym_type: gymType,
        equipment_ids: equipmentIds,
        custom_equipment: customEquipment,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchProfiles();
    return data;
  };

  const updateProfile = async (
    profileId: string,
    updates: {
      name?: string;
      gym_type?: GymProfile['gym_type'];
      equipment_ids?: string[];
      custom_equipment?: string[];
      is_default?: boolean;
    }
  ) => {
    if (!user) return;

    const supabase = getSupabase();

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await supabase
        .from('gym_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('gym_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchProfiles();
    return data;
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return;

    const supabase = getSupabase();
    await supabase
      .from('gym_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user.id);

    await fetchProfiles();
  };

  const getDefaultProfile = () => profiles.find(p => p.is_default) || profiles[0];

  return {
    profiles,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    getDefaultProfile,
    refetch: fetchProfiles,
  };
}
