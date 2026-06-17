import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Property, PropertyFormData } from '@/types/property';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { PropertyApi } from '@/api/service/add.apartments.service.api';
import { mapPropertyFormToCreateDTO } from '@/api/mapper/mapPropertyForm';
import { useGetCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext'; // 👈 Added Auth Hook Import

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  companyId: z.coerce.number().min(1, 'Company is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  propertyType: z.enum(['apartment', 'house', 'commercial', 'mixed']),
});

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
}

const COMMON_AMENITIES = [
  'Parking',
  'Security',
  'Swimming Pool',
  'Gym',
  'Generator',
  'Water Tank',
  'Elevator',
  'Rooftop Terrace',
  'Garden',
  'CCTV',
];

export function PropertyForm({ open, onOpenChange, property }: PropertyFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth(); // 👈 Extract authenticating user profile context
  const [amenities, setAmenities] = useState<string[]>(property?.amenities || []);
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const [newAmenity, setNewAmenity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Helper flags for access control layout updates
  const isSuperAdmin = user?.role === 'super_admin';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name ?? '',
      address: property?.address ?? '',
      city: property?.city ?? '',
      state: property?.state ?? '',
      companyId: property?.companyId ?? 0,
      country: property?.country ?? 'Kenya',
      postalCode: property?.postalCode ?? '',
      propertyType: property?.propertyType ?? 'APARTMENT',
      amenities: property?.amenities ?? [],
    },
  });

  // 📄 Sync values when editing or opening dialog window
  useEffect(() => {
    if (open) {
      reset({
        name: property?.name || '',
        address: property?.address || '',
        companyId: property?.companyId || 0, 
        companyName: property?.companyName || '', 
        city: property?.city || '',
        state: property?.state || '',
        country: property?.country || 'Kenya',
        postalCode: property?.postalCode || '',
        propertyType: property?.propertyType || 'APARTMENT', 
        amenities: property?.amenities || [],
      });
      setAmenities(property?.amenities || []);
    }
  }, [property, open, reset]);

  // 🔒 AUTOFILL LOGIC FOR LANDLORDS
  useEffect(() => {
    if (open && !isSuperAdmin && companies.length > 0 && !property) {
      // Landlord APIs return only their owned company profile in the array data scope
      setValue('companyId', companies[0].id);
    }
  }, [companies, isSuperAdmin, open, property, setValue]);

  const propertyType = watch('propertyType');
  const currentCompanyId = watch('companyId');

  // Find assigned company name string metadata for disabled input display
  const selectedCompany = companies.find((c) => c.id === Number(currentCompanyId)) || companies[0];

  const handleFormSubmit = async (data: PropertyFormData) => {
    try {
      setSubmitting(true);

      const payload = mapPropertyFormToCreateDTO({
        ...data,
        amenities,
      });

      console.log('CREATE PROPERTY PAYLOAD', payload);

      await PropertyApi.create(payload);
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: t('common.success'),
        description: property
          ? t('properties.updateSuccess', 'Property updated successfully')
          : t('properties.createSuccess', 'Property created successfully'),
      });

      reset();
      setAmenities([]);
      onOpenChange(false);

    } catch (err: any) {
      console.error('Failed to create property', err);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message || t('common.unexpectedError', 'Something went wrong.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addAmenity = (amenity: string) => {
    if (amenity && !amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
    }
    setNewAmenity('');
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {property ? t('properties.editProperty') : t('properties.addProperty')}
          </DialogTitle>
          <DialogDescription>
            {property ? 'Update the property details below.' : 'Fill in the details to add a new property.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Property Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">{t('properties.propertyName')} *</Label>
              <Input
                id="name"
                placeholder="e.g., Sunset Apartments"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* 🏢 Company Field (Conditional Display Logic) */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Company *</Label>
              
              {isSuperAdmin ? (
                /* Super Admins see full selector options grid */
                <Select
                  value={currentCompanyId ? String(currentCompanyId) : undefined}
                  onValueChange={(value) => setValue('companyId', Number(value))}
                  disabled={isLoadingCompanies}
                >
                  <SelectTrigger className={errors.companyId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isLoadingCompanies ? "Loading companies..." : "Select a company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                /* Landlords see read-only filled state container matching their credential entity */
                <Input
                  value={isLoadingCompanies ? "Loading company..." : (selectedCompany?.name || 'Assigned Company')}
                  disabled
                  className="bg-muted text-muted-foreground opacity-90 select-none"
                />
              )}

              {errors.companyId && <p className="text-sm text-destructive">{errors.companyId.message}</p>}
            </div>

            {/* Address */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">{t('properties.address')} *</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street"
                {...register('address')}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">{t('properties.city')} *</Label>
              <Input
                id="city"
                placeholder="e.g., Nairobi"
                {...register('city')}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">{t('properties.state')} *</Label>
              <Input
                id="state"
                placeholder="e.g., Nairobi County"
                {...register('state')}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">{t('properties.country')} *</Label>
              <Input
                id="country"
                placeholder="e.g., Kenya"
                {...register('country')}
                className={errors.country ? 'border-destructive' : ''}
              />
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode">{t('properties.postalCode')} *</Label>
              <Input
                id="postalCode"
                placeholder="e.g., 00100"
                {...register('postalCode')}
                className={errors.postalCode ? 'border-destructive' : ''}
              />
              {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
            </div>

            {/* Property Type Selector */}
            <div className="space-y-2">
              <Label>{t('properties.propertyType')} *</Label>
              <Select
                value={propertyType}
                onValueChange={(value) => setValue('propertyType', value as PropertyFormData['propertyType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment Building</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amenities Section */}
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('properties.amenities')}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="gap-1">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add amenity..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAmenity(newAmenity);
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => addAmenity(newAmenity)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_AMENITIES.filter((a) => !amenities.includes(a)).map((amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => addAmenity(amenity)}
                  >
                    + {amenity}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}