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
import type { InvoiceFormData, InvoiceType } from '@/types/billing';

const invoiceSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant'),
  unitId: z.string().min(1, 'Please select a unit'),
  type: z.enum(['rent', 'water', 'utilities', 'late_fee', 'other'], {
    required_error: 'Please select an invoice type',
  }),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Please enter a valid amount',
  }).min(0.01, 'Amount must be at least 0.01'),
  dueDate: z.string().min(1, 'Please select a due date'),
});

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Mock tenant and unit data
const mockTenants = [
  { id: 't1', name: 'John Doe', unitId: 'u1' },
  { id: 't2', name: 'Jane Smith', unitId: 'u2' },
  { id: 't3', name: 'Mike Johnson', unitId: 'u3' },
];

const mockUnits = [
  { id: 'u1', number: 'A101', propertyName: 'Sunrise Apartments' },
  { id: 'u2', number: 'B202', propertyName: 'Sunrise Apartments' },
  { id: 'u3', number: 'C303', propertyName: 'Ocean View Towers' },
];

export function InvoiceForm({ onSubmit, onCancel, isLoading }: InvoiceFormProps) {
  const { t } = useTranslation();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      tenantId: '',
      unitId: '',
      type: 'rent',
      description: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const invoiceTypes: { value: InvoiceType; label: string }[] = [
    { value: 'rent', label: t('billing.rent') },
    { value: 'water', label: t('billing.water') },
    { value: 'utilities', label: t('billing.utilities') },
    { value: 'late_fee', label: t('billing.lateFee') },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (data: InvoiceFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
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
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('units.title')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.number} - {unit.propertyName}
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {invoiceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.description')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter invoice description" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('billing.dueDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
            {isLoading ? t('common.loading') : t('billing.createInvoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
