'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabase();

      // Get the hash from URL (Supabase puts tokens there)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        setStatus('Setting up session...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          setStatus('Error: ' + error.message);
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        setStatus('Success! Redirecting...');
        router.push('/');
        return;
      }

      // Check for error in query params
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        console.error('Auth error:', error, errorDescription);
        // If already have a session, ignore the error and proceed
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/');
          return;
        }
        setStatus('Error: ' + (errorDescription || error));
        setTimeout(() => router.push('/login?error=auth_failed'), 2000);
        return;
      }

      // Check for code in query params (PKCE flow)
      const code = urlParams.get('code');

      if (code) {
        setStatus('Exchanging code...');
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);

        if (codeError) {
          console.error('Code exchange error:', codeError);
          // Check if we have a session anyway (code might have been used already)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.push('/');
            return;
          }
          setStatus('Error: ' + codeError.message);
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        setStatus('Success! Redirecting...');
        router.push('/');
        return;
      }

      // No auth params - check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      } else {
        setStatus('No auth data found');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#282828] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-light text-[#F5F1EA]">
          <span className="text-[#8A9BAE]">Iron</span>
          <span className="font-semibold text-[#C9A75A]">Vow</span>
        </div>
        <div className="w-8 h-8 border-2 border-[#C9A75A] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8A9BAE] text-sm">{status}</p>
      </div>
    </div>
  );
}
