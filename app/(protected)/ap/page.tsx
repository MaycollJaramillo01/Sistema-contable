'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const vendorSchema = z.object({
  name: z.string().min(3),
  email: z.string().email().or(z.literal('')),
  phone: z.string().optional()
});

type VendorForm = z.infer<typeof vendorSchema>;

const fetchVendors = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('vendors')
    .select('id, name, email, phone')
    .eq('organization_id', organizationId)
    .order('name');
  return data ?? [];
};

const fetchBills = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('ap_bills')
    .select('id, number, issue_date, total, status')
    .eq('organization_id', organizationId)
    .order('issue_date', { ascending: false })
    .limit(20);
  return data ?? [];
};

export default function APPage() {
  const { organizationId } = useAuth();
  const vendorsQuery = useQuery({
    queryKey: ['vendors', organizationId],
    queryFn: () => fetchVendors(organizationId),
    enabled: Boolean(organizationId)
  });
  const billsQuery = useQuery({
    queryKey: ['ap-bills', organizationId],
    queryFn: () => fetchBills(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (data: VendorForm) => {
      if (!organizationId) return;
      await supabaseBrowser.from('vendors').insert([{ organization_id: organizationId, name: data.name, email: data.email || null, phone: data.phone || null, is_active: true }]);
    },
    onSuccess: () => vendorsQuery.refetch()
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema)
  });

  const onSubmit = (values: VendorForm) => {
    mutation.mutate(values);
    reset();
  };

  return (
    <section>
      <h2 className="mb-3">Cuentas por Pagar</h2>
      <p className="text-muted">Registra proveedores, facturas recibidas y controla pagos parciales o anticipos.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Registrar proveedor</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="vendor-name" className="form-label">
                    Nombre
                  </label>
                  <input id="vendor-name" className="form-control" {...register('name')} />
                  {errors.name && <small className="text-danger">{errors.name.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="vendor-email" className="form-label">
                    Email
                  </label>
                  <input id="vendor-email" className="form-control" {...register('email')} />
                  {errors.email && <small className="text-danger">{errors.email.message}</small>}
                </div>
                <div className="mb-3">
                  <label htmlFor="vendor-phone" className="form-label">
                    Teléfono
                  </label>
                  <input id="vendor-phone" className="form-control" {...register('phone')} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : 'Guardar proveedor'}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Proveedores activos</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorsQuery.data?.map((vendor) => (
                      <tr key={vendor.id}>
                        <td>{vendor.name}</td>
                        <td>{vendor.email ?? '—'}</td>
                        <td>{vendor.phone ?? '—'}</td>
                      </tr>
                    ))}
                    {!vendorsQuery.isLoading && !vendorsQuery.data?.length && (
                      <tr>
                        <td colSpan={3}>No hay proveedores registrados.</td>
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
          <h5 className="card-title">Facturas por pagar</h5>
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
                {billsQuery.data?.map((bill) => (
                  <tr key={bill.id}>
                    <td>{bill.number}</td>
                    <td>{bill.issue_date}</td>
                    <td>{bill.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                    <td>{bill.status}</td>
                  </tr>
                ))}
                {!billsQuery.isLoading && !billsQuery.data?.length && (
                  <tr>
                    <td colSpan={4}>Sin facturas por pagar.</td>
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

