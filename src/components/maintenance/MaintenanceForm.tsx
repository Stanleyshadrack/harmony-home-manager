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
import type { MaintenanceFormData, MaintenanceCategory, MaintenancePriority } from '@/types/maintenance';
import type { MaintenanceUnitOption } from '@/api/service/maintenanceApi';

const maintenanceSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'cleaning', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
});

interface MaintenanceFormProps {
  onSubmit: (data: MaintenanceFormData) => void | Promise<void>;
  units: MaintenanceUnitOption[];
  onCancel: () => void;
  isLoading?: boolean;
}

export function MaintenanceForm({ onSubmit, onCancel, isLoading, units }: MaintenanceFormProps) {
  const { t } = useTranslation();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      unitId: '',
      category: 'other',
      priority: 'medium',
      title: '',
      description: '',
    },
  });

  const categories: { value: MaintenanceCategory; label: string }[] = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC / Air Conditioning' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' },
    { value: 'pest', label: 'Pest Control' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'other', label: 'Other' },
  ];

  const priorities: { value: MaintenancePriority; label: string }[] = [
    { value: 'low', label: t('maintenance.low') },
    { value: 'medium', label: t('maintenance.medium') },
    { value: 'high', label: t('maintenance.high') },
    { value: 'urgent', label: t('maintenance.urgent') },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 max-w-full space-y-4">
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
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.unitNumber} - {unit.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {units.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No actively occupied unit is assigned to your tenant account.
                  Contact your landlord before reporting maintenance.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('maintenance.category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('maintenance.priority')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of the issue" {...field} />
              </FormControl>
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
                  placeholder="Provide detailed description of the issue..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading || units.length === 0}>
            {isLoading ? t('common.loading') : t('maintenance.newRequest')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
