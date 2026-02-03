'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIncome } from '@/features/income/use-income';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  date: z.string(),
  amount: z.coerce.number().positive(),
  source_type: z.string(),
  note: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function IncomePage() {
  const { list, create } = useIncome();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ingresos</h1>
      <Card>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            className="grid gap-2 md:grid-cols-4"
          >
            <Input type="date" {...form.register('date')} />
            <Input type="number" step="0.01" placeholder="Monto" {...form.register('amount')} />
            <Input placeholder="Fuente" {...form.register('source_type')} />
            <Input placeholder="Nota" {...form.register('note')} />
            <Button type="submit">Registrar</Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {(list.data ?? []).map((row) => (
          <li key={row.id} className="rounded border border-slate-200 bg-white p-3">
            <div className="flex justify-between">
              <span>{row.source_type}</span>
              <span>{row.amount}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
