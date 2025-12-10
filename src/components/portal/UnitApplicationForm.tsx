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
import { Unit } from '@/types/property';
import { UnitApplicationFormData } from '@/types/application';

const applicationSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  applicantName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  applicantEmail: z.string().email('Invalid email address'),
  applicantPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
  monthlyIncome: z.number().min(0, 'Income must be a positive number'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
  message: z.string().max(500).optional(),
});

interface UnitApplicationFormProps {
  units: Unit[];
  onSubmit: (data: UnitApplicationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedUnitId?: string;
}

export function UnitApplicationForm({
  units,
  onSubmit,
  onCancel,
  isLoading,
  preselectedUnitId,
}: UnitApplicationFormProps) {
  const { t } = useTranslation();

  const form = useForm<UnitApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      unitId: preselectedUnitId || '',
      applicantName: '',
      applicantEmail: '',
      applicantPhone: '',
      employmentStatus: 'employed',
      monthlyIncome: 0,
      moveInDate: '',
      message: '',
    },
  });

  const employmentOptions = [
    { value: 'employed', label: 'Employed' },
    { value: 'self_employed', label: 'Self Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
    { value: 'student', label: 'Student' },
  ];

  const vacantUnits = units.filter((u) => u.status === 'vacant');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a unit to apply for" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vacantUnits.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No vacant units available
                    </SelectItem>
                  ) : (
                    vacantUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber} - {unit.bedrooms} BR - {formatCurrency(unit.monthlyRent)}/mo
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="applicantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicantEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="applicantPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+254 712 345 678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employmentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5000"
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
            name="moveInDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Move-in Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a bit about yourself or any special requirements..."
                  className="min-h-[80px]"
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
          <Button type="submit" disabled={isLoading || vacantUnits.length === 0}>
            {isLoading ? t('common.loading') : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
