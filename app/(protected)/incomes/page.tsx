'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const incomeSchema = z.object({
  income_date: z.string(),
  source: z.string().min(3),
  amount: z.number().min(0.01),
  description: z.string().optional()
});

type IncomeForm = z.infer<typeof incomeSchema>;

const fetchIncomes = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('incomes')
    .select('id, income_date, source, amount')
    .eq('organization_id', organizationId)
    .order('income_date', { ascending: false })
    .limit(20);
  return data ?? [];
};

export default function IncomesPage() {
  const { organizationId } = useAuth();
  const incomesQuery = useQuery({
    queryKey: ['incomes', organizationId],
    queryFn: () => fetchIncomes(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (data: IncomeForm) => {
      if (!organizationId) return;
      await supabaseBrowser.from('incomes').insert([
        {
          organization_id: organizationId,
          income_date: data.income_date,
          source: data.source,
          amount: data.amount,
          description: data.description || null
        }
      ]);
    },
    onSuccess: () => incomesQuery.refetch()
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { income_date: new Date().toISOString().slice(0, 10), amount: 0 }
  });

  const onSubmit = (values: IncomeForm) => {
    mutation.mutate(values);
    reset({ amount: 0, income_date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <section>
      <h2 className="mb-3">Ingresos</h2>
      <p className="text-muted">Registra ingresos operativos, donaciones y convenios con proyectos asociados.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Nuevo ingreso</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="income_date" className="form-label">
                    Fecha de ingreso
                  </label>
                  <input id="income_date" type="date" className="form-control" {...register('income_date')} />
                  {errors.income_date && <small className="text-danger">{errors.income_date.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="income-source" className="form-label">
                    Fuente/proyecto
                  </label>
                  <input id="income-source" className="form-control" {...register('source')} />
                  {errors.source && <small className="text-danger">{errors.source.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="income-amount" className="form-label">
                    Monto
                  </label>
                  <input id="income-amount" type="number" step="0.01" className="form-control" {...register('amount', { valueAsNumber: true })} />
                  {errors.amount && <small className="text-danger">{errors.amount.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="income-description" className="form-label">
                    Descripción
                  </label>
                  <textarea id="income-description" className="form-control" rows={3} {...register('description')} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Guardando ingreso...' : 'Registrar ingreso'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Movimientos recientes</h5>
              <ul className="list-group">
                {incomesQuery.data?.map((income) => (
                  <li key={income.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{income.source}</strong>
                      <div className="text-muted">{income.income_date}</div>
                    </div>
                    <span>{income.amount?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                  </li>
                ))}
                {!incomesQuery.isLoading && !incomesQuery.data?.length && <li className="list-group-item">Sin ingresos registrados.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
