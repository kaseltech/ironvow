'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabase();

      // Check for hash fragment (implicit flow) or code (PKCE flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token');
      const code = queryParams.get('code');

      if (accessToken) {
        // Implicit flow - token is in URL hash
        const refreshToken = hashParams.get('refresh_token');
        if (refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        router.push('/');
      } else if (code) {
        // PKCE flow - exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Auth error:', error);
          router.push('/login?error=auth_failed');
          return;
        }
        router.push('/');
      } else {
        // No auth params, check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/');
        } else {
          router.push('/login');
        }
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F2233] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-light text-[#F5F1EA]">
          <span className="text-[#8A9BAE]">Iron</span>
          <span className="font-semibold text-[#C9A75A]">Vow</span>
        </div>
        <div className="w-8 h-8 border-2 border-[#C9A75A] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8A9BAE] text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
