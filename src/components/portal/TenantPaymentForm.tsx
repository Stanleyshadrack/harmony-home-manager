import { useEffect } from 'react';
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
  invoiceId: z.string().min(1, 'Select an invoice or Pay in Advance'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.literal('mpesa'),
  phoneNumber: z.string().min(10, 'Enter a valid M-Pesa phone number'),
  reference: z.string().optional(),
  propertyId: z.string().optional(),
});
type PaymentFormData = z.infer<typeof schema>;

export function TenantPaymentForm({ invoices, onSubmit, isLoading, selectedInvoiceId, eligibleProperties = [] }: {
  invoices: Invoice[];
  onSubmit: (data: PaymentFormData) => void | Promise<void>;
  isLoading?: boolean;
  selectedInvoiceId?: number | null;
  eligibleProperties?: {id:number;name:string}[];
}) {
  const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.balance > 0);
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {invoiceId: 'advance', amount: 0, paymentMethod: 'mpesa', phoneNumber: '', reference: '', propertyId: ''},
  });
  useEffect(() => {
    if (selectedInvoiceId == null) return;
    const invoice = unpaid.find(i => i.id === selectedInvoiceId);
    if (invoice) {
      form.setValue('invoiceId', String(invoice.id), { shouldValidate: true });
      form.setValue('amount', invoice.balance, { shouldValidate: true });
    }
  }, [selectedInvoiceId, invoices, form]);
  const selected = form.watch('invoiceId');
  const isAdvance = selected === 'advance';
  const chosen = unpaid.find(i => String(i.id) === selected);
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
          <FormLabel>Payment destination</FormLabel>
          <Select value={field.value} onValueChange={value => {
            field.onChange(value);
            const inv = unpaid.find(i => String(i.id) === value);
            form.setValue('amount', inv?.balance ?? 0);
          }}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select unpaid invoice" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="advance">Pay in Advance — account credit (no invoice needed)</SelectItem>
              {unpaid.map(i => <SelectItem key={i.id} value={String(i.id)}>
                {i.invoiceNumber} — {money(i.balance)}
              </SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage/>
        </FormItem>
      )}/>
      {isAdvance && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <p className="font-medium">Pay even when no invoice exists</p>
        <p className="mt-1 text-muted-foreground">Once M-Pesa confirms your payment, it becomes available account credit. Future eligible invoices can use this credit. A pending payment is not yet credit.</p>
      </div>}
      {isAdvance && eligibleProperties.length > 1 &&
        <FormField control={form.control} name="propertyId" render={({field}) => (
          <FormItem>
            <FormLabel>Property receiving the credit</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="Choose your property"/></SelectTrigger></FormControl>
              <SelectContent>
                {eligibleProperties.map(property =>
                  <SelectItem key={property.id} value={String(property.id)}>{property.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage/>
          </FormItem>
        )}/>
      }
      {isAdvance && eligibleProperties.length === 0 && <p className="text-xs text-muted-foreground">
        You can pay before a property is assigned. The credit will remain unallocated until a single eligible property is assigned.
      </p>}
      {chosen && <Card className="bg-muted/30">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Invoice summary</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Invoice: {chosen.invoiceNumber}</p>
          <p>Balance: <strong>{money(chosen.balance)}</strong></p>
        </CardContent>
      </Card>}
      <FormField control={form.control} name="amount" render={({field}) => (
        <FormItem><FormLabel>Amount (KES)</FormLabel>
          <FormControl><Input type="number" min="1" step="1" max={chosen?.balance}
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
      <Button type="submit" className="w-full" disabled={isLoading ||
          (isAdvance && eligibleProperties.length > 1 && !form.watch('propertyId')) ||
          (!isAdvance && !chosen) ||
          !Number.isInteger(form.watch('amount')) || form.watch('amount') <= 0 ||
          (!isAdvance && form.watch('amount') > (chosen?.balance ?? 0))}>
        {isLoading ? 'Sending STK request…' : `Request M-Pesa payment · ${money(form.watch('amount') || 0)}`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Do not retry repeatedly. Confirm the M-Pesa prompt or check the invoice status first.
        Card and manual bank-transfer verification are not enabled in this form.
      </p>
    </form>
  </Form>;
}
