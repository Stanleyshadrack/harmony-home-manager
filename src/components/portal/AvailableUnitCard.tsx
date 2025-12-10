import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bed, Bath, Square, DollarSign } from 'lucide-react';
import { Unit } from '@/types/property';

interface AvailableUnitCardProps {
  unit: Unit;
  propertyName: string;
  onApply: (unit: Unit) => void;
}

const unitTypeLabels: Record<Unit['unitType'], string> = {
  studio: 'Studio',
  one_bedroom: '1 Bedroom',
  two_bedroom: '2 Bedrooms',
  three_bedroom: '3 Bedrooms',
  penthouse: 'Penthouse',
};

export function AvailableUnitCard({ unit, propertyName, onApply }: AvailableUnitCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Unit {unit.unitNumber}</h3>
            <p className="text-sm text-muted-foreground">{propertyName}</p>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Available
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {unit.bedrooms} BR
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {unit.bathrooms} BA
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {unit.squareFeet} sqft
          </span>
        </div>

        <Badge variant="secondary">{unitTypeLabels[unit.unitType]}</Badge>

        {unit.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unit.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {unit.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{unit.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="pt-3 border-t flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-xl font-bold text-primary">
              <DollarSign className="h-5 w-5" />
              {formatCurrency(unit.monthlyRent).replace('$', '')}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Deposit: {formatCurrency(unit.deposit)}
            </p>
          </div>
          <Button onClick={() => onApply(unit)}>Apply Now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
