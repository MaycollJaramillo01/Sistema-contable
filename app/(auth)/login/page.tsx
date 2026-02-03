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
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: values.email.trim().toLowerCase(),
      password: values.password
    });
    if (authError) setError(authError.message);
    if (!authError) window.location.href = '/app/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Iniciar sesion</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="correo@ejemplo.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Contrasena</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
          Entrar
        </Button>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot" className="text-brand-600">
            Olvidaste tu contrasena?
          </Link>
          <Link href="/register" className="text-brand-600">
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
