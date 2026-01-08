'use client';

import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function LoginContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check for auth errors in URL
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google');
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F2233] flex items-center justify-center">
        <div className="text-[#C9A75A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F2233] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light tracking-wide text-[#F5F1EA]">
          <span className="text-[#8A9BAE]">Iron</span>
          <span className="font-semibold text-[#C9A75A]">Vow</span>
        </h1>
        <p className="mt-2 text-[#8A9BAE] text-sm">AI-Powered Workouts</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="bg-[#1A2B3C] rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-medium text-[#F5F1EA] text-center mb-6">
            Get Started
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

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
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-xs text-[#8A9BAE] text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[#4A5568] text-xs">
        Part of the Vow Suite
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F2233] flex items-center justify-center">
          <div className="text-[#C9A75A]">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
