'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

const fetchDashboardStats = async (organizationId: string | null) => {
  if (!organizationId) return null;
  const [accounts, incomes, expenses, invoices] = await Promise.all([
    supabaseBrowser.from('accounts').select('id', { count: 'exact' }).eq('organization_id', organizationId),
    supabaseBrowser.from('incomes').select('amount', { count: 'exact' }).eq('organization_id', organizationId),
    supabaseBrowser.from('expenses').select('amount', { count: 'exact' }).eq('organization_id', organizationId),
    supabaseBrowser.from('ar_invoices').select('total', { count: 'exact' }).eq('organization_id', organizationId)
  ]);

  return {
    totalAccounts: accounts.count ?? 0,
    totalIncomes: incomes.count ?? 0,
    totalExpenses: expenses.count ?? 0,
    pendingInvoices: invoices.count ?? 0
  };
};

export default function DashboardPage() {
  const { organizationId } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', organizationId],
    queryFn: () => fetchDashboardStats(organizationId),
    enabled: Boolean(organizationId)
  });

  useEffect(() => {
    if (!organizationId) return;
    supabaseBrowser.rpc('fn_enqueue_overdue_alerts').catch(() => {});
  }, [organizationId]);

  return (
    <section>
      <h2 className="mb-3">Panel financiero</h2>
      <p className="text-muted">Resumen de indicadores críticos y alertas de vencidos.</p>

      <div className="row g-3 mb-4">
        {[
          { label: 'Cuentas contables', value: stats?.totalAccounts ?? '—' },
          { label: 'Ingresos registrados', value: stats?.totalIncomes ?? '—' },
          { label: 'Gastos registrados', value: stats?.totalExpenses ?? '—' },
          { label: 'Facturas pendientes', value: stats?.pendingInvoices ?? '—' }
        ].map((card) => (
          <article key={card.label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="text-uppercase text-muted mb-1">{card.label}</p>
                <h3 className="mb-0">{isLoading ? 'Cargando...' : card.value}</h3>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="card printable-card mb-4" aria-label="Alertas de facturas vencidas">
        <div className="card-body">
          <h5 className="card-title">Alertas automáticas</h5>
          <p className="card-text text-muted">
            En el próximo corte mensual se ejecutan verificaciones de facturas vencidas y se crean notificaciones.
          </p>
        </div>
      </div>
    </section>
  );
}
