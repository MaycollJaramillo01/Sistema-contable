'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  date: z.string(),
  description: z.string().min(3)
});

type FormValues = z.infer<typeof schema>;

export default function JournalPage() {
  const { register, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    console.log('journal entry draft', values);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Asientos contables</h1>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" {...register('date')} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input {...register('description')} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Guardar borrador</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
