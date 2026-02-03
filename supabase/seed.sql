-- Seed data
insert into orgs (id, name, location) values ('11111111-1111-1111-1111-111111111111', 'Asociacion Demo', 'San Jose');

insert into chart_accounts (org_id, code, name, type)
values
  ('11111111-1111-1111-1111-111111111111', '1-01', 'Caja', 'ACTIVO'),
  ('11111111-1111-1111-1111-111111111111', '4-01', 'Ingresos por donaciones', 'INGRESO'),
  ('11111111-1111-1111-1111-111111111111', '5-01', 'Gastos operativos', 'GASTO');

insert into expense_categories (org_id, name, default_limit_monthly)
values ('11111111-1111-1111-1111-111111111111', 'Operaciones', 5000);

insert into budgets (org_id, year, month, status)
values ('11111111-1111-1111-1111-111111111111', 2026, 2, 'active');

insert into budget_lines (budget_id, planned_amount)
select id, 2000 from budgets where org_id = '11111111-1111-1111-1111-111111111111';
