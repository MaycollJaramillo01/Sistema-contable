'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type {
  Session,
  User
} from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
};

export type AuthRole = 'ADMIN' | 'CONTADOR' | 'TESORERO' | 'AUDITOR' | 'LECTOR' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AuthRole;
  organizationId: string | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, organizationName: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRole(null);
      setOrganizationId(null);
      return;
    }

    const { data: profileData } = await supabaseBrowser
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    const { data: roleData } = await supabaseBrowser
      .from('user_roles')
      .select('role_id, organization_id')
      .eq('user_id', currentUser.id)
      .limit(1)
      .single();

    if (profileData) {
      setProfile({
        id: profileData.id,
        organization_id: profileData.organization_id,
        full_name: profileData.full_name,
        email: profileData.email
      });
      setOrganizationId(profileData.organization_id);
    }

    if (roleData) {
      const mapping: Record<number, AuthRole> = {
        1: 'ADMIN',
        2: 'CONTADOR',
        3: 'TESORERO',
        4: 'AUDITOR',
        5: 'LECTOR'
      };
      setRole(mapping[roleData.role_id] ?? null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      refreshProfile(data.session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      refreshProfile(currentSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      throw error;
    }
  };

  const signUpWithPassword = async (email: string, password: string, organizationName: string, fullName: string) => {
    setLoading(true);
    const { data, error } = await supabaseBrowser.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      throw error;
    }

    const { data: createdOrg } = await supabaseBrowser
      .from('organizations')
      .insert([{ name: organizationName }])
      .select('id')
      .single();

    const organization_id = createdOrg?.id;

    if (data?.user && organization_id) {
      await supabaseBrowser.from('profiles').insert([
        {
          id: data.user.id,
          organization_id,
          full_name: fullName,
          email
        }
      ]);

      await supabaseBrowser.from('user_roles').insert([
        {
          user_id: data.user.id,
          role_id: 1,
          organization_id
        }
      ]);
    }
  };

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      organizationId,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut
    }),
    [session, user, profile, role, organizationId, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
