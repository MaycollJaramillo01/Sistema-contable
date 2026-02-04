'use client';

import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const accountSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parent_id: z.string().optional()
});

type AccountForm = z.infer<typeof accountSchema>;

const accountTypeLabels: Record<AccountForm['type'], string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto'
};

const fetchAccounts = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('accounts')
    .select('id, code, name, type, parent_id, is_active')
    .eq('organization_id', organizationId)
    .order('code');
  return data ?? [];
};

export default function AccountsPage() {
  const { organizationId } = useAuth();
  const accountsQuery = useQuery({
    queryKey: ['accounts', organizationId],
    queryFn: () => fetchAccounts(organizationId),
    enabled: Boolean(organizationId)
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema)
  });

  const onSubmit = async (values: AccountForm) => {
    if (!organizationId) return;
    await supabaseBrowser.from('accounts').insert([
      {
        organization_id: organizationId,
        code: values.code,
        name: values.name,
        type: values.type,
        parent_id: values.parent_id || null,
        is_active: true
      }
    ]);
    accountsQuery.refetch();
    reset();
  };

  return (
    <section>
      <h2 className="mb-3">Catálogo de cuentas contables</h2>
      <p className="text-muted">Agrega cuentas por tipo y organiza jerárquicamente para análisis contable.</p>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Registrar cuenta</h5>
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
            <div className="col-md-3">
              <label htmlFor="code" className="form-label">
                Código
              </label>
              <input id="code" className="form-control" {...register('code')} aria-invalid={Boolean(errors.code)} />
              {errors.code && <small className="text-danger">{errors.code.message}</small>}
            </div>
            <div className="col-md-4">
              <label htmlFor="name" className="form-label">
                Nombre
              </label>
              <input id="name" className="form-control" {...register('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="text-danger">{errors.name.message}</small>}
            </div>
            <div className="col-md-3">
              <label htmlFor="type" className="form-label">
                Tipo
              </label>
              <select id="type" className="form-select" {...register('type')}>
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="parent_id" className="form-label">
                Padre (opcional)
              </label>
              <input id="parent_id" className="form-control" {...register('parent_id')} />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary" aria-live="polite">
                Guardar cuenta
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Cuentas activas</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Cuenta padre</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {accountsQuery.data?.map((account) => (
                  <tr key={account.id}>
                    <td>{account.code}</td>
                    <td>{account.name}</td>
                    <td>{accountTypeLabels[account.type as AccountForm['type']] ?? account.type}</td>
                    <td>{account.parent_id ?? '—'}</td>
                    <td>{account.is_active ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
                {!accountsQuery.data?.length && (
                  <tr>
                    <td colSpan={5}>No hay cuentas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
