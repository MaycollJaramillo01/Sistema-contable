-- 2025-02-03 Initial schema for Sistema Contable

create extension if not exists "pgcrypto";

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists org_members (
  org_id uuid references orgs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('admin','contador','tesorero','lector')),
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (org_id, user_id)
);

create table if not exists chart_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('ACTIVO','PASIVO','PATRIMONIO','INGRESO','GASTO')),
  parent_id uuid references chart_accounts(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists accounting_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  month int not null,
  year int not null,
  status text not null default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  date date not null,
  description text,
  ref_type text,
  ref_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references chart_accounts(id),
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  cost_center_id uuid,
  project_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (debit >= 0 and credit >= 0)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  identification text,
  contact jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  identification text,
  contact jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists ar_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  customer_id uuid references customers(id),
  number text not null,
  date date not null,
  due_date date not null,
  subtotal numeric(14,2) not null,
  tax numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  status text not null default 'draft' check (status in ('draft','issued','paid','overdue','canceled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists ar_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  invoice_id uuid not null references ar_invoices(id) on delete cascade,
  date date not null,
  amount numeric(14,2) not null,
  method text,
  note text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists ap_bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  vendor_id uuid references vendors(id),
  number text not null,
  date date not null,
  due_date date not null,
  subtotal numeric(14,2) not null,
  tax numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  status text not null default 'draft' check (status in ('draft','issued','paid','overdue','canceled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists ap_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  bill_id uuid not null references ap_bills(id) on delete cascade,
  date date not null,
  amount numeric(14,2) not null,
  method text,
  note text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists income_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  date date not null,
  source_type text not null,
  source_ref_id uuid,
  amount numeric(14,2) not null,
  cost_center_id uuid,
  project_id uuid,
  note text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  default_limit_monthly numeric(14,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expense_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  date date not null,
  category_id uuid references expense_categories(id),
  amount numeric(14,2) not null,
  cost_center_id uuid,
  project_id uuid,
  note text,
  limit_exceeded boolean default false,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  year int not null,
  month int not null,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  category_id uuid references expense_categories(id),
  account_id uuid references chart_accounts(id),
  planned_amount numeric(14,2) not null default 0
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references profiles(id),
  type text not null,
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  module text not null,
  ref_id uuid,
  storage_path text not null,
  filename text not null,
  mime text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_org_members_org on org_members(org_id);
create index if not exists idx_chart_accounts_org on chart_accounts(org_id);
create index if not exists idx_journal_entries_org on journal_entries(org_id);
create index if not exists idx_income_org_date on income_transactions(org_id, date);
create index if not exists idx_expense_org_date on expense_transactions(org_id, date);
create index if not exists idx_ar_org_status on ar_invoices(org_id, status);
create index if not exists idx_ap_org_status on ap_bills(org_id, status);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_orgs before update on orgs for each row execute function set_updated_at();
create trigger set_updated_at_profiles before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at_org_members before update on org_members for each row execute function set_updated_at();
create trigger set_updated_at_chart_accounts before update on chart_accounts for each row execute function set_updated_at();
create trigger set_updated_at_accounting_periods before update on accounting_periods for each row execute function set_updated_at();
create trigger set_updated_at_journal_entries before update on journal_entries for each row execute function set_updated_at();
create trigger set_updated_at_journal_lines before update on journal_lines for each row execute function set_updated_at();
create trigger set_updated_at_customers before update on customers for each row execute function set_updated_at();
create trigger set_updated_at_vendors before update on vendors for each row execute function set_updated_at();
create trigger set_updated_at_ar_invoices before update on ar_invoices for each row execute function set_updated_at();
create trigger set_updated_at_ap_bills before update on ap_bills for each row execute function set_updated_at();
create trigger set_updated_at_expense_categories before update on expense_categories for each row execute function set_updated_at();
create trigger set_updated_at_budgets before update on budgets for each row execute function set_updated_at();

create or replace function role_rank(role text)
returns int
language sql
as $$
  select case role
    when 'lector' then 1
    when 'tesorero' then 2
    when 'contador' then 3
    when 'admin' then 4
    else 0
  end;
$$;

create or replace function is_org_member(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function has_org_role(p_org_id uuid, p_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and status = 'active'
      and role_rank(role) >= role_rank(p_role)
  );
$$;

alter table orgs enable row level security;
alter table profiles enable row level security;
alter table org_members enable row level security;
alter table chart_accounts enable row level security;
alter table accounting_periods enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table customers enable row level security;
alter table vendors enable row level security;
alter table ar_invoices enable row level security;
alter table ar_payments enable row level security;
alter table ap_bills enable row level security;
alter table ap_payments enable row level security;
alter table income_transactions enable row level security;
alter table expense_transactions enable row level security;
alter table expense_categories enable row level security;
alter table budgets enable row level security;
alter table budget_lines enable row level security;
alter table notifications enable row level security;
alter table documents enable row level security;

create policy orgs_select on orgs for select using (is_org_member(id));
create policy orgs_insert on orgs for insert with check (auth.uid() is not null);
create policy orgs_update on orgs for update using (has_org_role(id, 'admin'));

create policy profiles_select on profiles for select using (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());

create policy org_members_select on org_members for select using (is_org_member(org_id));
create policy org_members_insert on org_members for insert with check (has_org_role(org_id, 'admin'));
create policy org_members_bootstrap on org_members
  for insert
  with check (
    user_id = auth.uid()
    and not exists (select 1 from org_members m where m.org_id = org_members.org_id)
  );
create policy org_members_update on org_members for update using (has_org_role(org_id, 'admin'));
create policy org_members_delete on org_members for delete using (has_org_role(org_id, 'admin'));

create policy chart_accounts_select on chart_accounts for select using (is_org_member(org_id));
create policy chart_accounts_insert on chart_accounts for insert with check (has_org_role(org_id, 'contador'));
create policy chart_accounts_update on chart_accounts for update using (has_org_role(org_id, 'contador'));
create policy chart_accounts_delete on chart_accounts for delete using (has_org_role(org_id, 'contador'));

create policy accounting_periods_select on accounting_periods for select using (is_org_member(org_id));
create policy accounting_periods_mutate on accounting_periods for all using (has_org_role(org_id, 'contador')) with check (has_org_role(org_id, 'contador'));

create policy journal_entries_select on journal_entries for select using (is_org_member(org_id));
create policy journal_entries_mutate on journal_entries for all using (has_org_role(org_id, 'contador')) with check (has_org_role(org_id, 'contador'));

create policy journal_lines_select on journal_lines for select using (is_org_member((select org_id from journal_entries where id = entry_id)));
create policy journal_lines_mutate on journal_lines for all using (has_org_role((select org_id from journal_entries where id = entry_id), 'contador')) with check (has_org_role((select org_id from journal_entries where id = entry_id), 'contador'));

create policy customers_select on customers for select using (is_org_member(org_id));
create policy customers_mutate on customers for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy vendors_select on vendors for select using (is_org_member(org_id));
create policy vendors_mutate on vendors for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy ar_invoices_select on ar_invoices for select using (is_org_member(org_id));
create policy ar_invoices_mutate on ar_invoices for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy ar_payments_select on ar_payments for select using (is_org_member(org_id));
create policy ar_payments_mutate on ar_payments for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy ap_bills_select on ap_bills for select using (is_org_member(org_id));
create policy ap_bills_mutate on ap_bills for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy ap_payments_select on ap_payments for select using (is_org_member(org_id));
create policy ap_payments_mutate on ap_payments for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy income_transactions_select on income_transactions for select using (is_org_member(org_id));
create policy income_transactions_mutate on income_transactions for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy expense_transactions_select on expense_transactions for select using (is_org_member(org_id));
create policy expense_transactions_mutate on expense_transactions for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy expense_categories_select on expense_categories for select using (is_org_member(org_id));
create policy expense_categories_mutate on expense_categories for all using (has_org_role(org_id, 'contador')) with check (has_org_role(org_id, 'contador'));

create policy budgets_select on budgets for select using (is_org_member(org_id));
create policy budgets_mutate on budgets for all using (has_org_role(org_id, 'contador')) with check (has_org_role(org_id, 'contador'));

create policy budget_lines_select on budget_lines for select using (is_org_member((select org_id from budgets where id = budget_id)));
create policy budget_lines_mutate on budget_lines for all using (has_org_role((select org_id from budgets where id = budget_id), 'contador')) with check (has_org_role((select org_id from budgets where id = budget_id), 'contador'));

create policy notifications_select on notifications for select using (is_org_member(org_id));
create policy notifications_mutate on notifications for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

create policy documents_select on documents for select using (is_org_member(org_id));
create policy documents_mutate on documents for all using (has_org_role(org_id, 'tesorero')) with check (has_org_role(org_id, 'tesorero'));

-- Journal balance check
create or replace function check_journal_balance(p_entry_id uuid)
returns void
language plpgsql
as $$
declare
  total_debit numeric(14,2);
  total_credit numeric(14,2);
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0)
    into total_debit, total_credit
  from journal_lines
  where entry_id = p_entry_id;

  if total_debit <> total_credit then
    raise exception 'Journal entry not balanced: % vs %', total_debit, total_credit;
  end if;
end;
$$;

create or replace function check_journal_balance_trigger()
returns trigger
language plpgsql
as $$
begin
  perform check_journal_balance(coalesce(new.entry_id, old.entry_id));
  return null;
end;
$$;

create constraint trigger journal_balance_check
after insert or update or delete on journal_lines
deferrable initially deferred
for each row
execute function check_journal_balance_trigger();

-- Service RPCs
create or replace function create_journal_entry(
  p_org_id uuid,
  p_date date,
  p_description text,
  p_ref_type text,
  p_ref_id uuid,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_line jsonb;
begin
  insert into journal_entries(org_id, date, description, ref_type, ref_id, created_by)
  values (p_org_id, p_date, p_description, p_ref_type, p_ref_id, auth.uid())
  returning id into v_entry_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into journal_lines(entry_id, account_id, debit, credit, cost_center_id, project_id)
    values (
      v_entry_id,
      (v_line->>'account_id')::uuid,
      coalesce((v_line->>'debit')::numeric, 0),
      coalesce((v_line->>'credit')::numeric, 0),
      (v_line->>'cost_center_id')::uuid,
      (v_line->>'project_id')::uuid
    );
  end loop;

  perform check_journal_balance(v_entry_id);
  return v_entry_id;
end;
$$;

create or replace function create_income_transaction(
  p_org_id uuid,
  p_date date,
  p_source_type text,
  p_amount numeric,
  p_cash_account uuid,
  p_income_account uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id uuid;
  v_entry_id uuid;
begin
  insert into income_transactions(org_id, date, source_type, amount, created_by)
  values (p_org_id, p_date, p_source_type, p_amount, auth.uid())
  returning id into v_tx_id;

  if p_cash_account is not null and p_income_account is not null then
    v_entry_id := create_journal_entry(
      p_org_id,
      p_date,
      'Ingreso automatico',
      'income',
      v_tx_id,
      jsonb_build_array(
        jsonb_build_object('account_id', p_cash_account, 'debit', p_amount, 'credit', 0),
        jsonb_build_object('account_id', p_income_account, 'debit', 0, 'credit', p_amount)
      )
    );
  end if;

  return v_tx_id;
end;
$$;

create or replace function create_expense_transaction(
  p_org_id uuid,
  p_date date,
  p_amount numeric,
  p_expense_account uuid,
  p_cash_account uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id uuid;
  v_entry_id uuid;
begin
  insert into expense_transactions(org_id, date, amount, approval_status, created_by)
  values (p_org_id, p_date, p_amount, 'approved', auth.uid())
  returning id into v_tx_id;

  if p_expense_account is not null and p_cash_account is not null then
    v_entry_id := create_journal_entry(
      p_org_id,
      p_date,
      'Gasto automatico',
      'expense',
      v_tx_id,
      jsonb_build_array(
        jsonb_build_object('account_id', p_expense_account, 'debit', p_amount, 'credit', 0),
        jsonb_build_object('account_id', p_cash_account, 'debit', 0, 'credit', p_amount)
      )
    );
  end if;

  return v_tx_id;
end;
$$;








