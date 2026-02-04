'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const customerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email().or(z.literal('')),
  phone: z.string().optional()
});

type CustomerForm = z.infer<typeof customerSchema>;

const fetchCustomers = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('customers')
    .select('id, name, email, phone')
    .eq('organization_id', organizationId)
    .order('name');
  return data ?? [];
};

const fetchInvoices = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('ar_invoices')
    .select('id, number, issue_date, total, status')
    .eq('organization_id', organizationId)
    .order('issue_date', { ascending: false })
    .limit(20);
  return data ?? [];
};

export default function ARPage() {
  const { organizationId } = useAuth();
  const customersQuery = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => fetchCustomers(organizationId),
    enabled: Boolean(organizationId)
  });
  const invoicesQuery = useQuery({
    queryKey: ['ar-invoices', organizationId],
    queryFn: () => fetchInvoices(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerForm) => {
      if (!organizationId) return;
      await supabaseBrowser.from('customers').insert([{
        organization_id: organizationId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        is_active: true
      }]);
    },
    onSuccess: () => customersQuery.refetch()
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema)
  });

  const onSubmit = (values: CustomerForm) => {
    mutation.mutate(values);
    reset();
  };

  return (
    <section>
      <h2 className="mb-3">Cuentas por Cobrar</h2>
      <p className="text-muted">Controla clientes, facturas y cobranzas con alertas de vencidos.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Registrar cliente / beneficiario</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="customer-name" className="form-label">
                    Nombre
                  </label>
                  <input id="customer-name" className="form-control" {...register('name')} />
                  {errors.name && <small className="text-danger">{errors.name.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="customer-email" className="form-label">
                    Email
                  </label>
                  <input id="customer-email" className="form-control" {...register('email')} />
                  {errors.email && <small className="text-danger">{errors.email.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="customer-phone" className="form-label">
                    Teléfono
                  </label>
                  <input id="customer-phone" className="form-control" {...register('phone')} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : 'Crear cliente'}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Clientes activos</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersQuery.data?.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.email ?? '—'}</td>
                        <td>{customer.phone ?? '—'}</td>
                      </tr>
                    ))}
                    {!customersQuery.isLoading && !customersQuery.data?.length && (
                      <tr>
                        <td colSpan={3}>Aún no hay clientes registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <h5 className="card-title">Facturas emitidas</h5>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoicesQuery.data?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.number}</td>
                    <td>{invoice.issue_date}</td>
                    <td>{invoice.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                    <td>{invoice.status}</td>
                  </tr>
                ))}
                {!invoicesQuery.isLoading && !invoicesQuery.data?.length && (
                  <tr>
                    <td colSpan={4}>Sin facturas registradas.</td>
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

