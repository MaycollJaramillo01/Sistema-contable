'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAr } from '@/features/ar/use-ar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const invoiceSchema = z.object({
  number: z.string().min(1),
  date: z.string(),
  due_date: z.string(),
  total: z.coerce.number().positive()
});

const paymentSchema = z.object({
  invoice_id: z.string().min(1),
  date: z.string(),
  amount: z.coerce.number().positive()
});

export default function ArPage() {
  const { invoices, createInvoice, registerPayment } = useAr();
  const invoiceForm = useForm({ resolver: zodResolver(invoiceSchema) });
  const paymentForm = useForm({ resolver: zodResolver(paymentSchema) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cuentas por cobrar</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">Nueva factura</h2>
            <form
              onSubmit={invoiceForm.handleSubmit((values) => createInvoice.mutate(values))}
              className="space-y-2"
            >
              <Input placeholder="Número" {...invoiceForm.register('number')} />
              <Input type="date" {...invoiceForm.register('date')} />
              <Input type="date" {...invoiceForm.register('due_date')} />
              <Input type="number" step="0.01" placeholder="Total" {...invoiceForm.register('total')} />
              <Button type="submit">Emitir</Button>
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
              <Input placeholder="ID Factura" {...paymentForm.register('invoice_id')} />
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
          {(invoices.data ?? []).map((inv) => (
            <li key={inv.id} className="rounded border border-slate-200 bg-white p-3">
              <div className="flex justify-between">
                <span>{inv.number}</span>
                <span className="text-sm text-slate-600">{inv.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
