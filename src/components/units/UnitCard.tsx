import { useTranslation } from 'react-i18next';
import { Unit } from '@/types/property';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Bed, Bath, Square, MoreVertical, Edit, Trash2, User, Droplets } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  propertyName?: string;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

export function UnitCard({ unit, propertyName, onEdit, onDelete }: UnitCardProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: Unit['status']) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-success text-success-foreground">{t('units.occupied')}</Badge>;
      case 'vacant':
        return <Badge className="bg-info text-info-foreground">{t('units.vacant')}</Badge>;
      case 'maintenance':
        return <Badge className="bg-warning text-warning-foreground">{t('units.maintenance')}</Badge>;
    }
  };

  const getUnitTypeLabel = (type: Unit['unitType']) => {
    const labels: Record<Unit['unitType'], string> = {
      studio: 'Studio',
      one_bedroom: '1 Bedroom',
      two_bedroom: '2 Bedroom',
      three_bedroom: '3 Bedroom',
      penthouse: 'Penthouse',
    };
    return labels[type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              unit.status === 'occupied' ? 'bg-success/10' :
              unit.status === 'vacant' ? 'bg-info/10' : 'bg-warning/10'
            }`}>
              <Home className={`h-5 w-5 ${
                unit.status === 'occupied' ? 'text-success' :
                unit.status === 'vacant' ? 'text-info' : 'text-warning'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{unit.unitNumber}</h3>
              {propertyName && (
                <p className="text-sm text-muted-foreground">{propertyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(unit.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(unit)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(unit)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Badge variant="outline">{getUnitTypeLabel(unit.unitType)}</Badge>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Bed className="h-4 w-4" />
              <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Bath className="h-4 w-4" />
              <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Square className="h-4 w-4" />
              <span>{unit.squareFeet} sqft</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>{t('units.meterId')}: {unit.meterId}</span>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{t('units.monthlyRent')}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(unit.monthlyRent)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('units.deposit')}</p>
                <p className="text-sm font-medium">{formatCurrency(unit.deposit)}</p>
              </div>
            </div>
          </div>

          {unit.currentTenantId && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tenant assigned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
