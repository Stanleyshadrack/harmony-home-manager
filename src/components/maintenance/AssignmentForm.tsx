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
import type { AssignmentFormData, MaintenanceRequest } from '@/types/maintenance';

const assignmentSchema = z.object({
  requestId: z.string(),
  assignedTo: z.string().min(1, 'Please select an employee'),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

interface AssignmentFormProps {
  request: MaintenanceRequest;
  employees: { id: string; name: string; specialty: string }[];
  onSubmit: (data: AssignmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssignmentForm({ request, employees, onSubmit, onCancel, isLoading }: AssignmentFormProps) {
  const { t } = useTranslation();

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      requestId: request.id,
      assignedTo: '',
      scheduledDate: '',
      estimatedCost: undefined,
      notes: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium">{request.ticketNumber}</p>
          <p className="text-sm text-muted-foreground">{request.title}</p>
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <span>{request.propertyName}</span>
            <span>•</span>
            <span>Unit {request.unitNumber}</span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee or contractor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.specialty})
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
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('maintenance.estimatedCost')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
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
              <FormLabel>{t('common.notes')}</FormLabel>
              <FormControl>
                <Textarea placeholder="Add notes for the assignee..." {...field} />
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
            {isLoading ? t('common.loading') : 'Assign Request'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
