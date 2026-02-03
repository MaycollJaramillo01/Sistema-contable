import { createClient } from '@/lib/supabase/client';

export async function createIncomeWithJournal(input: {
  orgId: string;
  date: string;
  sourceType: string;
  amount: number;
  cashAccountId?: string;
  incomeAccountId?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_income_transaction', {
    p_org_id: input.orgId,
    p_date: input.date,
    p_source_type: input.sourceType,
    p_amount: input.amount,
    p_cash_account: input.cashAccountId ?? null,
    p_income_account: input.incomeAccountId ?? null
  });
  if (error) throw error;
  return data;
}

export async function createExpenseWithJournal(input: {
  orgId: string;
  date: string;
  amount: number;
  expenseAccountId?: string;
  cashAccountId?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_expense_transaction', {
    p_org_id: input.orgId,
    p_date: input.date,
    p_amount: input.amount,
    p_expense_account: input.expenseAccountId ?? null,
    p_cash_account: input.cashAccountId ?? null
  });
  if (error) throw error;
  return data;
}
