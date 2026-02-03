import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';

export function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-semibold">{formatMoney(value)}</p>
      </CardContent>
    </Card>
  );
}
