'use client';

import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { WorkoutPlan, WorkoutPlanDay, WorkoutPlanWithDays } from '@/lib/supabase/types';

interface RawPlanViewRow {
  plan_id: string;
  user_id: string;
  plan_name: string;
  description: string | null;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  day_id: string | null;
  day_of_week: number | null;
  muscle_focus: string[] | null;
  day_workout_style: string | null;
  workout_id: string | null;
  workout_name: string | null;
  workout_type: string | null;
  target_muscles: string[] | null;
  estimated_duration: number | null;
}

interface PlanDayConfig {
  day_of_week: number;
  muscle_focus?: string[];
  workout_style?: string;
}

interface CreatePlanInput {
  name: string;
  description?: string;
  start_date?: string;
  days: PlanDayConfig[];
}

/**
 * Hook to manage workout plans
 */
export function useWorkoutPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlanWithDays[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlanWithDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all plans for the current user
   */
  const fetchPlans = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      const { data, error: fetchError } = await supabase
        .from('user_workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      // Group by plan
      const planMap = new Map<string, WorkoutPlanWithDays>();
      const rows = data as RawPlanViewRow[];

      for (const row of rows) {
        if (!planMap.has(row.plan_id)) {
          planMap.set(row.plan_id, {
            id: row.plan_id,
            user_id: row.user_id,
            name: row.plan_name,
            description: row.description,
            start_date: row.start_date,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            days: [],
          });
        }

        const plan = planMap.get(row.plan_id)!;

        if (row.day_id && row.day_of_week !== null) {
          plan.days.push({
            id: row.day_id,
            plan_id: row.plan_id,
            day_of_week: row.day_of_week,
            workout_id: row.workout_id,
            muscle_focus: row.muscle_focus,
            workout_style: row.day_workout_style,
            created_at: row.created_at,
            workout: row.workout_id
              ? {
                  id: row.workout_id,
                  name: row.workout_name || '',
                  workout_type: row.workout_type,
                  target_muscles: row.target_muscles,
                  estimated_duration: row.estimated_duration,
                }
              : undefined,
          });
        }
      }

      // Sort days by day_of_week within each plan
      for (const plan of planMap.values()) {
        plan.days.sort((a, b) => a.day_of_week - b.day_of_week);
      }

      const allPlans = Array.from(planMap.values());
      setPlans(allPlans);

      // Find active plan
      const active = allPlans.find((p) => p.is_active);
      setActivePlan(active || null);
    } catch (err) {
      console.error('Error fetching workout plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  /**
   * Create a new plan with days
   */
  const createPlan = useCallback(
    async (input: CreatePlanInput): Promise<WorkoutPlan | null> => {
      if (!user) {
        setError('Not authenticated');
        return null;
      }

      setError(null);

      try {
        const supabase = getSupabase();

        // Create the plan
        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .insert({
            user_id: user.id,
            name: input.name,
            description: input.description,
            start_date: input.start_date,
            is_active: true,
          })
          .select()
          .single();

        if (planError) {
          throw planError;
        }

        // Create the days
        if (input.days.length > 0) {
          const daysToInsert = input.days.map((day) => ({
            plan_id: planData.id,
            day_of_week: day.day_of_week,
            muscle_focus: day.muscle_focus,
            workout_style: day.workout_style,
          }));

          const { error: daysError } = await supabase
            .from('workout_plan_days')
            .insert(daysToInsert);

          if (daysError) {
            throw daysError;
          }
        }

        // Deactivate other plans
        await supabase
          .from('workout_plans')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .neq('id', planData.id);

        // Refresh plans
        await fetchPlans();

        return planData;
      } catch (err) {
        console.error('Error creating plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to create plan');
        return null;
      }
    },
    [user, fetchPlans]
  );

  /**
   * Update a day with a workout ID (after generation)
   */
  const assignWorkoutToDay = useCallback(
    async (dayId: string, workoutId: string): Promise<boolean> => {
      if (!user) {
        setError('Not authenticated');
        return false;
      }

      setError(null);

      try {
        const supabase = getSupabase();

        const { error: updateError } = await supabase
          .from('workout_plan_days')
          .update({ workout_id: workoutId })
          .eq('id', dayId);

        if (updateError) {
          throw updateError;
        }

        // Refresh plans
        await fetchPlans();

        return true;
      } catch (err) {
        console.error('Error assigning workout:', err);
        setError(err instanceof Error ? err.message : 'Failed to assign workout');
        return false;
      }
    },
    [user, fetchPlans]
  );

  /**
   * Set a plan as active
   */
  const setActivePlanById = useCallback(
    async (planId: string): Promise<boolean> => {
      if (!user) {
        setError('Not authenticated');
        return false;
      }

      setError(null);

      try {
        const supabase = getSupabase();

        // Deactivate all plans
        await supabase
          .from('workout_plans')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Activate the selected plan
        const { error: updateError } = await supabase
          .from('workout_plans')
          .update({ is_active: true })
          .eq('id', planId)
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }

        // Refresh plans
        await fetchPlans();

        return true;
      } catch (err) {
        console.error('Error setting active plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to set active plan');
        return false;
      }
    },
    [user, fetchPlans]
  );

  /**
   * Delete a plan
   */
  const deletePlan = useCallback(
    async (planId: string): Promise<boolean> => {
      if (!user) {
        setError('Not authenticated');
        return false;
      }

      setError(null);

      try {
        const supabase = getSupabase();

        const { error: deleteError } = await supabase
          .from('workout_plans')
          .delete()
          .eq('id', planId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw deleteError;
        }

        // Refresh plans
        await fetchPlans();

        return true;
      } catch (err) {
        console.error('Error deleting plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete plan');
        return false;
      }
    },
    [user, fetchPlans]
  );

  /**
   * Get today's workout from the active plan
   */
  const getTodaysWorkout = useCallback(() => {
    if (!activePlan) return null;

    const today = new Date().getDay(); // 0=Sun, 1=Mon...6=Sat
    const todayDay = activePlan.days.find((d) => d.day_of_week === today);

    return todayDay?.workout || null;
  }, [activePlan]);

  return {
    plans,
    activePlan,
    loading,
    error,
    fetchPlans,
    createPlan,
    assignWorkoutToDay,
    setActivePlanById,
    deletePlan,
    getTodaysWorkout,
  };
}

// Day name helpers
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
