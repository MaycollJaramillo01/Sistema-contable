'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth';

const schema = {
  email: '',
  password: ''
};

type LoginForm = typeof schema;

export default function LoginPage() {
  const router = useRouter();
  const { session, signInWithPassword, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<LoginForm>();

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      await signInWithPassword(values.email, values.password);
    } catch (err: any) {
      setError(err.message ?? 'No se pudo iniciar sesión');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body">
          <h3 className="card-title mb-3">Iniciar sesión</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">
                Correo electrónico
              </label>
              <input id="login-email" type="email" className="form-control" {...register('email', { required: true })} />
            </div>
            <div className="mb-3">
              <label htmlFor="login-password" className="form-label">
                Contraseña
              </label>
              <input id="login-password" type="password" className="form-control" {...register('password', { required: true })} />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
          <p className="mt-3 text-center">
            ¿No tienes cuenta? <Link href="/register">Solicitar acceso</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
