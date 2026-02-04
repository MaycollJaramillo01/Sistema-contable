-- 1. Seed de roles base (Datos iniciales)
insert into roles (id, name) values
  (1, 'ADMIN'),
  (2, 'CONTADOR'),
  (3, 'TESORERO'),
  (4, 'AUDITOR'),
  (5, 'LECTOR')
on conflict (id) do nothing;

-- 2. Corrección de Estructura (Columna faltante para la función de alertas)
alter table notifications add column if not exists record_id uuid;

-- 3. Funciones auxiliares de RLS y permisos
create or replace function current_org_id() returns uuid
language sql stable as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function has_role(role_name text) returns boolean
language sql stable as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and ur.organization_id = current_org_id()
      and r.name = role_name
  )
$$;

create or replace function can_modify_accounting() returns boolean
language sql stable as $$
  select has_role('ADMIN') or has_role('CONTADOR') or has_role('TESORERO')
$$;

-- 4. Triggers de Auditoría
create or replace function audit_log_trigger() returns trigger language plpgsql as $$
declare
  payload_old jsonb := null;
  payload_new jsonb := null;
  org uuid;
  rec_id uuid;
begin
  if TG_OP = 'DELETE' then
    payload_old := to_jsonb(old);
    org := old.organization_id;
    rec_id := old.id;
  elsif TG_OP = 'UPDATE' then
    payload_old := to_jsonb(old);
    payload_new := to_jsonb(new);
    org := new.organization_id;
    rec_id := new.id;
  else -- INSERT
    payload_new := to_jsonb(new);
    org := new.organization_id;
    rec_id := new.id;
  end if;

  insert into audit_logs (organization_id, user_id, table_name, action, record_id, old_data, new_data)
  values (
    org,
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    rec_id,
    payload_old,
    payload_new
  );
  
  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;

-- 5. Trigger para inicializar cuentas contables
create or replace function seed_accounts_for_org() returns trigger language plpgsql as $$
begin
  insert into accounts (organization_id, code, name, type, is_active)
  values
    (NEW.id, '1000', 'Activos corrientes', 'ASSET', true),
    (NEW.id, '2000', 'Pasivos corrientes', 'LIABILITY', true),
    (NEW.id, '3000', 'Patrimonio', 'EQUITY', true),
    (NEW.id, '4000', 'Ingresos', 'INCOME', true),
    (NEW.id, '5000', 'Gastos operativos', 'EXPENSE', true);
  return NEW;
end;
$$;

-- Eliminar trigger si existe para evitar duplicados al correr el script varias veces
drop trigger if exists organizations_seed_accounts on organizations;
create trigger organizations_seed_accounts after insert on organizations
for each row execute function seed_accounts_for_org();

-- 6. Configuración de RLS (Row Level Security)

-- Habilitar RLS en tabla organizations
alter table organizations enable row level security;

-- Política de lectura: Ver si perteneces a la organización
create policy organizations_access on organizations for select using (
  exists (
    select 1 from user_roles ur where ur.organization_id = organizations.id and ur.user_id = auth.uid()
  )
);

-- CORRECCIÓN DEL ERROR ORIGINAL AQUÍ:
-- "ON organizations" va antes de "FOR INSERT"
-- Se usa "WITH CHECK" para inserts, no "USING"
create policy organizations_insert on organizations for insert with check (
  auth.uid() is not null
);

-- Habilitar RLS manualmente para el resto de tablas
alter table accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table projects enable row level security;
alter table customers enable row level security;
alter table vendors enable row level security;
alter table tax_rates enable row level security;
alter table ar_invoices enable row level security;
alter table ar_payments enable row level security;
alter table ap_bills enable row level security;
alter table ap_payments enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;
alter table budget_lines enable row level security;
alter table attachments enable row level security;
alter table notifications enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table audit_logs enable row level security;

-- Políticas de seguridad detalladas

-- Accounts
create policy accounts_select on accounts for select using (organization_id = current_org_id());
create policy accounts_insert on accounts for insert with check (organization_id = current_org_id() and can_modify_accounting());
create policy accounts_update on accounts for update using (organization_id = current_org_id() and can_modify_accounting()) with check (organization_id = current_org_id());
create policy accounts_delete on accounts for delete using (organization_id = current_org_id() and has_role('ADMIN'));

-- Journal Entries
create policy journal_entries_select on journal_entries for select using (organization_id = current_org_id());
create policy journal_entries_mod on journal_entries for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Journal Lines
create policy journal_lines_select on journal_lines for select using (organization_id = current_org_id());
create policy journal_lines_mod on journal_lines for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Projects
create policy projects_select on projects for select using (organization_id = current_org_id());
create policy projects_mod on projects for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Customers
create policy customers_select on customers for select using (organization_id = current_org_id());
create policy customers_mod on customers for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Vendors
create policy vendors_select on vendors for select using (organization_id = current_org_id());
create policy vendors_mod on vendors for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Tax Rates
create policy tax_rates_select on tax_rates for select using (organization_id = current_org_id());
create policy tax_rates_mod on tax_rates for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- AR Invoices
create policy ar_invoices_select on ar_invoices for select using (organization_id = current_org_id());
create policy ar_invoices_mod on ar_invoices for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- AR Payments
create policy ar_payments_select on ar_payments for select using (organization_id = current_org_id());
create policy ar_payments_mod on ar_payments for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- AP Bills
create policy ap_bills_select on ap_bills for select using (organization_id = current_org_id());
create policy ap_bills_mod on ap_bills for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- AP Payments
create policy ap_payments_select on ap_payments for select using (organization_id = current_org_id());
create policy ap_payments_mod on ap_payments for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Incomes
create policy incomes_select on incomes for select using (organization_id = current_org_id());
create policy incomes_mod on incomes for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Expenses
create policy expenses_select on expenses for select using (organization_id = current_org_id());
create policy expenses_mod on expenses for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Budgets
create policy budgets_select on budgets for select using (organization_id = current_org_id());
create policy budgets_mod on budgets for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Budget Lines
create policy budget_lines_select on budget_lines for select using (organization_id = current_org_id());
create policy budget_lines_mod on budget_lines for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Attachments
create policy attachments_select on attachments for select using (organization_id = current_org_id());
create policy attachments_mod on attachments for insert, update, delete using (organization_id = current_org_id() and can_modify_accounting());

-- Notifications
create policy notifications_select on notifications for select using (organization_id = current_org_id());
create policy notifications_insert on notifications for insert with check (organization_id = current_org_id());
create policy notifications_update on notifications for update using (organization_id = current_org_id());

-- Profiles (Permite ver el propio o si eres admin)
create policy profiles_select on profiles for select using ((id = auth.uid() or has_role('ADMIN')) and organization_id = current_org_id());
create policy profiles_upsert on profiles for insert, update with check ((id = auth.uid() or has_role('ADMIN')) and organization_id = current_org_id());

-- User Roles
create policy user_roles_select on user_roles for select using (organization_id = current_org_id());
create policy user_roles_mod on user_roles for insert, update, delete using (has_role('ADMIN') and organization_id = current_org_id());

-- Audit Logs (Solo lectura para admins/auditores, Insert automático)
create policy audit_logs_select on audit_logs for select using (organization_id = current_org_id() and (has_role('ADMIN') or has_role('AUDITOR')));
create policy audit_logs_insert on audit_logs for insert with check (organization_id = current_org_id());

-- 7. Vistas contables y reportes

create or replace view v_account_balances as
select
  jl.organization_id,
  a.id as account_id,
  a.code,
  a.name,
  a.type,
  sum(jl.debit) as total_debits,
  sum(jl.credit) as total_credits,
  case
    when a.type in ('ASSET','EXPENSE') then coalesce(sum(jl.debit),0) - coalesce(sum(jl.credit),0)
    else coalesce(sum(jl.credit),0) - coalesce(sum(jl.debit),0)
  end as balance
from journal_lines jl
join accounts a on a.id = jl.account_id
group by jl.organization_id, a.id, a.code, a.name, a.type;

create or replace view v_balance_sheet as
select
  organization_id,
  sum(case when type = 'ASSET' then balance else 0 end) as total_activos,
  sum(case when type = 'LIABILITY' then balance else 0 end) as total_pasivos,
  sum(case when type = 'EQUITY' then balance else 0 end) as total_patrimonio
from v_account_balances
where organization_id is not null
group by organization_id;

create or replace view v_income_statement as
select
  organization_id,
  sum(case when type = 'INCOME' then balance else 0 end) as total_ingresos,
  sum(case when type = 'EXPENSE' then balance else 0 end) as total_gastos,
  sum(case when type = 'INCOME' then balance else 0 end) - sum(case when type = 'EXPENSE' then balance else 0 end) as utilidad_neta
from v_account_balances
where organization_id is not null
group by organization_id;

create or replace view v_ar_aging as
select
  organization_id,
  case
    when due_date >= current_date then 'Actual'
    when due_date >= current_date - interval '30 days' then '0-30'
    when due_date >= current_date - interval '60 days' then '31-60'
    when due_date >= current_date - interval '90 days' then '61-90'
    else '90+'
  end as bucket,
  sum(total) as amount,
  count(*) as invoices_count
from ar_invoices
where status not in ('PAID','VOID')
  and due_date < current_date
group by organization_id, bucket;

create or replace view v_ap_aging as
select
  organization_id,
  case
    when due_date >= current_date then 'Actual'
    when due_date >= current_date - interval '30 days' then '0-30'
    when due_date >= current_date - interval '60 days' then '31-60'
    when due_date >= current_date - interval '90 days' then '61-90'
    else '90+'
  end as bucket,
  sum(total) as amount,
  count(*) as bills_count
from ap_bills
where status not in ('PAID','VOID')
  and due_date < current_date
group by organization_id, bucket;

create or replace view v_budget_vs_actual as
select
  bl.organization_id,
  b.year,
  b.month,
  bl.category,
  bl.type,
  bl.planned_amount,
  case
    when bl.type = 'INCOME' then coalesce(inc_sum.value,0)
    else coalesce(exp_sum.value,0)
  end as actual_amount,
  bl.planned_amount - case when bl.type = 'INCOME' then coalesce(inc_sum.value,0) else coalesce(exp_sum.value,0) end as variance
from budget_lines bl
join budgets b on b.id = bl.budget_id
left join lateral (
  select sum(amount) as value
  from incomes i
  where i.organization_id = bl.organization_id
    and date_part('year', i.income_date)::int = b.year
    and date_part('month', i.income_date)::int = b.month
) inc_sum on true
left join lateral (
  select sum(amount) as value
  from expenses e
  where e.organization_id = bl.organization_id
    and date_part('year', e.expense_date)::int = b.year
    and date_part('month', e.expense_date)::int = b.month
) exp_sum on true;

-- 8. Función para crear notificaciones de facturas vencidas
create or replace function fn_enqueue_overdue_alerts() returns void language plpgsql as $$
declare
  user_org uuid := current_org_id();
begin
  if user_org is null then
    return;
  end if;

  insert into notifications (organization_id, kind, title, body, record_id)
  select
    organization_id,
    'AR_OVERDUE',
    'Factura vencida',
    format('Factura %s se venció el %s', number, due_date),
    id
  from ar_invoices
  where organization_id = user_org
    and due_date < current_date
    and status not in ('PAID','VOID')
    and not exists (
      select 1 from notifications n where n.record_id = ar_invoices.id and n.kind = 'AR_OVERDUE'
    );

  insert into notifications (organization_id, kind, title, body, record_id)
  select
    organization_id,
    'AP_OVERDUE',
    'Factura recibida vencida',
    format('Factura %s vencida el %s', number, due_date),
    id
  from ap_bills
  where organization_id = user_org
    and due_date < current_date
    and status not in ('PAID','VOID')
    and not exists (
      select 1 from notifications n where n.record_id = ap_bills.id and n.kind = 'AP_OVERDUE'
    );
end;
$$;