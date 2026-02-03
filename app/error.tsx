'use client';

export default function GlobalError({ error }: { error: Error }) {
  console.error(error);
  return (
    <html>
      <body>
        <div className="p-6">
          <h1 className="text-xl font-semibold">Ocurrio un error</h1>
          <p className="text-sm text-slate-600">Revisa la consola para mas detalles.</p>
        </div>
      </body>
    </html>
  );
}
