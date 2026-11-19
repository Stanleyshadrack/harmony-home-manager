import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/types/billing';

const schema = z.object({
  invoiceId: z.string().min(1, 'Select an unpaid invoice'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.literal('mpesa'),
  phoneNumber: z.string().min(10, 'Enter a valid M-Pesa phone number'),
  reference: z.string().optional(),
});
type PaymentFormData = z.infer<typeof schema>;

export function TenantPaymentForm({ invoices, onSubmit, isLoading }: {
  invoices: Invoice[];
  onSubmit: (data: PaymentFormData) => void | Promise<void>;
  isLoading?: boolean;
}) {
  const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.balance > 0);
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {invoiceId: '', amount: 0, paymentMethod: 'mpesa', phoneNumber: '', reference: ''},
  });
  const chosen = unpaid.find(i => String(i.id) === form.watch('invoiceId'));
  const money = (value: number) => new Intl.NumberFormat('en-KE', {
    style:'currency', currency:'KES', maximumFractionDigits:2,
  }).format(value);

  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Smartphone className="h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold">M-Pesa STK Push</p>
          <p className="text-xs text-muted-foreground">Confirm on your phone. Payment stays pending until the provider verifies it.</p>
        </div>
      </div>
      <FormField control={form.control} name="invoiceId" render={({field}) => (
        <FormItem>
          <FormLabel>Invoice to pay</FormLabel>
          <Select value={field.value} onValueChange={value => {
            field.onChange(value);
            const inv = unpaid.find(i => String(i.id) === value);
            form.setValue('amount', inv?.balance ?? 0);
          }}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select unpaid invoice" /></SelectTrigger></FormControl>
            <SelectContent>{unpaid.length === 0
              ? <SelectItem value="none" disabled>No outstanding invoices</SelectItem>
              : unpaid.map(i => <SelectItem key={i.id} value={String(i.id)}>
                  {i.invoiceNumber} — {money(i.balance)}
                </SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage/>
        </FormItem>
      )}/>
      {chosen && <Card className="bg-muted/30">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Invoice summary</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Invoice: {chosen.invoiceNumber}</p>
          <p>Balance: <strong>{money(chosen.balance)}</strong></p>
        </CardContent>
      </Card>}
      <FormField control={form.control} name="amount" render={({field}) => (
        <FormItem><FormLabel>Amount (KES)</FormLabel>
          <FormControl><Input type="number" min="1" step="0.01" max={chosen?.balance}
            value={field.value} onChange={e => field.onChange(Number(e.target.value))}/></FormControl>
          <FormMessage/>
        </FormItem>
      )}/>
      <FormField control={form.control} name="phoneNumber" render={({field}) => (
        <FormItem><FormLabel>M-Pesa phone number</FormLabel>
          <FormControl><Input type="tel" placeholder="07XXXXXXXX or 2547XXXXXXXX" {...field}/></FormControl>
          <FormMessage/>
        </FormItem>
      )}/>
      <Button type="submit" className="w-full" disabled={isLoading || !chosen ||
          form.watch('amount') <= 0 || form.watch('amount') > (chosen?.balance ?? 0)}>
        {isLoading ? 'Sending STK request…' : `Request M-Pesa payment · ${money(form.watch('amount') || 0)}`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Do not retry repeatedly. Confirm the M-Pesa prompt or check the invoice status first.
        Card and manual bank-transfer verification are not enabled in this form.
      </p>
    </form>
  </Form>;
}
