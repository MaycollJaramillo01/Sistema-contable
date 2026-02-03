'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().min(3),
  location: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

export default function SelectOrgPage() {
  const supabase = createClient();
  const { setOrgId, userId } = useSession();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const loadOrgs = async () => {
    const { data } = await supabase.from('orgs').select('id,name').order('name');
    setOrgs(data ?? []);
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const onSubmit = async (values: FormValues) => {
    const { data, error } = await supabase
      .from('orgs')
      .insert({ name: values.name, location: values.location })
      .select('id')
      .single();
    if (error || !data) return;
    if (userId) {
      await supabase.from('org_members').insert({ org_id: data.id, user_id: userId, role: 'admin' });
    }
    setOrgId(data.id);
    window.location.href = '/app/dashboard';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Selecciona una organización</h1>
        <p className="text-sm text-slate-600">Tus datos se filtran por organización.</p>
      </div>
      <div className="grid gap-3">
        {orgs.map((org) => (
          <Button key={org.id} variant="outline" onClick={() => setOrgId(org.id)}>
            {org.name}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Crear nueva organización</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Ubicación</label>
            <Input {...register('location')} />
            {errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            Crear
          </Button>
        </form>
      </div>
    </div>
  );
}
