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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WaterReadingFormData } from '@/types/billing';

const waterReadingSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  meterId: z.string().min(1, 'Meter ID is required'),
  previousReading: z.number().min(0, 'Previous reading must be 0 or greater'),
  currentReading: z.number().min(0, 'Current reading must be 0 or greater'),
  ratePerUnit: z.number().min(0.01, 'Rate must be greater than 0'),
  readingDate: z.string().min(1, 'Reading date is required'),
  billingPeriod: z.string().min(1, 'Billing period is required'),
}).refine((data) => data.currentReading >= data.previousReading, {
  message: 'Current reading must be greater than or equal to previous reading',
  path: ['currentReading'],
});

interface WaterReadingFormProps {
  onSubmit: (data: WaterReadingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Mock unit data with meter info
const mockUnits = [
  { id: 'u1', number: 'A101', meterId: 'WM-001', propertyName: 'Sunrise Apartments', tenantName: 'John Doe', lastReading: 1295 },
  { id: 'u2', number: 'B202', meterId: 'WM-002', propertyName: 'Sunrise Apartments', tenantName: 'Jane Smith', lastReading: 850 },
  { id: 'u3', number: 'C303', meterId: 'WM-003', propertyName: 'Ocean View Towers', tenantName: 'Mike Johnson', lastReading: 1100 },
];

export function WaterReadingForm({ onSubmit, onCancel, isLoading }: WaterReadingFormProps) {
  const { t } = useTranslation();

  const form = useForm<WaterReadingFormData>({
    resolver: zodResolver(waterReadingSchema),
    defaultValues: {
      unitId: '',
      meterId: '',
      previousReading: 0,
      currentReading: 0,
      ratePerUnit: 1.00,
      readingDate: new Date().toISOString().split('T')[0],
      billingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },
  });

  const selectedUnitId = form.watch('unitId');
  const previousReading = form.watch('previousReading');
  const currentReading = form.watch('currentReading');
  const ratePerUnit = form.watch('ratePerUnit');

  const consumption = Math.max(0, currentReading - previousReading);
  const estimatedBill = consumption * ratePerUnit;

  const handleUnitChange = (unitId: string) => {
    const unit = mockUnits.find((u) => u.id === unitId);
    if (unit) {
      form.setValue('meterId', unit.meterId);
      form.setValue('previousReading', unit.lastReading);
    }
  };

  const handleSubmit = (data: WaterReadingFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('units.title')}</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  handleUnitChange(value);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.number} - {unit.tenantName} ({unit.propertyName})
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
          name="meterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('units.meterId')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., WM-001" 
                  {...field} 
                  readOnly={!!selectedUnitId}
                  className={selectedUnitId ? 'bg-muted' : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="previousReading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Reading</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
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
            name="currentReading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Reading</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ratePerUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate per Unit ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="1.00" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Price per unit of water consumption</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="readingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billingPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Period</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., January 2024" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {currentReading > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm font-medium text-info mb-2">Bill Preview</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consumption:</span>
                <span className="font-medium">{consumption} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Bill:</span>
                <span className="font-semibold">${estimatedBill.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : 'Generate Water Bill'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
