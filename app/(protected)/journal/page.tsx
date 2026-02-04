'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth';

type JournalEntry = {
  id: string;
  entry_date: string;
  memo: string | null;
  ref_type: string | null;
  ref_id: string | null;
};

const fetchJournalEntries = async (organizationId: string | null) => {
  if (!organizationId) return [];
  const { data } = await supabaseBrowser
    .from('journal_entries')
    .select('id, entry_date, memo, ref_type')
    .eq('organization_id', organizationId)
    .order('entry_date', { ascending: false })
    .limit(25);
  return data ?? [];
};

export default function JournalPage() {
  const { organizationId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['journal', organizationId],
    queryFn: () => fetchJournalEntries(organizationId),
    enabled: Boolean(organizationId)
  });

  return (
    <section>
      <h2 className="mb-3">Libro Diario</h2>
      <p className="text-muted">Asientos generados automáticamente por ingresos, gastos y facturas.</p>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3}>Cargando registros...</td>
              </tr>
            )}
            {data?.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.entry_date}</td>
                <td>{entry.ref_type ?? 'Sistema'}</td>
                <td>{entry.memo ?? '—'}</td>
              </tr>
            ))}
            {!isLoading && !data?.length && (
              <tr>
                <td colSpan={3}>Todavía no se ha generado un asiento.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
