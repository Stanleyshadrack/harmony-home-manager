import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { TenantsApi } from '@/api/service/tenantsApi';
import { PropertyUnitsApi } from '@/api/service/PropertyUnitsApi';
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
  tenantId: z.number().int().positive('Please select a tenant'),
  unitId: z.number().int().positive('Please select a unit'),
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
  initialData?: Partial<InvoiceFormData>;
  isEditing?: boolean;
}

export function InvoiceForm({ onSubmit, onCancel, isLoading, initialData, isEditing }: InvoiceFormProps) {
  const { t } = useTranslation();
  const [tenantOptions, setTenantOptions] = useState<{id:number;name:string}[]>([]);
  const [unitOptions, setUnitOptions] = useState<{id:number;number:string}[]>([]);
  const [optionsError, setOptionsError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([TenantsApi.getAll(), PropertyUnitsApi.fetchAll()])
      .then(([tenants, units]) => {
        if (!active) return;
        setTenantOptions(tenants.map(t => ({id:Number(t.id),name:[t.firstName,t.lastName].filter(Boolean).join(' ') || t.email})));
        setUnitOptions(units.map(u => ({id:Number(u.id),number:u.unitNumber})));
      })
      .catch(e => {if(active) setOptionsError(e instanceof Error ? e.message : 'Unable to load tenant and unit options');});
    return () => {active = false;};
  }, []);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      tenantId: initialData?.tenantId ?? 0,
      unitId: initialData?.unitId ?? 0,
      type: initialData?.type || 'rent',
      description: initialData?.description || '',
      amount: initialData?.amount || 0,
      dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
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
        {optionsError && <p role="alert" className="text-destructive text-sm">{optionsError}</p>}
        <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select onValueChange={v => field.onChange(Number(v))} value={field.value > 0 ? String(field.value) : undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.id} value={String(tenant.id)}>
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
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.number}
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
          <Button type="submit" disabled={isLoading || !!optionsError}>
            {isLoading ? t('common.loading') : isEditing ? t('common.save') : t('billing.createInvoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
