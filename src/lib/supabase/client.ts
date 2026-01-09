import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to check if we're in a native platform at runtime
const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Custom storage adapter that works on both native and web
// Checks platform at runtime (not module load time)
const hybridStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    // Web fallback
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isNativePlatform()) {
      await Preferences.set({ key, value });
    } else if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
    } else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

// Create Supabase client with hybrid storage for native + web support
const supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: hybridStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined' && !isNativePlatform(),
  },
});

export function getSupabase() {
  return supabaseInstance;
}

// For backwards compatibility
export function createBrowserSupabaseClient() {
  return supabaseInstance;
}
