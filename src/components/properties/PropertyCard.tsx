import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from "@tanstack/react-query";
import { PropertyApi } from "@/api/service/add.apartments.service.api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Phone,
  Building2,
  Home,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

interface PropertyOwner {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PropertyCardProps {
  property: Property;
  owner?: PropertyOwner;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

export function PropertyCard({
  property,
  onEdit,
  onDelete,
  owner
}: PropertyCardProps) {

  const { t } = useTranslation();

  /* =========================
     PROPERTY STATS (API)
  ========================= */

  const { data: stats } = useQuery({
    queryKey: ["propertyStats", property.id],
    queryFn: () => PropertyApi.fetchStats(Number(property.id)),
  });

  const totalUnits = stats?.totalUnits ?? 0;
  const occupiedUnits = stats?.occupiedUnits ?? 0;

  const occupancyRate =
    totalUnits > 0
      ? Math.round((occupiedUnits / totalUnits) * 100)
      : 0;

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'bg-success text-success-foreground';
    if (rate >= 70) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h3 className="font-semibold text-lg">{property.name}</h3>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {property.city}, {property.country}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/properties/${property.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('common.actions')}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(property)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">

          <p className="text-sm text-muted-foreground">
            {property.address}
          </p>

          {/* Units + Occupancy */}
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {occupiedUnits}/{totalUnits} {t('properties.units')}
              </span>
            </div>

            <Badge className={getOccupancyColor(occupancyRate)}>
              {occupancyRate}% {t('dashboard.occupancyRate')}
            </Badge>

          </div>

          {/* Landlord */}
          {/* Owner */}
{owner && (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">

    <Avatar className="h-9 w-9">
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
        {owner.firstName[0]}
        {owner.lastName[0]}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">

      <p className="text-sm font-medium truncate">
        {owner.firstName} {owner.lastName}
      </p>

      <p className="text-xs text-muted-foreground truncate">
        {owner.email}
      </p>

      <div className="flex items-center gap-2 mt-0.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          {owner.phone}
        </span>
      </div>

    </div>

  </div>
)}


          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">

              {property.amenities.slice(0, 3).map((amenity) => (
                <Badge
                  key={amenity}
                  variant="secondary"
                  className="text-xs"
                >
                  {amenity}
                </Badge>
              ))}

              {property.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{property.amenities.length - 3}
                </Badge>
              )}

            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">

            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Link to={`/properties/${property.id}`}>
                {t('properties.propertyDetails')}
              </Link>
            </Button>

            <Button asChild size="sm" className="flex-1">
              <Link to={`/units?property=${property.id}`}>
                {t('properties.units')}
              </Link>
            </Button>

          </div>

        </div>
      </CardContent>
    </Card>
  );
}