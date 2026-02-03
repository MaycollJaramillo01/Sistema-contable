'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const supabase = createClient();
  const { orgId, setOrgId } = useSession();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('orgs').select('id,name').order('name');
      setOrgs(data ?? []);
    };
    load();
  }, [supabase]);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-600">Organización</label>
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          value={orgId ?? ''}
          onChange={(e) => setOrgId(e.target.value || null)}
        >
          <option value="">Selecciona</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          Notificaciones
        </Button>
        <Button variant="ghost" size="sm">
          Perfil
        </Button>
      </div>
    </header>
  );
}
