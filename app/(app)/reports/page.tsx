'use client';

import { Button } from '@/components/ui/button';
import { exportCsv } from '@/features/reports/csv';

const sampleRows = [
  { cuenta: 'Ingresos', monto: 5000 },
  { cuenta: 'Gastos', monto: 3200 }
];

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <div className="flex gap-2">
        <Button onClick={() => exportCsv('reporte.csv', sampleRows)}>Exportar CSV</Button>
        <Button variant="outline" onClick={() => window.print()}>
          Vista imprimible
        </Button>
      </div>
      <div className="rounded border border-slate-200 bg-white p-4 print:border-none">
        <h2 className="text-lg font-semibold">Estado de resultados</h2>
        <ul className="mt-2 space-y-1">
          {sampleRows.map((row) => (
            <li key={row.cuenta} className="flex justify-between">
              <span>{row.cuenta}</span>
              <span>{row.monto}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
