'use client';

import { ReactNode } from 'react';
import { useSession } from '@/lib/auth/use-session';
import { can, type PermissionKey } from '@/lib/auth/roles';

export function Guard({ permission, fallback, children }: { permission: PermissionKey; fallback?: ReactNode; children: ReactNode }) {
  const { role } = useSession();
  if (!role) return fallback ?? null;
  if (!can(role, permission)) return fallback ?? null;
  return <>{children}</>;
}
