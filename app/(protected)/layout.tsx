'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth';
import { MainShell } from '@/components/layout/MainShell';

const LoadingFallback = () => (
  <div className="d-flex align-items-center justify-content-center min-vh-100">
    <div className="spinner-border" role="status" aria-live="polite" aria-label="Cargando contenido">
      <span className="visually-hidden">Cargando...</span>
    </div>
  </div>
);

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return <LoadingFallback />;
  }

  return <MainShell>{children}</MainShell>;
}
