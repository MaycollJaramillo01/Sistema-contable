'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';

export function useBudget(month: number, year: number) {
  const supabase = createClient();
  const { orgId } = useSession();

  return useQuery({
    queryKey: ['budget', orgId, month, year],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: budget } = await supabase
        .from('budgets')
        .select('id,status')
        .eq('org_id', orgId!)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();
      if (!budget) return { budget: null, lines: [], executed: 0 };

      const { data: lines } = await supabase
        .from('budget_lines')
        .select('id,planned_amount')
        .eq('budget_id', budget.id);

      const { data: expenses } = await supabase
        .from('expense_transactions')
        .select('amount')
        .eq('org_id', orgId!)
        .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('date', `${year}-${String(month).padStart(2, '0')}-31`);

      const planned = (lines ?? []).reduce((acc, row) => acc + Number(row.planned_amount ?? 0), 0);
      const executed = (expenses ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

      return { budget, lines: lines ?? [], planned, executed, variance: planned - executed };
    }
  });
}
