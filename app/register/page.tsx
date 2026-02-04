'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth';

const registerSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  organization: z.string().min(3)
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { signUpWithPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const router = useRouter();

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    try {
      await signUpWithPassword(values.email, values.password, values.organization, values.full_name);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError(err.message ?? 'No se pudo registrar');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow" style={{ width: 420 }}>
        <div className="card-body">
          <h3 className="card-title mb-3">Registro inicial</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">Cuenta creada. Redirigiendo...</div>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label htmlFor="full_name" className="form-label">
                Nombre completo
              </label>
              <input id="full_name" className="form-control" {...register('full_name')} />
              {errors.full_name && <small className="text-danger">{errors.full_name.message}</small>}
            </div>
            <div className="mb-3">
              <label htmlFor="organization" className="form-label">
                Asociación / Organización
              </label>
              <input id="organization" className="form-control" {...register('organization')} />
              {errors.organization && <small className="text-danger">{errors.organization.message}</small>}
            </div>
            <div className="mb-3">
              <label htmlFor="register-email" className="form-label">
                Correo electrónico
              </label>
              <input id="register-email" type="email" className="form-control" {...register('email')} />
              {errors.email && <small className="text-danger">{errors.email.message}</small>}
            </div>
            <div className="mb-3">
              <label htmlFor="register-password" className="form-label">
                Contraseña
              </label>
              <input id="register-password" type="password" className="form-control" {...register('password')} />
              {errors.password && <small className="text-danger">{errors.password.message}</small>}
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Registrarse
            </button>
            <p className="mt-3 text-center">
              ¿Ya tienes cuenta? <Link href="/login">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
