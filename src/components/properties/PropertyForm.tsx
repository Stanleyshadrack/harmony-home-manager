import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Property, PropertyFormData } from '@/types/property';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, useToast } from '@/components/ui/use-toast';

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
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { PropertyApi } from '@/api/service/add.apartments.service.api';
import { mapPropertyFormToCreateDTO } from '@/api/mapper/mapPropertyForm';
import { apiRequest } from '@/api/https';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyLandlordProfile } from '@/api/service/landlords.service.api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type CompanyOption = { id: number; name: string };

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
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
  const [amenities, setAmenities] = useState<string[]>(property?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isLandlord = user?.role === 'landlord';

  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [landlordCompany, setLandlordCompany] = useState<CompanyOption | null>(null);
  const [landlordCompanyLoading, setLandlordCompanyLoading] = useState(false);

  // Company options are searched on the server rather than loading every
  // company into the browser. This remains usable with large company lists.
  useEffect(() => {
    if (!open || !isSuperAdmin || !!property || !companyPickerOpen) return;
    let active = true;
    setCompanyLoading(true);
    setCompanyError('');
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await apiRequest<null, CompanyOption[]>({
          path: `/api/companies/options?search=${encodeURIComponent(companySearch.trim())}`,
          method: 'GET',
        });
        if (active) setCompanyOptions(results);
      } catch (error) {
        if (active) {
          setCompanyOptions([]);
          setCompanyError(error instanceof Error ? error.message : 'Unable to load companies');
        }
      } finally {
        if (active) setCompanyLoading(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timeoutId); };
  }, [open, isSuperAdmin, property, companyPickerOpen, companySearch]);

  // Read-only display for landlords. The backend is the authority for the
  // linked company; callers cannot choose or override a different company.
  useEffect(() => {
    if (!open || !isLandlord || !!property) return;
    let active = true;
    setLandlordCompanyLoading(true);
    setCompanyError('');
    fetchMyLandlordProfile()
      .then(profile => {
        if (!active) return;
        const id = profile.companyId == null ? NaN : Number(profile.companyId);
        if (!Number.isSafeInteger(id) || id <= 0) {
          setLandlordCompany(null);
          setCompanyError('Your landlord account is not assigned to a company. Contact the administrator.');
          return;
        }
        setLandlordCompany({ id, name: profile.company || 'Assigned company' });
      })
      .catch(error => {
        if (active) {
          setLandlordCompany(null);
          setCompanyError(error instanceof Error ? error.message : 'Could not verify your assigned company');
        }
      })
      .finally(() => { if (active) setLandlordCompanyLoading(false); });
    return () => { active = false; };
  }, [open, isLandlord, property]);


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
      name: property?.name || '',
      address: property?.address || '',
      city: property?.city || '',
      state: property?.state || '',
      country: property?.country || 'Kenya',
      postalCode: property?.postalCode || '',
      propertyType: property?.propertyType || 'apartment',
      amenities: property?.amenities || [],
    },
  });

  // Reset form when property changes (for edit mode)
  useEffect(() => {
    if (open) {
      reset({
        name: property?.name || '',
        address: property?.address || '',
        city: property?.city || '',
        state: property?.state || '',
        country: property?.country || 'Kenya',
        postalCode: property?.postalCode || '',
        propertyType: property?.propertyType || 'apartment',
        amenities: property?.amenities || [],
      });
      setAmenities(property?.amenities || []);
      setSelectedCompany(property?.companyId && property.companyName
        ? { id: property.companyId, name: property.companyName }
        : null);
      setCompanyPickerOpen(false);
      setCompanySearch('');
    }
  }, [property, open, reset]);

  const propertyType = watch('propertyType');

//  const [submitting, setSubmitting] = useState(false);

const handleFormSubmit = async (data: PropertyFormData) => {
  if (!property && isSuperAdmin && !selectedCompany) {
    toast({ variant: 'destructive', title: 'Company is required',
      description: 'Search for and select the company that will own this property.' });
    return;
  }
  if (!property && isLandlord && !landlordCompany?.id) {
    toast({ variant: 'destructive', title: 'Company unavailable',
      description: companyError || 'Your landlord account must be assigned to a company before adding a property.' });
    return;
  }

  try {
    setSubmitting(true);

    if (property) {
      // Editing does not change the company or create an additional property.
      await PropertyApi.update(Number(property.id), { ...data, amenities });
    } else {
      const payload = mapPropertyFormToCreateDTO({
        ...data,
        amenities,
        ...(isSuperAdmin && selectedCompany ? { companyId: selectedCompany.id } : {}),
      });
      await PropertyApi.create(payload);
    }

    await queryClient.invalidateQueries({ queryKey: ['properties'] });

    toast({
      title: t('common.success'),
      description: property
        ? t('properties.updateSuccess', 'Property updated successfully')
        : t('properties.createSuccess', 'Property created successfully'),
    });

    reset();
    setAmenities([]);
    setSelectedCompany(null);
    onOpenChange(false);
  } catch (err: unknown) {
    const message = err instanceof Error
      ? err.message
      : t('common.unexpectedError', 'Something went wrong. Please try again.');
    toast({ variant: 'destructive', title: t('common.error'), description: message });
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
            {property 
              ? 'Update the property details below.'
              : 'Fill in the details to add a new property.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {isSuperAdmin && !property && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="property-company-trigger">Company *</Label>
                <Popover open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="property-company-trigger"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={companyPickerOpen}
                      aria-label="Select company"
                      className="min-h-11 w-full justify-between text-left font-normal"
                    >
                      <span className="truncate">{selectedCompany?.name ?? 'Search and select a company...'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(26rem,calc(100vw-3rem))] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        value={companySearch}
                        onValueChange={setCompanySearch}
                        placeholder="Search by company name..."
                        aria-label="Search companies"
                      />
                      <CommandList>
                        {companyLoading && (
                          <div role="status" className="p-3 text-sm text-muted-foreground">Searching companies...</div>
                        )}
                        {companyError && (
                          <div role="alert" className="p-3 text-sm text-destructive">{companyError}</div>
                        )}
                        {!companyLoading && !companyError && companyOptions.length === 0 && (
                          <CommandEmpty>No companies found. Try another name.</CommandEmpty>
                        )}
                        {!companyLoading && !companyError && (
                          <CommandGroup>
                            {companyOptions.map(company => (
                              <CommandItem
                                key={company.id}
                                value={String(company.id)}
                                onSelect={() => {
                                  setSelectedCompany(company);
                                  setCompanyPickerOpen(false);
                                  setCompanySearch('');
                                }}
                                className="min-h-11 gap-2"
                              >
                                <Check className={`h-4 w-4 shrink-0 ${selectedCompany?.id === company.id ? 'opacity-100' : 'opacity-0'}`} />
                                <span className="truncate">{company.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Required for Super Admins. Search the company directory by name.</p>
              </div>
            )}

            {isLandlord && !property && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Company</Label>
                <div className="flex min-h-11 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {landlordCompanyLoading ? 'Loading assigned company...' : (landlordCompany?.name || 'No company assigned')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically linked to your landlord account. Company cannot be changed here.
                </p>
                {companyError && <p role="alert" className="text-sm text-destructive">{companyError}</p>}
              </div>
            )}

            {!!property && (property.companyName || property.companyId) && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Company</Label>
                <div className="flex min-h-11 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {property.companyName || `Company #${property.companyId}`}
                </div>
                <p className="text-xs text-muted-foreground">Existing property company cannot be changed here.</p>
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">{t('properties.propertyName')} *</Label>
              <Input
                id="name"
                placeholder="e.g., Sunset Apartments"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">{t('properties.address')} *</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street"
                {...register('address')}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('properties.city')} *</Label>
              <Input
                id="city"
                placeholder="e.g., Nairobi"
                {...register('city')}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">{t('properties.state')} *</Label>
              <Input
                id="state"
                placeholder="e.g., Nairobi County"
                {...register('state')}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t('properties.country')} *</Label>
              <Input
                id="country"
                placeholder="e.g., Kenya"
                {...register('country')}
                className={errors.country ? 'border-destructive' : ''}
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">{t('properties.postalCode')} *</Label>
              <Input
                id="postalCode"
                placeholder="e.g., 00100"
                {...register('postalCode')}
                className={errors.postalCode ? 'border-destructive' : ''}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode.message}</p>
              )}
            </div>

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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addAmenity(newAmenity)}
                >
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting || (!property && (
                (isSuperAdmin && !selectedCompany) ||
                (isLandlord && (landlordCompanyLoading || !landlordCompany))
              ))}
            >
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
