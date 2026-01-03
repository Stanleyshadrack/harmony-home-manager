import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Landlord, SubscriptionPlan, SubscriptionPlanDetails } from '@/hooks/useLandlords';
import { User, Mail, Phone, Building2, Calendar } from 'lucide-react';

const landlordSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company: z.string().optional(),
  subscription: z.enum(['basic', 'premium', 'enterprise']),
  subscriptionEndDate: z.string().min(1, 'Subscription end date is required'),
});

type LandlordFormData = z.infer<typeof landlordSchema>;

interface LandlordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LandlordFormData) => void;
  landlord?: Landlord | null;
  subscriptionPlans: SubscriptionPlanDetails[];
  mode: 'add' | 'edit';
}

export function LandlordForm({
  open,
  onOpenChange,
  onSubmit,
  landlord,
  subscriptionPlans,
  mode,
}: LandlordFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    landlord?.subscription || 'basic'
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LandlordFormData>({
    resolver: zodResolver(landlordSchema),
    defaultValues: landlord
      ? {
          firstName: landlord.firstName,
          lastName: landlord.lastName,
          email: landlord.email,
          phone: landlord.phone,
          company: landlord.company || '',
          subscription: landlord.subscription,
          subscriptionEndDate: landlord.subscriptionEndDate.split('T')[0],
        }
      : {
          subscription: 'basic',
          subscriptionEndDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
        },
  });

  const handleFormSubmit = (data: LandlordFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  const plan = subscriptionPlans.find((p) => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Landlord' : 'Edit Landlord'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new landlord account with subscription'
              : 'Update landlord information and subscription'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                  className="pl-9"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Doe"
                  className="pl-9"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className="pl-9"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+254 700 000 000"
                className="pl-9"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company"
                {...register('company')}
                placeholder="Company Name"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select
              value={selectedPlan}
              onValueChange={(value: SubscriptionPlan) => {
                setSelectedPlan(value);
                setValue('subscription', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - ${p.price}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plan && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                <p>Max {plan.maxProperties} properties, {plan.maxUnits} units</p>
                <ul className="list-disc list-inside mt-1">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscriptionEndDate">Subscription End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="subscriptionEndDate"
                type="date"
                {...register('subscriptionEndDate')}
                className="pl-9"
              />
            </div>
            {errors.subscriptionEndDate && (
              <p className="text-sm text-destructive">
                {errors.subscriptionEndDate.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === 'add' ? 'Add Landlord' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
