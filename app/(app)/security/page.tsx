import { Guard } from '@/lib/auth/guard';
import { Button } from '@/components/ui/button';

export default function SecurityPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Seguridad</h1>
      <Guard permission="manageUsers" fallback={<p>No tienes permisos.</p>}>
        <Button>Invitar usuario</Button>
      </Guard>
      <p className="text-sm text-slate-600">Gestión de roles por organización.</p>
    </div>
  );
}
