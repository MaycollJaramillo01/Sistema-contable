'use client';

import { Badge } from 'reactstrap';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const expenseSchema = z.object({
  expense_date: z.string(),
  category: z.string().min(3),
  amount: z.number().min(0.01),
  description: z.string().optional(),
  requires_approval: z.boolean()
});

type ExpenseForm = z.infer<typeof expenseSchema>;

const fetchExpenses = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('expenses')
    .select('id, expense_date, category, amount, requires_approval')
    .eq('organization_id', organizationId)
    .order('expense_date', { ascending: false })
    .limit(20);
  return data ?? [];
};

export default function ExpensesPage() {
  const { organizationId } = useAuth();
  const expensesQuery = useQuery({
    queryKey: ['expenses', organizationId],
    queryFn: () => fetchExpenses(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (values: ExpenseForm) => {
      if (!organizationId) return;
      await supabaseBrowser.from('expenses').insert([
        {
          organization_id: organizationId,
          expense_date: values.expense_date,
          category: values.category,
          amount: values.amount,
          description: values.description || null,
          requires_approval: values.requires_approval
        }
      ]);
    },
    onSuccess: () => expensesQuery.refetch()
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expense_date: new Date().toISOString().slice(0, 10), amount: 0, requires_approval: false }
  });

  const onSubmit = (values: ExpenseForm) => {
    mutation.mutate(values);
  };

  return (
    <section>
      <h2 className="mb-3">Gastos</h2>
      <p className="text-muted">Registra gastos operativos y controla alertas de presupuesto.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Registrar gasto</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="expense_date" className="form-label">
                    Fecha
                  </label>
                  <input id="expense_date" type="date" className="form-control" {...register('expense_date')} />
                  {errors.expense_date && <small className="text-danger">{errors.expense_date.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="expense-category" className="form-label">
                    Categoría
                  </label>
                  <input id="expense-category" className="form-control" {...register('category')} />
                  {errors.category && <small className="text-danger">{errors.category.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="expense-amount" className="form-label">
                    Monto
                  </label>
                  <input id="expense-amount" type="number" step="0.01" className="form-control" {...register('amount', { valueAsNumber: true })} />
                  {errors.amount && <small className="text-danger">{errors.amount.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="expense-description" className="form-label">
                    Descripción
                  </label>
                  <textarea id="expense-description" className="form-control" rows={3} {...register('description')} />
                </div>
                <div className="form-check mb-3">
                  <input id="requires_approval" type="checkbox" className="form-check-input" {...register('requires_approval')} />
                  <label htmlFor="requires_approval" className="form-check-label">
                    Requiere aprobación prioritaria
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Guardando...' : 'Registrar gasto'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Gastos recientes</h5>
              <ul className="list-group">
                {expensesQuery.data?.map((expense) => (
                  <li key={expense.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{expense.category}</strong>
                      <div className="text-muted">{expense.expense_date}</div>
                    </div>
                    <span>
                      {expense.amount?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                      {expense.requires_approval && <Badge color="warning" className="ms-2">Aprobar</Badge>}
                    </span>
                  </li>
                ))}
                {!expensesQuery.isLoading && !expensesQuery.data?.length && (
                  <li className="list-group-item">No hay gastos registrados.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





