'use client';

const reports = [
  { name: 'Balance General', description: 'Activo vs pasivo y patrimonio a la fecha.' },
  { name: 'Estado de Resultados', description: 'Ingresos y gastos mensuales.' },
  { name: 'CxC Aging', description: 'Detalle de antigüedad de cuentas por cobrar.' },
  { name: 'CxP Aging', description: 'Detalle de antigüedad de cuentas por pagar.' },
  { name: 'Presupuesto vs Real', description: 'Comparativo entre plan y ejecución mensual.' },
  { name: 'Libro Diario', description: 'Resumen de asientos contables.' },
  { name: 'Mayor por cuenta', description: 'Movimientos por cada cuenta contable.' }
];

const downloadCsv = (reportName: string) => {
  const csv = 'Fecha,Cuenta,Débito,Crédito\n2025-01-31,1000-1,1000,0';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  return (
    <section>
      <h2 className="mb-3">Reportes financieros</h2>
      <p className="text-muted">Exporta en CSV y utiliza la vista imprimible en cada reporte.</p>

      <div className="row g-3">
        {reports.map((report) => (
          <article key={report.name} className="col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{report.name}</h5>
                <p className="card-text flex-grow-1">{report.description}</p>
                <div className="btn-group" role="group" aria-label={`${report.name} acciones`}>
                  <button type="button" className="btn btn-outline-primary" onClick={() => downloadCsv(report.name)}>
                    Exportar CSV
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>
                    Vista imprimible
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
