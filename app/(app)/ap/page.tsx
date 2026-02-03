'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAp } from '@/features/ap/use-ap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const billSchema = z.object({
  number: z.string().min(1),
  date: z.string(),
  due_date: z.string(),
  total: z.coerce.number().positive()
});

const paymentSchema = z.object({
  bill_id: z.string().min(1),
  date: z.string(),
  amount: z.coerce.number().positive()
});

export default function ApPage() {
  const { bills, createBill, registerPayment } = useAp();
  const billForm = useForm({ resolver: zodResolver(billSchema) });
  const paymentForm = useForm({ resolver: zodResolver(paymentSchema) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cuentas por pagar</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">Nueva factura proveedor</h2>
            <form
              onSubmit={billForm.handleSubmit((values) => createBill.mutate(values))}
              className="space-y-2"
            >
              <Input placeholder="Número" {...billForm.register('number')} />
              <Input type="date" {...billForm.register('date')} />
              <Input type="date" {...billForm.register('due_date')} />
              <Input type="number" step="0.01" placeholder="Total" {...billForm.register('total')} />
              <Button type="submit">Registrar</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">Registrar pago</h2>
            <form
              onSubmit={paymentForm.handleSubmit((values) => registerPayment.mutate(values))}
              className="space-y-2"
            >
              <Input placeholder="ID Factura" {...paymentForm.register('bill_id')} />
              <Input type="date" {...paymentForm.register('date')} />
              <Input type="number" step="0.01" placeholder="Monto" {...paymentForm.register('amount')} />
              <Button type="submit">Aplicar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Facturas</h2>
        <ul className="mt-2 space-y-2">
          {(bills.data ?? []).map((bill) => (
            <li key={bill.id} className="rounded border border-slate-200 bg-white p-3">
              <div className="flex justify-between">
                <span>{bill.number}</span>
                <span className="text-sm text-slate-600">{bill.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
