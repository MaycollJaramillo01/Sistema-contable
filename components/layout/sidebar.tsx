'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/accounts', label: 'Cuentas Contables' },
  { href: '/app/journal', label: 'Asientos' },
  { href: '/app/ar', label: 'Cuentas por Cobrar' },
  { href: '/app/ap', label: 'Cuentas por Pagar' },
  { href: '/app/income', label: 'Ingresos' },
  { href: '/app/expenses', label: 'Gastos' },
  { href: '/app/invoices', label: 'Facturación' },
  { href: '/app/budgets', label: 'Presupuesto' },
  { href: '/app/reports', label: 'Reportes' },
  { href: '/app/queries', label: 'Consultas' },
  { href: '/app/maintenance', label: 'Mantenimientos' },
  { href: '/app/security', label: 'Seguridad' }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="p-4 text-lg font-semibold text-brand-700">Asociaciones</div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100',
              pathname === item.href && 'bg-brand-50 text-brand-700'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
