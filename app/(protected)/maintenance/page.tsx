'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const simpleSchema = z.object({ name: z.string().min(3) });

type SimpleForm = z.infer<typeof simpleSchema>;

const fetchProjects = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('projects')
    .select('id, name, is_active')
    .eq('organization_id', organizationId)
    .order('name');
  return data ?? [];
};

const fetchTaxRates = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('tax_rates')
    .select('id, name, rate')
    .eq('organization_id', organizationId)
    .order('name');
  return data ?? [];
};

export default function MaintenancePage() {
  const { organizationId } = useAuth();
  const projectsQuery = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => fetchProjects(organizationId),
    enabled: Boolean(organizationId)
  });
  const taxesQuery = useQuery({
    queryKey: ['tax_rates', organizationId],
    queryFn: () => fetchTaxRates(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (data: SimpleForm & { target: 'projects' | 'tax_rates' }) => {
      if (!organizationId) return;
      if (data.target === 'projects') {
        await supabaseBrowser.from('projects').insert([{ organization_id: organizationId, name: data.name, is_active: true }]);
      } else {
        await supabaseBrowser.from('tax_rates').insert([{ organization_id: organizationId, name: data.name, rate: 0.19 }]);
      }
    },
    onSuccess: (_result, variables) => {
      if (variables.target === 'projects') {
        projectsQuery.refetch();
      } else {
        taxesQuery.refetch();
      }
    }
  });

  const { register, handleSubmit, reset } = useForm<SimpleForm & { target: 'projects' | 'tax_rates' }>({
    resolver: zodResolver(simpleSchema.extend({ target: z.enum(['projects', 'tax_rates']) })),
    defaultValues: { name: '', target: 'projects' }
  });

  const onSubmit = (values: SimpleForm & { target: 'projects' | 'tax_rates' }) => {
    mutation.mutate(values);
    reset({ name: '', target: values.target });
  };

  return (
    <section>
      <h2 className="mb-3">Mantenimientos</h2>
      <p className="text-muted">Administra catálogos auxiliares como proyectos, categorías, impuestos y métodos de pago.</p>

      <div className="row g-4">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Crear catálogo</h5>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="maintenance-name" className="form-label">
                    Nombre
                  </label>
                  <input id="maintenance-name" className="form-control" {...register('name')} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="maintenance-target" className="form-label">
                    Catálogo
                  </label>
                  <select id="maintenance-target" className="form-select" {...register('target')}>
                    <option value="projects">Proyectos / centros de costo</option>
                    <option value="tax_rates">Impuestos</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Guardando...' : 'Agregar ítem'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Proyectos activos</h5>
              <ul className="list-group mb-3">
                {projectsQuery.data?.map((project) => (
                  <li key={project.id} className="list-group-item">
                    {project.name} <span className="badge bg-success">{project.is_active ? 'Activo' : 'Inactivo'}</span>
                  </li>
                ))}
                {!projectsQuery.isLoading && !projectsQuery.data?.length && <li className="list-group-item">Sin proyectos.</li>}
              </ul>
              <h5 className="card-title">Impuestos</h5>
              <ul className="list-group">
                {taxesQuery.data?.map((tax) => (
                  <li key={tax.id} className="list-group-item d-flex justify-content-between">
                    {tax.name}
                    <span>{(tax.rate * 100).toFixed(2)} %</span>
                  </li>
                ))}
                {!taxesQuery.isLoading && !taxesQuery.data?.length && <li className="list-group-item">Sin tasas.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
