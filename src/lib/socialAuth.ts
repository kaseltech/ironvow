import { SocialLogin } from '@capgo/capacitor-social-login';
import type { GoogleLoginResponseOnline, AppleProviderResponse } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import { getSupabase } from './supabase/client';

// Google OAuth Client IDs - configured in Google Cloud Console
const GOOGLE_IOS_CLIENT_ID = '1039847442476-4m3ni3eknfp2pi049729ujirluocgu0b.apps.googleusercontent.com';
// Web client ID is used as the token audience for Supabase validation
const GOOGLE_WEB_CLIENT_ID = '1039847442476-2gsvh9bi3jad5j6p540m2g2rp3rpu9vv.apps.googleusercontent.com';

export async function initializeSocialLogin() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Social login: Web platform - using Supabase OAuth');
    return;
  }

  try {
    // Initialize social login providers
    await SocialLogin.initialize({
      apple: {
        clientId: 'com.ironvow.app',
      },
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iOSClientId: GOOGLE_IOS_CLIENT_ID,
        iOSServerClientId: GOOGLE_WEB_CLIENT_ID, // Token audience for Supabase
        mode: 'online',
      },
    });

    console.log('Social login initialized');
  } catch (error) {
    console.error('Failed to initialize social login:', error);
  }
}

export async function signInWithApple(): Promise<{ error?: string }> {
  const supabase = getSupabase();

  if (!Capacitor.isNativePlatform()) {
    // Web fallback - use Supabase OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error?.message };
  }

  try {
    const result = await SocialLogin.login({
      provider: 'apple',
      options: {
        scopes: ['email', 'name'],
      },
    });

    const appleResult = result.result as AppleProviderResponse;

    if (!appleResult || !appleResult.idToken) {
      return { error: 'Apple sign in failed - no token received' };
    }

    console.log('Apple ID token received, signing in to Supabase...');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: appleResult.idToken,
    });

    if (error) {
      console.error('Supabase Apple sign in error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Apple sign in error:', error);
    return { error: error instanceof Error ? error.message : 'Apple sign in failed' };
  }
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = getSupabase();

  if (!Capacitor.isNativePlatform()) {
    // Web fallback - use Supabase OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error?.message };
  }

  try {
    console.log('Starting native Google sign-in...');

    // Add timeout to prevent hanging forever
    const loginPromise = SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile'],
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Google sign in timed out')), 30000)
    );

    const result = await Promise.race([loginPromise, timeoutPromise]);

    const googleResult = result.result as GoogleLoginResponseOnline;

    console.log('Google result:', JSON.stringify(googleResult, null, 2));

    if (!googleResult || !googleResult.idToken) {
      return { error: 'Google sign in failed - no token received' };
    }

    // Decode the JWT to check the audience (for debugging)
    try {
      const payload = JSON.parse(atob(googleResult.idToken.split('.')[1]));
      console.log('Google ID token audience:', payload.aud);
      console.log('Expected Web Client ID:', GOOGLE_WEB_CLIENT_ID);
    } catch (e) {
      console.log('Could not decode token for debugging');
    }

    // Sign in to Supabase with the Google ID token
    // Note: "Skip nonce check" must be enabled in Supabase for iOS
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleResult.idToken,
    });

    if (error) {
      console.error('Supabase Google sign in error:', error);
      return { error: error.message };
    }

    // Debug: Log the user info
    console.log('Supabase auth success!');
    console.log('User ID:', data.user?.id);
    console.log('User email:', data.user?.email);
    console.log('Created at:', data.user?.created_at);
    console.log('Last sign in:', data.user?.last_sign_in_at);

    return {};
  } catch (error) {
    console.error('Google sign in error:', error);
    return { error: error instanceof Error ? error.message : 'Google sign in failed' };
  }
}

export function isSocialLoginAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function logoutFromSocialProviders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SocialLogin.logout({ provider: 'google' });
    console.log('Logged out from Google');
  } catch (e) {
    // Ignore - user might not have been logged in with Google
  }

  try {
    await SocialLogin.logout({ provider: 'apple' });
    console.log('Logged out from Apple');
  } catch (e) {
    // Ignore - user might not have been logged in with Apple
  }
}
