'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const securitySchema = z.object({
  user_id: z.string().min(1),
  role_id: z.number().min(1)
});

type SecurityForm = z.infer<typeof securitySchema>;

const fetchRoles = async () => {
  const { data } = await supabaseBrowser.from('roles').select('*').order('id');
  return data ?? [];
};

const fetchUserRoles = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('user_roles')
    .select('user_id, role_id, profiles(full_name, email)')
    .eq('organization_id', organizationId);
  return data ?? [];
};

export default function SecurityPage() {
  const { organizationId } = useAuth();
  const rolesQuery = useQuery({
    queryKey: ['security-roles'],
    queryFn: fetchRoles
  });
  const userRolesQuery = useQuery({
    queryKey: ['security-users', organizationId],
    queryFn: () => fetchUserRoles(organizationId),
    enabled: Boolean(organizationId)
  });

  const mutation = useMutation({
    mutationFn: async (values: SecurityForm) => {
      if (!organizationId) return;
      await supabaseBrowser.from('user_roles').upsert([
        {
          user_id: values.user_id,
          role_id: values.role_id,
          organization_id: organizationId
        }
      ], { onConflict: 'user_id, organization_id' });
    },
    onSuccess: () => userRolesQuery.refetch()
  });

  const { register, handleSubmit, reset } = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema)
  });

  const onSubmit = (values: SecurityForm) => {
    mutation.mutate(values);
    reset();
  };

  return (
    <section>
      <h2 className="mb-3">Seguridad y roles</h2>
      <p className="text-muted">Administra permisos RBAC por organización.</p>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Asignar rol a usuario</h5>
          <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-md-6">
              <label htmlFor="user_id" className="form-label">
                Usuario (ID)
              </label>
              <input id="user_id" className="form-control" {...register('user_id')} />
            </div>
            <div className="col-md-4">
              <label htmlFor="role_id" className="form-label">
                Rol
              </label>
              <select id="role_id" className="form-select" {...register('role_id')}>
                <option value="">Seleccione</option>
                {rolesQuery.data?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100" disabled={mutation.isPending}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Usuarios y roles</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {userRolesQuery.data?.map((item) => (
                  <tr key={item.user_id}>
                    <td>{item.profiles?.[0]?.full_name ?? item.user_id}</td>
                    <td>{item.profiles?.[0]?.email}</td>
                    <td>{item.role_id}</td>
                  </tr>
                ))}
                {!userRolesQuery.isLoading && !userRolesQuery.data?.length && (
                  <tr>
                    <td colSpan={3}>No hay asignaciones registradas.</td>
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

