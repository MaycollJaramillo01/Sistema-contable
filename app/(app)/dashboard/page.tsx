'use client';

import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardKpis } from '@/features/dashboard/use-dashboard-kpis';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-600">Resumen financiero mensual.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Ingresos del mes" value={data?.income ?? 0} />
        <KpiCard title="Gastos del mes" value={data?.expense ?? 0} />
        <KpiCard title="Saldo neto" value={data?.net ?? 0} />
        <KpiCard title="CxC vencido" value={data?.arOverdue ?? 0} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">CxP vencido</h2>
            <p className="text-2xl font-semibold">{data?.apOverdue ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Actividad reciente</h2>
            <p className="text-sm text-slate-600">Panel listo para conectar a eventos.</p>
          </CardContent>
        </Card>
      </div>
      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
    </div>
  );
}
