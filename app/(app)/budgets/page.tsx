'use client';

import { useState } from 'react';
import { useBudget } from '@/features/budgets/use-budgets';
import { Card, CardContent } from '@/components/ui/card';

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data } = useBudget(month, year);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Presupuesto mensual</h1>
      <div className="flex gap-2">
        <input
          className="h-9 rounded-md border border-slate-200 px-2"
          type="number"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        />
        <input
          className="h-9 rounded-md border border-slate-200 px-2"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>
      <Card>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-600">Planificado</p>
              <p className="text-xl font-semibold">{data?.planned ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Ejecutado</p>
              <p className="text-xl font-semibold">{data?.executed ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Diferencia</p>
              <p className="text-xl font-semibold">{data?.variance ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
