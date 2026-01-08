export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          gender: 'male' | 'female' | 'other' | null;
          date_of_birth: string | null;
          height_inches: number | null;
          experience_level: 'beginner' | 'intermediate' | 'advanced' | null;
          preferred_units: 'imperial' | 'metric';
          custom_equipment: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          date_of_birth?: string | null;
          height_inches?: number | null;
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
          preferred_units?: 'imperial' | 'metric';
          custom_equipment?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          date_of_birth?: string | null;
          height_inches?: number | null;
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
          preferred_units?: 'imperial' | 'metric';
          custom_equipment?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      weight_goals: {
        Row: {
          id: string;
          user_id: string | null;
          goal_type: 'cut' | 'bulk' | 'maintain' | 'recomp' | null;
          start_weight: number | null;
          target_weight: number | null;
          started_at: string | null;
          target_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          goal_type?: 'cut' | 'bulk' | 'maintain' | 'recomp' | null;
          start_weight?: number | null;
          target_weight?: number | null;
          started_at?: string | null;
          target_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          goal_type?: 'cut' | 'bulk' | 'maintain' | 'recomp' | null;
          start_weight?: number | null;
          target_weight?: number | null;
          started_at?: string | null;
          target_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string | null;
          weight: number;
          logged_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          weight: number;
          logged_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          weight?: number;
          logged_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      injuries: {
        Row: {
          id: string;
          user_id: string | null;
          body_part: string;
          description: string | null;
          severity: 'minor' | 'moderate' | 'severe' | null;
          movements_to_avoid: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          body_part: string;
          description?: string | null;
          severity?: 'minor' | 'moderate' | 'severe' | null;
          movements_to_avoid?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          body_part?: string;
          description?: string | null;
          severity?: 'minor' | 'moderate' | 'severe' | null;
          movements_to_avoid?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          icon_name: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          icon_name?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          icon_name?: string | null;
        };
      };
      user_equipment: {
        Row: {
          user_id: string;
          equipment_id: string;
          location: 'home' | 'gym';
          notes: string | null;
        };
        Insert: {
          user_id: string;
          equipment_id: string;
          location?: 'home' | 'gym';
          notes?: string | null;
        };
        Update: {
          user_id?: string;
          equipment_id?: string;
          location?: 'home' | 'gym';
          notes?: string | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          instructions: string[] | null;
          primary_muscles: string[];
          secondary_muscles: string[] | null;
          equipment_required: string[] | null;
          movement_pattern: string | null;
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
          is_compound: boolean;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          instructions?: string[] | null;
          primary_muscles: string[];
          secondary_muscles?: string[] | null;
          equipment_required?: string[] | null;
          movement_pattern?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
          is_compound?: boolean;
          video_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          instructions?: string[] | null;
          primary_muscles?: string[];
          secondary_muscles?: string[] | null;
          equipment_required?: string[] | null;
          movement_pattern?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
          is_compound?: boolean;
          video_url?: string | null;
          created_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          workout_type: string | null;
          target_muscles: string[] | null;
          estimated_duration: number | null;
          is_ai_generated: boolean;
          is_saved: boolean;
          ai_prompt_context: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          workout_type?: string | null;
          target_muscles?: string[] | null;
          estimated_duration?: number | null;
          is_ai_generated?: boolean;
          is_saved?: boolean;
          ai_prompt_context?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          workout_type?: string | null;
          target_muscles?: string[] | null;
          estimated_duration?: number | null;
          is_ai_generated?: boolean;
          is_saved?: boolean;
          ai_prompt_context?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string | null;
          exercise_id: string | null;
          order_index: number;
          target_sets: number;
          target_reps: number;
          target_weight: number | null;
          rest_seconds: number;
          notes: string | null;
          is_superset_with: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id?: string | null;
          exercise_id?: string | null;
          order_index: number;
          target_sets?: number;
          target_reps?: number;
          target_weight?: number | null;
          rest_seconds?: number;
          notes?: string | null;
          is_superset_with?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string | null;
          exercise_id?: string | null;
          order_index?: number;
          target_sets?: number;
          target_reps?: number;
          target_weight?: number | null;
          rest_seconds?: number;
          notes?: string | null;
          is_superset_with?: string | null;
          created_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          workout_id: string | null;
          name: string;
          location: 'home' | 'gym' | 'travel' | 'outdoor' | null;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
          rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          workout_id?: string | null;
          name: string;
          location?: 'home' | 'gym' | 'travel' | 'outdoor' | null;
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          rating?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          workout_id?: string | null;
          name?: string;
          location?: 'home' | 'gym' | 'travel' | 'outdoor' | null;
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          rating?: number | null;
          created_at?: string;
        };
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string | null;
          exercise_id: string | null;
          set_number: number;
          set_type: 'warmup' | 'working' | 'dropset' | 'failure';
          weight: number | null;
          reps: number | null;
          target_weight: number | null;
          target_reps: number | null;
          rpe: number | null;
          rest_seconds: number | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          exercise_id?: string | null;
          set_number: number;
          set_type?: 'warmup' | 'working' | 'dropset' | 'failure';
          weight?: number | null;
          reps?: number | null;
          target_weight?: number | null;
          target_reps?: number | null;
          rpe?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          exercise_id?: string | null;
          set_number?: number;
          set_type?: 'warmup' | 'working' | 'dropset' | 'failure';
          weight?: number | null;
          reps?: number | null;
          target_weight?: number | null;
          target_reps?: number | null;
          rpe?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
          logged_at?: string;
        };
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string | null;
          exercise_id: string | null;
          record_type: '1rm' | '3rm' | '5rm' | '10rm' | 'max_reps' | 'max_weight';
          weight: number | null;
          reps: number | null;
          estimated_1rm: number | null;
          achieved_at: string;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          exercise_id?: string | null;
          record_type: '1rm' | '3rm' | '5rm' | '10rm' | 'max_reps' | 'max_weight';
          weight?: number | null;
          reps?: number | null;
          estimated_1rm?: number | null;
          achieved_at?: string;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          exercise_id?: string | null;
          record_type?: '1rm' | '3rm' | '5rm' | '10rm' | 'max_reps' | 'max_weight';
          weight?: number | null;
          reps?: number | null;
          estimated_1rm?: number | null;
          achieved_at?: string;
          session_id?: string | null;
          created_at?: string;
        };
      };
      muscle_strength: {
        Row: {
          id: string;
          user_id: string | null;
          muscle_group: string;
          strength_score: number | null;
          trend: 'improving' | 'maintaining' | 'declining' | null;
          last_trained: string | null;
          total_volume_30d: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          muscle_group: string;
          strength_score?: number | null;
          trend?: 'improving' | 'maintaining' | 'declining' | null;
          last_trained?: string | null;
          total_volume_30d?: number | null;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          muscle_group?: string;
          strength_score?: number | null;
          trend?: 'improving' | 'maintaining' | 'declining' | null;
          last_trained?: string | null;
          total_volume_30d?: number | null;
          calculated_at?: string;
        };
      };
      equipment_presets: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          equipment_names: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string;
          equipment_names: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          equipment_names?: string[];
          created_at?: string;
        };
      };
      gym_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          gym_type: 'commercial' | 'crossfit' | 'powerlifting' | 'hotel' | 'custom';
          equipment_ids: string[];
          custom_equipment: string[];
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          gym_type?: 'commercial' | 'crossfit' | 'powerlifting' | 'hotel' | 'custom';
          equipment_ids?: string[];
          custom_equipment?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          gym_type?: 'commercial' | 'crossfit' | 'powerlifting' | 'hotel' | 'custom';
          equipment_ids?: string[];
          custom_equipment?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      calculate_1rm: {
        Args: { weight: number; reps: number };
        Returns: number;
      };
    };
    Enums: {};
  };
};

// Helper types for common use cases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type SetLog = Database['public']['Tables']['set_logs']['Row'];
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row'];
export type WeightLog = Database['public']['Tables']['weight_logs']['Row'];
export type WeightGoal = Database['public']['Tables']['weight_goals']['Row'];
export type Injury = Database['public']['Tables']['injuries']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type MuscleStrength = Database['public']['Tables']['muscle_strength']['Row'];
export type EquipmentPreset = Database['public']['Tables']['equipment_presets']['Row'];
export type GymProfile = Database['public']['Tables']['gym_profiles']['Row'];

// Exercise with joined data
export type ExerciseWithDetails = Exercise & {
  workout_exercise?: WorkoutExercise;
  recent_sets?: SetLog[];
  personal_record?: PersonalRecord;
};

// Workout with all exercises
export type WorkoutWithExercises = Workout & {
  exercises: (WorkoutExercise & { exercise: Exercise })[];
};

// Session with all logged sets
export type SessionWithSets = WorkoutSession & {
  sets: (SetLog & { exercise: Exercise })[];
};
