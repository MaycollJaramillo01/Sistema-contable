'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';

const data = [
  { code: '1-01', name: 'Caja', type: 'ACTIVO' },
  { code: '4-01', name: 'Ingresos por donaciones', type: 'INGRESO' }
];

const columns: ColumnDef<(typeof data)[number]>[] = [
  { header: 'Código', accessorKey: 'code' },
  { header: 'Nombre', accessorKey: 'name' },
  { header: 'Tipo', accessorKey: 'type' }
];

export default function AccountsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas contables</h1>
          <p className="text-sm text-slate-600">Catálogo contable y clasificación.</p>
        </div>
        <Button>Crear cuenta</Button>
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
