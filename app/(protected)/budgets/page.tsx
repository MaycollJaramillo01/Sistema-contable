'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const budgetSchema = z.object({
  year: z.number().min(2023).max(2040),
  month: z.number().min(1).max(12),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(3),
  planned_amount: z.number().min(0)
});

type BudgetForm = z.infer<typeof budgetSchema>;

const fetchBudgets = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('budget_lines')
    .select('id, year, month, type, category, planned_amount')
    .eq('organization_id', organizationId)
    .order('year', { ascending: false })
    .limit(30);
  return data ?? [];
};

export default function BudgetsPage() {
  const { organizationId } = useAuth();
  const budgetsQuery = useQuery({
    queryKey: ['budgets', organizationId],
    queryFn: () => fetchBudgets(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (values: BudgetForm) => {
      if (!organizationId) return;
      const { data: budgets } = await supabaseBrowser
        .from('budgets')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)
        .single();
      const budgetId = budgets?.id;
      if (!budgetId) {
        const { data: created } = await supabaseBrowser.from('budgets').insert([
          {
            organization_id: organizationId,
            year: values.year,
            month: values.month,
            status: 'DRAFT',
            created_by: null
          }
        ]).select('id').single();
        const createdId = created?.id;
        if (createdId) {
          await supabaseBrowser.from('budget_lines').insert([
            {
              organization_id: organizationId,
              budget_id: createdId,
              type: values.type,
              category: values.category,
              project_id: null,
              planned_amount: values.planned_amount
            }
          ]);
        }
      } else {
        await supabaseBrowser.from('budget_lines').insert([
          {
            organization_id: organizationId,
            budget_id: budgetId,
            type: values.type,
            category: values.category,
            project_id: null,
            planned_amount: values.planned_amount
          }
        ]);
      }
    },
    onSuccess: () => budgetsQuery.refetch()
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, type: 'INCOME', category: '', planned_amount: 0 }
  });

  const onSubmit = (values: BudgetForm) => {
    mutation.mutate(values);
    reset({ category: '', planned_amount: 0 });
  };

  return (
    <section>
      <h2 className="mb-3">Presupuesto mensual</h2>
      <p className="text-muted">Compara plan vs real y mantiene alertas si los gastos exceden los límites aprobados.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Línea presupuestal</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="year" className="form-label">
                    Año
                  </label>
                  <input id="year" type="number" className="form-control" {...register('year', { valueAsNumber: true })} />
                </div>
                <div className="mb-3">
                  <label htmlFor="month" className="form-label">
                    Mes
                  </label>
                  <input id="month" type="number" className="form-control" {...register('month', { valueAsNumber: true })} />
                </div>
                <div className="mb-3">
                  <label htmlFor="type" className="form-label">
                    Tipo
                  </label>
                  <select id="type" className="form-select" {...register('type')}>
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Gasto</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    Categoría
                  </label>
                  <input id="category" className="form-control" {...register('category')} />
                  {errors.category && <small className="text-danger">{errors.category.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="planned_amount" className="form-label">
                    Planificado
                  </label>
                  <input id="planned_amount" type="number" step="0.01" className="form-control" {...register('planned_amount', { valueAsNumber: true })} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Guardando...' : 'Agregar línea'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Presupuestos cargados</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>Mes</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Planificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetsQuery.data?.map((budget) => (
                      <tr key={budget.id}>
                        <td>{budget.year}</td>
                        <td>{budget.month}</td>
                        <td>{budget.type}</td>
                        <td>{budget.category}</td>
                        <td>{budget.planned_amount?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                      </tr>
                    ))}
                    {!budgetsQuery.isLoading && !budgetsQuery.data?.length && (
                      <tr>
                        <td colSpan={5}>Sin líneas presupuestales.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
