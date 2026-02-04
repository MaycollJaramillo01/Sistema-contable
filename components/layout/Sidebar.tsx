'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Cuentas Contables', href: '/accounts' },
  { label: 'Libro Diario', href: '/journal' },
  { label: 'CxC', href: '/ar' },
  { label: 'CxP', href: '/ap' },
  { label: 'Ingresos', href: '/incomes' },
  { label: 'Gastos', href: '/expenses' },
  { label: 'Facturación', href: '/billing' },
  { label: 'Presupuestos', href: '/budgets' },
  { label: 'Mantenimientos', href: '/maintenance' },
  { label: 'Consultas', href: '/queries' },
  { label: 'Reportes', href: '/reports' },
  { label: 'Seguridad', href: '/security' }
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <nav className="sidebar-fixed p-3">
      <div className="mb-4">
        <Link href="/dashboard" className="d-flex align-items-center text-decoration-none">
          <span className="fs-5 fw-semibold">Asociaciones</span>
        </Link>
      </div>
      <div className="list-group">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`list-group-item list-group-item-action ${
              pathname === section.href ? 'active' : ''
            }`}
            aria-current={pathname === section.href ? 'page' : undefined}
          >
            {section.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
