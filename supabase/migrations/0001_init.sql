-- Inicialización del esquema contable multi-organización
create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  full_name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists roles (
  id smallint primary key,
  name text not null
);

create table if not exists user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_id smallint references roles(id),
  organization_id uuid not null references organizations(id),
  primary key (user_id, organization_id)
);

create type account_type as enum ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE');

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  type account_type not null,
  parent_id uuid references accounts(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (organization_id, code)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  entry_date date not null,
  ref_type text,
  ref_id uuid,
  memo text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references accounts(id),
  debit numeric(14,2) default 0,
  credit numeric(14,2) default 0,
  project_id uuid references projects(id),
  customer_id uuid references customers(id),
  vendor_id uuid references vendors(id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  is_active boolean default true
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  email text,
  phone text,
  is_active boolean default true
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  email text,
  phone text,
  is_active boolean default true
);

create table if not exists tax_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  rate numeric(6,4) not null
);

create type ar_status as enum ('DRAFT','ISSUED','PARTIAL','PAID','OVERDUE','VOID');
create table if not exists ar_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  number text not null,
  customer_id uuid references customers(id),
  issue_date date not null,
  due_date date not null,
  subtotal numeric not null default 0,
  tax_total numeric not null default 0,
  discount_total numeric not null default 0,
  total numeric not null default 0,
  status ar_status not null default 'DRAFT',
  notes text,
  unique (organization_id, number)
);

create table if not exists ar_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  invoice_id uuid not null references ar_invoices(id) on delete cascade,
  payment_date date not null,
  amount numeric not null,
  method text,
  reference text
);

create type ap_status as enum ('DRAFT','RECEIVED','PARTIAL','PAID','OVERDUE','VOID');
create table if not exists ap_bills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  number text not null,
  vendor_id uuid references vendors(id),
  issue_date date not null,
  due_date date not null,
  subtotal numeric not null default 0,
  tax_total numeric not null default 0,
  discount_total numeric not null default 0,
  total numeric not null default 0,
  status ap_status not null default 'DRAFT',
  notes text,
  unique (organization_id, number)
);

create table if not exists ap_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  bill_id uuid not null references ap_bills(id) on delete cascade,
  payment_date date not null,
  amount numeric not null,
  method text,
  reference text
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  income_date date not null,
  source text not null,
  amount numeric not null,
  project_id uuid references projects(id),
  description text,
  ref_type text,
  ref_id uuid
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  expense_date date not null,
  category text not null,
  amount numeric not null,
  project_id uuid references projects(id),
  description text,
  requires_approval boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz
);

create type budget_status as enum ('DRAFT','APPROVED','CLOSED');
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  year int not null,
  month int not null,
  status budget_status not null default 'DRAFT',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (organization_id, year, month)
);

create type budget_type as enum ('INCOME','EXPENSE');
create table if not exists budget_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  budget_id uuid not null references budgets(id) on delete cascade,
  type budget_type not null,
  category text not null,
  project_id uuid references projects(id),
  planned_amount numeric not null
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  entity_type text not null,
  entity_id uuid not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid references auth.users(id),
  kind text not null,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  organization_id uuid references organizations(id),
  user_id uuid references auth.users(id),
  table_name text not null,
  action text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);
