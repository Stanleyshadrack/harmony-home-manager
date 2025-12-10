import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import { Invoice } from '@/types/billing';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['mpesa', 'card', 'bank_transfer']),
  phoneNumber: z.string().optional(),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface TenantPaymentFormProps {
  invoices: Invoice[];
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
}

const paymentMethods = [
  { value: 'mpesa', label: 'M-PESA', icon: Smartphone },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
];

export function TenantPaymentForm({ invoices, onSubmit, isLoading }: TenantPaymentFormProps) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string>('mpesa');

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'cancelled'
  );

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
      paymentMethod: 'mpesa',
      phoneNumber: '',
      reference: '',
    },
  });

  const selectedInvoice = unpaidInvoices.find(
    (inv) => inv.id === form.watch('invoiceId')
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = unpaidInvoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      form.setValue('amount', invoice.balance);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Invoice to Pay</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleInvoiceChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an invoice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unpaidInvoices.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No unpaid invoices
                    </SelectItem>
                  ) : (
                    unpaidInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {formatCurrency(invoice.balance)} ({invoice.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedInvoice && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Description:</span> {selectedInvoice.description}</p>
              <p><span className="text-muted-foreground">Total Amount:</span> {formatCurrency(selectedInvoice.amount)}</p>
              <p><span className="text-muted-foreground">Balance Due:</span> <span className="font-semibold text-destructive">{formatCurrency(selectedInvoice.balance)}</span></p>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
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
              <FormLabel>Payment Method</FormLabel>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = field.value === method.value;
                  return (
                    <Card
                      key={method.value}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => {
                        field.onChange(method.value);
                        setSelectedMethod(method.value);
                      }}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                          {method.label}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMethod === 'mpesa' && (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>M-PESA Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+254 7XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedMethod === 'bank_transfer' && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-sm space-y-2">
              <p className="font-medium">Bank Transfer Details:</p>
              <p><span className="text-muted-foreground">Bank:</span> Example Bank</p>
              <p><span className="text-muted-foreground">Account:</span> 1234567890</p>
              <p><span className="text-muted-foreground">Reference:</span> {selectedInvoice?.invoiceNumber || 'INV-XXXX'}</p>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || unpaidInvoices.length === 0}
        >
          {isLoading ? t('common.loading') : `Pay ${formatCurrency(form.watch('amount') || 0)}`}
        </Button>
      </form>
    </Form>
  );
}
