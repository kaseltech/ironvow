'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { getSupabase } from '@/lib/supabase/client';

// Get the correct redirect URL based on platform
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return 'com.ironvow.app://auth/callback';
  }
  return 'https://ironvow.app/auth/callback';
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Handle deep links for OAuth callback on native platforms
    let appUrlListener: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
        const url = event.url;

        // Check if this is an auth callback
        if (url.includes('auth/callback')) {
          try {
            // Parse the URL to extract tokens or code
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get('code');
            const accessToken = urlObj.searchParams.get('access_token') ||
                               urlObj.hash?.match(/access_token=([^&]+)/)?.[1];
            const refreshToken = urlObj.searchParams.get('refresh_token') ||
                                urlObj.hash?.match(/refresh_token=([^&]+)/)?.[1];

            if (code) {
              // PKCE flow - exchange code for session
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) console.error('Code exchange error:', error);
            } else if (accessToken && refreshToken) {
              // Implicit flow - set session directly
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) console.error('Session error:', error);
            }
          } catch (err) {
            console.error('Deep link handling error:', err);
          }
        }
      }).then(listener => {
        appUrlListener = () => listener.remove();
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener) appUrlListener();
    };
  }, []);

  const signInWithGoogle = async () => {
    const supabase = getSupabase();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const supabase = getSupabase();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
