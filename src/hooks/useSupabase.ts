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

// Set logs hook for workout sessions
export function useSetLogs(sessionId?: string) {
  const [sets, setSets] = useState<{ exercise_id: string; set_number: number; weight: number; reps: number }[]>([]);

  const logSet = async (
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    targetWeight?: number,
    targetReps?: number,
    setType: 'warmup' | 'working' | 'dropset' | 'failure' = 'working'
  ) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('set_logs')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
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
    setSets(prev => [...prev, { exercise_id: exerciseId, set_number: setNumber, weight, reps }]);
    return data;
  };

  return { sets, logSet };
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
