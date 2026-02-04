'use client';

import { Button } from 'reactstrap';
import { useAuth } from '@/lib/context/auth';

export const Topbar = () => {
  const { profile, role, signOut } = useAuth();

  return (
    <div className="d-flex align-items-center justify-content-between mb-4">
      <div>
        <p className="mb-0 text-muted text-uppercase">Rol: {role ?? 'Invitado'}</p>
        <strong>{profile?.full_name ?? 'Usuario sin perfil'}</strong>
      </div>
      <Button color="secondary" outline size="sm" onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  );
};
