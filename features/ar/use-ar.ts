'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/auth/use-session';

export function useAr() {
  const supabase = createClient();
  const { orgId } = useSession();
  const qc = useQueryClient();

  const invoices = useQuery({
    queryKey: ['ar-invoices', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('ar_invoices')
        .select('id,number,date,due_date,total,status')
        .eq('org_id', orgId!)
        .order('date', { ascending: false });
      return data ?? [];
    }
  });

  const createInvoice = useMutation({
    mutationFn: async (payload: { number: string; date: string; due_date: string; total: number }) => {
      const { data, error } = await supabase
        .from('ar_invoices')
        .insert({ ...payload, org_id: orgId, status: 'issued', subtotal: payload.total, tax: 0, discount: 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ar-invoices', orgId] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis', orgId] });
    }
  });

  const registerPayment = useMutation({
    mutationFn: async (payload: { invoice_id: string; date: string; amount: number }) => {
      const { error } = await supabase
        .from('ar_payments')
        .insert({ ...payload, org_id: orgId, method: 'transferencia' });
      if (error) throw error;
      await supabase
        .from('ar_invoices')
        .update({ status: 'paid' })
        .eq('id', payload.invoice_id)
        .eq('org_id', orgId!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ar-invoices', orgId] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis', orgId] });
    }
  });

  return { invoices, createInvoice, registerPayment };
}
