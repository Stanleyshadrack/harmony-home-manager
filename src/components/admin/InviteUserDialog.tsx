import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { UserPlus, Loader2, Mail, User, Building2, Wrench } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { inviteUserService } from '@/api/service/invite.user.service.api';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['tenant', 'employee', 'landlord']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviterRole: UserRole;
}

const roleOptions = [
  { value: 'tenant', label: 'Tenant', icon: User, description: 'Renter of property units' },
  { value: 'employee', label: 'Employee', icon: Wrench, description: 'Staff member for maintenance' },
  { value: 'landlord', label: 'Landlord', icon: Building2, description: 'Property owner (Admin only)' },
];

const roleMap = {
  tenant: 'TENANT',
  employee: 'EMPLOYEE',
  landlord: 'LANDLORD',
} as const;

export function InviteUserDialog({
  open,
  onOpenChange,
  inviterRole,
}: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'tenant' },
  });

  const selectedRole = watch('role');

  const availableRoles = roleOptions.filter(role => {
    if (inviterRole === 'super_admin') return true;
    if (inviterRole === 'landlord') return role.value !== 'landlord';
    return false;
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    try {
      await inviteUserService({
        email: data.email,
        role: roleMap[data.role],
      });

      toast.success('Invitation sent!', {
        description: `An invitation email has been sent to ${data.email}`,
      });

      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="user@example.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue('role', value as InviteFormData['role'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4" />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {roleOptions.find(r => r.value === selectedRole)?.description}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
