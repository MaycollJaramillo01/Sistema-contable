'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const email = values.email.trim().toLowerCase();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: values.password
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: values.name.trim(), email });
    }
    setSuccess('Cuenta creada. Revisa tu correo para confirmar.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Contrasena</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
          Registrar
        </Button>
        <div className="mt-4 text-sm">
          <Link href="/login" className="text-brand-600">
            Volver a login
          </Link>
        </div>
      </form>
    </div>
  );
}
