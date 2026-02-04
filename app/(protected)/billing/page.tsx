'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const invoiceSchema = z.object({
  number: z.string().min(1),
  issue_date: z.string(),
  due_date: z.string().min(1),
  customer: z.string().min(3),
  subtotal: z.number().min(0),
  tax_total: z.number().min(0),
  discount_total: z.number().min(0)
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

const fetchBilling = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('ar_invoices')
    .select('id, number, issue_date, due_date, total, status')
    .eq('organization_id', organizationId)
    .order('issue_date', { ascending: false })
    .limit(15);
  return data ?? [];
};

export default function BillingPage() {
  const { organizationId } = useAuth();
  const invoicesQuery = useQuery({
    queryKey: ['billing', organizationId],
    queryFn: () => fetchBilling(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (values: InvoiceForm) => {
      if (!organizationId) return;
      const total = values.subtotal + values.tax_total - values.discount_total;
      await supabaseBrowser.from('ar_invoices').insert([
        {
          organization_id: organizationId,
          number: values.number,
          issue_date: values.issue_date,
          due_date: values.due_date,
          subtotal: values.subtotal,
          tax_total: values.tax_total,
          discount_total: values.discount_total,
          total,
          customer_id: null,
          status: 'ISSUED'
        }
      ]);
    },
    onSuccess: () => invoicesQuery.refetch()
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10)
    }
  });

  const onSubmit = (values: InvoiceForm) => {
    mutation.mutate(values);
    reset({
      number: '',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      customer: '',
      subtotal: 0,
      tax_total: 0,
      discount_total: 0
    });
  };

  return (
    <section>
      <h2 className="mb-3">Facturación</h2>
      <p className="text-muted">Emite y administra facturas electrónicas con cálculos automáticos de impuestos.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Nueva factura</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="invoice-number" className="form-label">
                    Número
                  </label>
                  <input id="invoice-number" className="form-control" {...register('number')} />
                  {errors.number && <small className="text-danger">{errors.number.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="issue-date" className="form-label">
                    Fecha de emisión
                  </label>
                  <input id="issue-date" type="date" className="form-control" {...register('issue_date')} />
                  {errors.issue_date && <small className="text-danger">{errors.issue_date.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="due-date" className="form-label">
                    Fecha de vencimiento
                  </label>
                  <input id="due-date" type="date" className="form-control" {...register('due_date')} />
                </div>
                <div className="mb-3">
                  <label htmlFor="customer" className="form-label">
                    Cliente / Beneficiario
                  </label>
                  <input id="customer" className="form-control" {...register('customer')} />
                  {errors.customer && <small className="text-danger">{errors.customer.message}</small>}
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <label htmlFor="subtotal" className="form-label">
                      Subtotal
                    </label>
                    <input id="subtotal" type="number" step="0.01" className="form-control" {...register('subtotal', { valueAsNumber: true })} />
                  </div>
                  <div className="col-4">
                    <label htmlFor="tax-total" className="form-label">
                      Impuestos
                    </label>
                    <input id="tax-total" type="number" step="0.01" className="form-control" {...register('tax_total', { valueAsNumber: true })} />
                  </div>
                  <div className="col-4">
                    <label htmlFor="discount-total" className="form-label">
                      Descuento
                    </label>
                    <input id="discount-total" type="number" step="0.01" className="form-control" {...register('discount_total', { valueAsNumber: true })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary mt-3" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Registrando...' : 'Emitir factura'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Facturas</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>FE</th>
                      <th>Vence</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesQuery.data?.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.number}</td>
                        <td>{invoice.issue_date}</td>
                        <td>{invoice.due_date}</td>
                        <td>{invoice.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                        <td>{invoice.status}</td>
                      </tr>
                    ))}
                    {!invoicesQuery.isLoading && !invoicesQuery.data?.length && (
                      <tr>
                        <td colSpan={5}>No se han emitido facturas.</td>
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

