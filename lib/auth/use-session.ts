'use client';

import { useSessionContext } from '@/lib/auth/org-context';

export function useSession() {
  return useSessionContext();
}
