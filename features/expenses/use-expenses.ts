'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';

export function useExpenses() {
  const supabase = createClient();
  const { orgId } = useSession();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['expenses', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('expense_transactions')
        .select('id,date,amount,approval_status,note,limit_exceeded')
        .eq('org_id', orgId!)
        .order('date', { ascending: false });
      return data ?? [];
    }
  });

  const create = useMutation({
    mutationFn: async (payload: { date: string; amount: number; note?: string }) => {
      const { data, error } = await supabase
        .from('expense_transactions')
        .insert({ ...payload, org_id: orgId, approval_status: 'pending', limit_exceeded: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', orgId] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis', orgId] });
    }
  });

  return { list, create };
}
