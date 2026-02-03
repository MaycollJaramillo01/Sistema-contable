'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/lib/auth/roles';

export type SessionState = {
  userId: string | null;
  orgId: string | null;
  role: Role | null;
  loading: boolean;
  setOrgId: (orgId: string | null) => void;
};

export const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgIdState] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const setOrgId = (nextOrgId: string | null) => {
    setOrgIdState(nextOrgId);
    if (typeof window !== 'undefined') {
      if (nextOrgId) {
        localStorage.setItem('org_id', nextOrgId);
        document.cookie = `org_id=${nextOrgId}; path=/`;
      } else {
        localStorage.removeItem('org_id');
        document.cookie = 'org_id=; Max-Age=0; path=/';
      }
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      const storedOrg = typeof window !== 'undefined' ? localStorage.getItem('org_id') : null;
      if (uid && storedOrg) {
        setOrgIdState(storedOrg);
        const { data: member } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', storedOrg)
          .eq('user_id', uid)
          .maybeSingle();
        setRole(member?.role ?? null);
      }
      setLoading(false);
    };
    bootstrap();
  }, [supabase]);

  const value = useMemo(
    () => ({ userId, orgId, role, loading, setOrgId }),
    [userId, orgId, role, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('SessionContext missing');
  }
  return ctx;
}
