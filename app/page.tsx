import Link from 'next/link';

const modules = [
  'Cuentas Contables',
  'Cuentas por Cobrar',
  'Cuentas por Pagar',
  'Ingresos',
  'Gastos',
  'Facturación',
  'Presupuestos',
  'Mantenimientos',
  'Consultas',
  'Reportes',
  'Seguridad'
];

export default function HomePage() {
  return (
    <div className="container py-5">
      <h1 className="display-5">Sistema Contable para Asociaciones Comunales</h1>
      <p className="lead">
        Controla ingresos, gastos, facturas y presupuestos en una sola plataforma multi-organización con
        auditoría, doble partida y reportes imprimibles.
      </p>

      <div className="row g-3 mt-4">
        {modules.map((module) => (
          <article key={module} className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{module}</h5>
                <p className="card-text">Accede al panel especializado en esta área.</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <Link href="/login" passHref>
          <button type="button" className="btn btn-primary btn-lg">
            Iniciar sesión
          </button>
        </Link>
      </div>
    </div>
  );
}
