'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';

export function useIncome() {
  const supabase = createClient();
  const { orgId } = useSession();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['income', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('income_transactions')
        .select('id,date,amount,source_type,note')
        .eq('org_id', orgId!)
        .order('date', { ascending: false });
      return data ?? [];
    }
  });

  const create = useMutation({
    mutationFn: async (payload: { date: string; amount: number; source_type: string; note?: string }) => {
      const { data, error } = await supabase
        .from('income_transactions')
        .insert({ ...payload, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income', orgId] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis', orgId] });
    }
  });

  return { list, create };
}
