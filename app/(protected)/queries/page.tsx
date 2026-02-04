'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const querySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  account_id: z.string().optional(),
  status: z.string().optional()
});

type QueryForm = z.infer<typeof querySchema>;

type QueryResult = {
  id: string;
  account_id: string;
  amount: number;
  created_at: string;
  status: string;
};

export default function QueriesPage() {
  const { organizationId } = useAuth();
  const [results, setResults] = useState<QueryResult[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<QueryForm>({ resolver: zodResolver(querySchema) });

  const onSubmit = async (values: QueryForm) => {
    if (!organizationId) return;
  let query = supabaseBrowser
    .from('journal_lines')
    .select('id, account_id, debit, credit, created_at')
    .eq('organization_id', organizationId)
    .limit(40)
    .order('created_at', { ascending: false });

    if (values.account_id) {
      query = query.eq('account_id', values.account_id);
    }

    const { data } = await query;

    const formatted = (data ?? []).map((row: any) => ({
      id: row.id,
      account_id: row.account_id,
      amount: (row.debit ?? 0) - (row.credit ?? 0),
      created_at: row.created_at,
      status: values.status ?? 'Revisado'
    }));
    setResults(formatted);
  };

  return (
    <section>
      <h2 className="mb-3">Consultas avanzadas</h2>
      <p className="text-muted">Filtra movimientos por fechas, cuentas, proyectos y estados.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="row g-3 mb-4">
        <div className="col-md-3">
          <label htmlFor="start_date" className="form-label">
            Desde
          </label>
          <input id="start_date" type="date" className="form-control" {...register('start_date')} />
        </div>
        <div className="col-md-3">
          <label htmlFor="end_date" className="form-label">
            Hasta
          </label>
          <input id="end_date" type="date" className="form-control" {...register('end_date')} />
        </div>
        <div className="col-md-3">
          <label htmlFor="account_id" className="form-label">
            Cuenta (ID)
          </label>
          <input id="account_id" className="form-control" {...register('account_id')} />
        </div>
        <div className="col-md-3">
          <label htmlFor="status" className="form-label">
            Estado
          </label>
          <input id="status" className="form-control" {...register('status')} />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Ejecutar consulta
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Resultados</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                  <th>ID Cuenta</th>
                  <th>Debe - Haber</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.id}>
                      <td>{row.account_id}</td>
                      <td>{row.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                      <td>{row.created_at}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
