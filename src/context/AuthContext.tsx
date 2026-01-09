'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { getSupabase } from '@/lib/supabase/client';

// Helper to generate PKCE code verifier and challenge
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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

            // Parse the URL to extract tokens
            // For implicit flow, tokens come in the URL fragment (after #)
            // URL format: com.ironvow.app://auth/callback#access_token=xxx&refresh_token=xxx&...
            const hashIndex = url.indexOf('#');
            const queryIndex = url.indexOf('?');

            let params: Record<string, string> = {};

            // Parse hash fragment (implicit flow)
            if (hashIndex !== -1) {
              const hashString = url.substring(hashIndex + 1);
              const hashParams = new URLSearchParams(hashString);
              hashParams.forEach((value, key) => {
                params[key] = value;
              });
            }

            // Also parse query params (PKCE flow fallback)
            if (queryIndex !== -1) {
              const queryEnd = hashIndex !== -1 ? hashIndex : url.length;
              const queryString = url.substring(queryIndex + 1, queryEnd);
              const queryParams = new URLSearchParams(queryString);
              queryParams.forEach((value, key) => {
                if (!params[key]) params[key] = value;
              });
            }

            const accessToken = params['access_token'];
            const refreshToken = params['refresh_token'];
            const code = params['code'];

            console.log('Auth callback - code:', !!code, 'accessToken:', !!accessToken, 'refreshToken:', !!refreshToken);

            if (accessToken && refreshToken) {
              // Implicit flow - set session directly with tokens
              console.log('Setting session with tokens (implicit flow)...');
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                console.error('Session error:', error);
              } else {
                console.log('Session set successfully!');
              }
            } else if (code) {
              // PKCE flow - exchange code for session using stored code verifier
              console.log('Exchanging code for session (PKCE flow)...');

              // Retrieve our stored code verifier
              const { value: codeVerifier } = await Preferences.get({ key: 'oauth_code_verifier' });
              console.log('Retrieved code verifier:', !!codeVerifier);

              if (codeVerifier) {
                // Manually exchange code for tokens using the Supabase API
                const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                  },
                  body: JSON.stringify({
                    auth_code: code,
                    code_verifier: codeVerifier,
                  }),
                });

                const tokenData = await response.json();
                console.log('Token exchange response:', response.status);

                if (tokenData.access_token && tokenData.refresh_token) {
                  const { error } = await supabase.auth.setSession({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                  });
                  if (error) {
                    console.error('Session error:', error);
                  } else {
                    console.log('Session set successfully!');
                  }
                } else {
                  console.error('Token exchange failed:', tokenData);
                }

                // Clean up stored verifier
                await Preferences.remove({ key: 'oauth_code_verifier' });
              } else {
                console.error('No code verifier found in storage');
              }
            } else {
              console.log('No tokens or code found in callback URL');
              console.log('URL params:', params);
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

        // Generate our own PKCE code verifier and challenge
        // We store it in Capacitor Preferences so it survives the browser redirect
        // (Safari web view storage is separate from native app storage)
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        console.log('Generated PKCE - verifier length:', codeVerifier.length);

        // Store code verifier for later use when exchanging the code
        await Preferences.set({ key: 'oauth_code_verifier', value: codeVerifier });
        console.log('Stored code verifier in Preferences');

        // Build the OAuth URL manually with our PKCE challenge
        const redirectUrl = getRedirectUrl();
        const authUrl = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize`);
        authUrl.searchParams.set('provider', 'google');
        authUrl.searchParams.set('redirect_to', redirectUrl);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        const finalUrl = authUrl.toString();
        console.log('Opening OAuth URL:', finalUrl.substring(0, 100) + '...');

        await Browser.open({ url: finalUrl });
        console.log('Browser.open() completed');
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
