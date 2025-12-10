import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Unit, UnitFormData, Property } from '@/types/property';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const unitSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'penthouse']),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(1),
  squareFeet: z.coerce.number().min(1),
  monthlyRent: z.coerce.number().min(1, 'Monthly rent is required'),
  deposit: z.coerce.number().min(0),
  status: z.enum(['vacant', 'occupied', 'maintenance']),
  meterId: z.string().min(1, 'Water meter ID is required'),
});

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  properties: Property[];
  defaultPropertyId?: string;
  onSubmit: (data: UnitFormData) => Promise<void>;
  isLoading?: boolean;
}

export function UnitForm({ 
  open, 
  onOpenChange, 
  unit, 
  properties,
  defaultPropertyId,
  onSubmit, 
  isLoading 
}: UnitFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      propertyId: unit?.propertyId || defaultPropertyId || '',
      unitNumber: unit?.unitNumber || '',
      unitType: unit?.unitType || 'one_bedroom',
      bedrooms: unit?.bedrooms || 1,
      bathrooms: unit?.bathrooms || 1,
      squareFeet: unit?.squareFeet || 500,
      monthlyRent: unit?.monthlyRent || 0,
      deposit: unit?.deposit || 0,
      status: unit?.status || 'vacant',
      meterId: unit?.meterId || '',
      amenities: unit?.amenities || [],
    },
  });

  // Reset form when unit changes (for edit mode)
  useEffect(() => {
    if (open) {
      reset({
        propertyId: unit?.propertyId || defaultPropertyId || '',
        unitNumber: unit?.unitNumber || '',
        unitType: unit?.unitType || 'one_bedroom',
        bedrooms: unit?.bedrooms || 1,
        bathrooms: unit?.bathrooms || 1,
        squareFeet: unit?.squareFeet || 500,
        monthlyRent: unit?.monthlyRent || 0,
        deposit: unit?.deposit || 0,
        status: unit?.status || 'vacant',
        meterId: unit?.meterId || '',
        amenities: unit?.amenities || [],
      });
    }
  }, [unit, open, defaultPropertyId, reset]);

  const propertyId = watch('propertyId');
  const unitType = watch('unitType');
  const status = watch('status');

  const handleFormSubmit = async (data: UnitFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  const handleUnitTypeChange = (type: UnitFormData['unitType']) => {
    setValue('unitType', type);
    // Auto-set bedrooms based on type
    const bedroomMap: Record<UnitFormData['unitType'], number> = {
      studio: 0,
      one_bedroom: 1,
      two_bedroom: 2,
      three_bedroom: 3,
      penthouse: 4,
    };
    setValue('bedrooms', bedroomMap[type]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {unit ? t('units.editUnit') : t('units.addUnit')}
          </DialogTitle>
          <DialogDescription>
            {unit 
              ? 'Update the unit details below.'
              : 'Fill in the details to add a new unit.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Property *</Label>
              <Select
                value={propertyId}
                onValueChange={(value) => setValue('propertyId', value)}
              >
                <SelectTrigger className={errors.propertyId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyId && (
                <p className="text-sm text-destructive">{errors.propertyId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitNumber">{t('units.unitNumber')} *</Label>
              <Input
                id="unitNumber"
                placeholder="e.g., A101"
                {...register('unitNumber')}
                className={errors.unitNumber ? 'border-destructive' : ''}
              />
              {errors.unitNumber && (
                <p className="text-sm text-destructive">{errors.unitNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('units.unitType')} *</Label>
              <Select
                value={unitType}
                onValueChange={(value) => handleUnitTypeChange(value as UnitFormData['unitType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="one_bedroom">1 Bedroom</SelectItem>
                  <SelectItem value="two_bedroom">2 Bedroom</SelectItem>
                  <SelectItem value="three_bedroom">3 Bedroom</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">{t('units.bedrooms')}</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                {...register('bedrooms')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">{t('units.bathrooms')}</Label>
              <Input
                id="bathrooms"
                type="number"
                min="1"
                {...register('bathrooms')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="squareFeet">{t('units.squareFeet')}</Label>
              <Input
                id="squareFeet"
                type="number"
                min="1"
                {...register('squareFeet')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('units.status')} *</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as UnitFormData['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">{t('units.vacant')}</SelectItem>
                  <SelectItem value="occupied">{t('units.occupied')}</SelectItem>
                  <SelectItem value="maintenance">{t('units.maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent">{t('units.monthlyRent')} (KES) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                min="0"
                placeholder="25000"
                {...register('monthlyRent')}
                className={errors.monthlyRent ? 'border-destructive' : ''}
              />
              {errors.monthlyRent && (
                <p className="text-sm text-destructive">{errors.monthlyRent.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">{t('units.deposit')} (KES)</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                placeholder="25000"
                {...register('deposit')}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="meterId">{t('units.meterId')} *</Label>
              <Input
                id="meterId"
                placeholder="e.g., WM-001"
                {...register('meterId')}
                className={errors.meterId ? 'border-destructive' : ''}
              />
              {errors.meterId && (
                <p className="text-sm text-destructive">{errors.meterId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The water meter ID is used for monthly water billing calculations
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
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
