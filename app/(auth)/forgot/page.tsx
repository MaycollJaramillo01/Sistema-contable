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
  email: z.string().email()
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPage() {
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/login`
    });
    setMessage(error ? error.message : 'Revisa tu correo para recuperar la contraseña.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Recuperar contraseña</h1>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
          Enviar
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
