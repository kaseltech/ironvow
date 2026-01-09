'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
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
    let appStateListener: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      // Listen for deep links (OAuth callback)
      App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
        const url = event.url;
        console.log('Deep link received:', url);

        // Check if this is an auth callback
        if (url.includes('auth/callback')) {
          try {
            // Close the in-app browser
            await Browser.close();

            // Parse the URL to extract tokens or code
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get('code');
            const accessToken = urlObj.searchParams.get('access_token') ||
                               urlObj.hash?.match(/access_token=([^&]+)/)?.[1];
            const refreshToken = urlObj.searchParams.get('refresh_token') ||
                                urlObj.hash?.match(/refresh_token=([^&]+)/)?.[1];

            console.log('Auth callback - code:', !!code, 'accessToken:', !!accessToken);

            if (code) {
              // PKCE flow - exchange code for session
              console.log('Exchanging code for session...');
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                console.error('Code exchange error:', error);
              } else {
                console.log('Code exchange successful!');
              }
            } else if (accessToken && refreshToken) {
              // Implicit flow - set session directly
              console.log('Setting session with tokens...');
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                console.error('Session error:', error);
              } else {
                console.log('Session set successfully!');
              }
            } else {
              console.log('No code or tokens found in callback URL');
            }
          } catch (err) {
            console.error('Deep link handling error:', err);
          }
        }
      }).then(listener => {
        appUrlListener = () => listener.remove();
      });

      // Also listen for app state changes to recover session after OAuth
      // This is a fallback in case deep linking doesn't work
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          console.log('App became active, checking for session...');
          // Small delay to let any pending auth complete
          setTimeout(async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && !session) {
              console.log('Session recovered after app became active');
              setSession(currentSession);
              setUser(currentSession.user);
            }
          }, 500);
        }
      }).then(listener => {
        appStateListener = () => listener.remove();
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener) appUrlListener();
      if (appStateListener) appStateListener();
    };
  }, [session]);

  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log('signInWithGoogle called - isNative:', isNative, 'platform:', platform);

    if (isNative) {
      try {
        console.log('Starting Google OAuth for native platform...');
        console.log('Redirect URL:', getRedirectUrl());

        // Get the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getRedirectUrl(),
            skipBrowserRedirect: true,
          },
        });

        console.log('Supabase response - data:', !!data, 'error:', error);

        if (error) {
          console.error('Supabase OAuth error:', error);
          throw error;
        }

        if (data?.url) {
          console.log('Opening OAuth URL in browser...');
          console.log('URL:', data.url.substring(0, 100) + '...');

          // Try opening with Browser plugin
          try {
            await Browser.open({ url: data.url });
            console.log('Browser.open() completed');
          } catch (browserErr) {
            console.error('Browser.open() failed:', browserErr);
            // Fallback: try opening URL directly via App plugin
            // This opens in external Safari
            window.open(data.url, '_blank');
          }
        } else {
          console.error('No OAuth URL returned from Supabase');
          throw new Error('Failed to get OAuth URL');
        }
      } catch (err) {
        console.error('Google sign-in error:', err);
        throw err;
      }
    } else {
      // For web, use normal OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
        },
      });
      if (error) throw error;
    }
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
