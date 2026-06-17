import { useEffect, useState } from 'react';
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
import { useProperties, useUnits } from '@/hooks/useProperties';
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
import { useGetCompanies } from '@/hooks/useCompanies';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['tenant', 'employee', 'landlord']),
  companyId: z.coerce.number().optional(),
  apartmentIds: z.array(z.string()).optional(),
  unitId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'tenant') {
    if (!data.apartmentIds || data.apartmentIds.length === 0) {
      ctx.addIssue({
        path: ['apartmentIds'],
        message: 'Apartment is required',
        code: 'custom',
      });
    }

    if (!data.unitId) {
      ctx.addIssue({
        path: ['unitId'],
        message: 'Unit is required',
        code: 'custom',
      });
    }
  }

  if (data.role === 'landlord') {
    if (!data.apartmentIds || data.apartmentIds.length === 0) {
      ctx.addIssue({
        path: ['apartmentIds'],
        message: 'At least one apartment is required',
        code: 'custom',
      });
    }
  }
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
  { value: 'landlord', label: 'Landlord', icon: Building2, description: 'Property manager or co-owner' },
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
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  
  const { properties } = useProperties();
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();

  const selectedApartmentForTenant = selectedApartments[0];
  const { units } = useUnits(selectedApartmentForTenant);

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
  const selectedCompanyId = watch('companyId');

  // 🔥 Allow landlords to invite other landlords (co-managers)
  const availableRoles = roleOptions.filter(role => {
    if (inviterRole === 'super_admin') return true;
    if (inviterRole === 'landlord') return true; 
    return false;
  });

// 🔥 Filter properties dynamically
  const filteredProperties = properties?.filter(property => {
    if (inviterRole === 'super_admin' && selectedRole === 'landlord') {
      // 🔥 Cast both to String to prevent number/string === mismatch bugs
      return selectedCompanyId 
        ? String(property.companyId) === String(selectedCompanyId) 
        : false;
    }
    // Landlords (or Super Admins inviting tenants/employees) see all properties available to them
    return true;
  }) || [];

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);

    try {
      let payload: any = {
        email: data.email,
        role: roleMap[data.role],
      };

      if (inviterRole === 'super_admin' && data.role === 'landlord') {
        if (!data.companyId) {
          toast.error('Please select a company for the new landlord.');
          setIsSubmitting(false);
          return; // Stop submission
        }
        payload.companyId = data.companyId;
      }

      if (inviterRole === 'super_admin') {
        payload.companyId = data.companyId;
      }

      // ✅ LANDLORD → REQUIRED apartments
      if (data.role === "landlord") {
        payload.apartmentIds = (data.apartmentIds || []).map(Number);
      }

      // ✅ TENANT → REQUIRED apartment + unit
      if (data.role === "tenant") {
        payload.apartmentIds = (data.apartmentIds || []).map(Number);
        payload.unitId = Number(data.unitId);
      }

      // ✅ EMPLOYEE → OPTIONAL apartments
      if (data.role === "employee") {
        if (data.apartmentIds && data.apartmentIds.length > 0) {
          payload.apartmentIds = data.apartmentIds.map(Number);
        }
      }

      console.log("INVITE PAYLOAD 🚀", payload);

      await inviteUserService(payload);

      toast.success("Invitation sent!");
      reset({ role: 'tenant', companyId: undefined, email: '' });
      setSelectedApartments([]);
      onOpenChange(false);

    } catch (err: any) {
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset selections if Role or Company changes
  useEffect(() => {
    setSelectedApartments([]);
    setValue("apartmentIds", []);
    setValue("unitId", undefined);
  }, [selectedRole, selectedCompanyId, setValue]);

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

          {/* Company Selection (ONLY FOR SUPER ADMIN INVITING A LANDLORD) */}
          {inviterRole === 'super_admin' && selectedRole === 'landlord' && (
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select
                value={selectedCompanyId ? String(selectedCompanyId) : undefined}
                onValueChange={(value) => setValue('companyId', Number(value))}
                disabled={isLoadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCompanies ? "Loading..." : "Select company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {selectedRole === "landlord" && "Apartments *"}
              {selectedRole === "tenant" && "Apartment *"}
              {selectedRole === "employee" && (
                <p className="text-xs text-muted-foreground">
                  You can assign properties now or later
                </p>
              )}
            </Label>

            <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-[50px]">
              {inviterRole === 'super_admin' && selectedRole === 'landlord' && !selectedCompanyId ? (
                <p className="text-sm text-muted-foreground w-full text-center py-2">
                  Please select a company first to view its properties.
                </p>
              ) : filteredProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground w-full text-center py-2">
                  No properties found.
                </p>
              ) : (
                filteredProperties.map((property) => {
                  const isSelected = selectedApartments.includes(property.id.toString());

                  return (
                    <button
                      type="button"
                      key={property.id}
                      onClick={() => {
                        let updated: string[];
                        const propertyIdStr = String(property.id);
                        if (selectedRole === 'tenant') {
                          updated = [propertyIdStr];
                        } else {
                          if (isSelected) {
                            updated = selectedApartments.filter(id => id !== propertyIdStr);
                          } else {
                            updated = [...selectedApartments, propertyIdStr];
                          }
                        }

                        setSelectedApartments(updated);
                        setValue('apartmentIds', updated);
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/70'
                      }`}
                    >
                      {property.name}
                    </button>
                  );
                })
              )}
            </div>

            {errors.apartmentIds && (
              <p className="text-sm text-destructive">
                {errors.apartmentIds.message}
              </p>
            )}
          </div>

          {selectedRole === 'tenant' && (
            <div className="space-y-2">
              <Label>Unit *</Label>

              <Select
                onValueChange={(value) => setValue('unitId', value)}
                disabled={!selectedApartmentForTenant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>

                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.unitId && (
                <p className="text-sm text-destructive">
                  {errors.unitId.message}
                </p>
              )}
            </div>
          )}

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