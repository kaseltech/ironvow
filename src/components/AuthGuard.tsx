'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F2233] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-light text-[#F5F1EA]">
            <span className="text-[#8A9BAE]">Iron</span>
            <span className="font-semibold text-[#C9A75A]">Vow</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#C9A75A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
