'use client';

import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

function LoginContent() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
      setSigningIn(false);
    }
  }, [searchParams]);

  // Reset signing state when app returns to foreground (user cancelled OAuth)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && signingIn) {
        // Give a moment for auth to complete, then reset if still signing in
        setTimeout(() => {
          setSigningIn(false);
        }, 1000);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [signingIn]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      console.log('Initiating Google sign-in...');
      await signInWithGoogle();
      console.log('signInWithGoogle completed');
      // On native, browser is now open - state will reset when app returns
      // On web, page will redirect
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      setError(err?.message || 'Failed to sign in with Google');
      setSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSigningIn(true);
      setError(null);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError('Check your email for a confirmation link!');
        setSigningIn(false);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#282828] flex items-center justify-center">
        <div className="text-[#C9A75A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#282828] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="IronVow"
            width={80}
            height={80}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-4xl font-light tracking-wide text-[#F5F1EA]">
          <span className="text-[#8A9BAE]">Iron</span>
          <span className="font-semibold text-[#C9A75A]">Vow</span>
        </h1>
        <p className="mt-2 text-[#8A9BAE] text-sm">AI-Powered Workouts</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="bg-[#1F1F1F] rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-medium text-[#F5F1EA] text-center mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
              error.includes('Check your email')
                ? 'bg-green-900/30 border border-green-500/50 text-green-300'
                : 'bg-red-900/30 border border-red-500/50 text-red-300'
            }`}>
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-xl text-[#F5F1EA] placeholder-[#8A9BAE] focus:outline-none focus:border-[#C9A75A] transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-xl text-[#F5F1EA] placeholder-[#8A9BAE] focus:outline-none focus:border-[#C9A75A] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-3 bg-[#C9A75A] hover:bg-[#B8964A] text-[#1F1F1F] font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full text-sm text-[#8A9BAE] hover:text-[#C9A75A] transition-colors mb-4"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#444444]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1F1F1F] text-[#8A9BAE]">or</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="mt-6 text-xs text-[#8A9BAE] text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[#4A5568] text-xs">
        Part of the{' '}
        <Link href="/vow-suite" className="text-[#8A9BAE] hover:text-[#C9A75A] underline transition-colors">
          Vow Suite
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#282828] flex items-center justify-center">
          <div className="text-[#C9A75A]">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
