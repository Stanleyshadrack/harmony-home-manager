import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaymentFormData, PaymentMethod, Invoice } from '@/types/billing';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['mpesa', 'card', 'bank', 'cash']),
  transactionRef: z.string().min(1, 'Transaction reference is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

interface PaymentFormProps {
  invoice?: Invoice;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PaymentForm({ invoice, onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const { t } = useTranslation();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: invoice?.id || '',
      amount: invoice?.balance || 0,
      paymentMethod: 'mpesa',
      transactionRef: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'mpesa', label: t('billing.mpesa') },
    { value: 'card', label: t('billing.card') },
    { value: 'bank', label: t('billing.bank') },
    { value: 'cash', label: t('billing.cash') },
  ];

  const handleSubmit = (data: PaymentFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {invoice && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">Outstanding Balance:</span>
              <span className="font-semibold text-destructive">
                ${invoice.balance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.amount')}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('billing.paymentMethod')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transactionRef"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Reference</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., MPE123456789" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.notes')} (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any notes about this payment" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
