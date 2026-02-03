'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, endOfMonth } from '@/lib/date';
import { useSession } from '@/lib/auth/use-session';

export function useDashboardKpis() {
  const supabase = createClient();
  const { orgId } = useSession();

  return useQuery({
    queryKey: ['dashboard-kpis', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return { income: 0, expense: 0, net: 0, arOverdue: 0, apOverdue: 0 };
      const start = startOfMonth();
      const end = endOfMonth();

      const [incomeRes, expenseRes, arRes, apRes] = await Promise.all([
        supabase
          .from('income_transactions')
          .select('amount', { count: 'exact' })
          .eq('org_id', orgId)
          .gte('date', start.toISOString())
          .lte('date', end.toISOString()),
        supabase
          .from('expense_transactions')
          .select('amount', { count: 'exact' })
          .eq('org_id', orgId)
          .gte('date', start.toISOString())
          .lte('date', end.toISOString()),
        supabase
          .from('ar_invoices')
          .select('total')
          .eq('org_id', orgId)
          .eq('status', 'overdue'),
        supabase
          .from('ap_bills')
          .select('total')
          .eq('org_id', orgId)
          .eq('status', 'overdue')
      ]);

      const income = (incomeRes.data ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
      const expense = (expenseRes.data ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
      const arOverdue = (arRes.data ?? []).reduce((acc, row) => acc + Number(row.total ?? 0), 0);
      const apOverdue = (apRes.data ?? []).reduce((acc, row) => acc + Number(row.total ?? 0), 0);

      return {
        income,
        expense,
        net: income - expense,
        arOverdue,
        apOverdue
      };
    }
  });
}
