import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProperties, useUnits } from '@/hooks/useProperties';
import { Property, Unit } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PropertyPhotoGallery } from '@/components/properties/PropertyPhotoGallery';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  MapPin,
  Home,
  Users,
  DollarSign,
  Calendar,
  Edit,
  ArrowLeft,
  Wifi,
  Car,
  Dumbbell,
  Shield,
  Droplets,
  Zap,
  Image,
} from 'lucide-react';

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  water: <Droplets className="h-4 w-4" />,
  electricity: <Zap className="h-4 w-4" />,
};

export default function PropertyDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { properties, updateProperty, isLoading: propertiesLoading } = useProperties();
  const { units, isLoading: unitsLoading } = useUnits(id);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyPhotos, setPropertyPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!propertiesLoading && id) {
      const found = properties.find(p => p.id === id);
      setProperty(found || null);
      // Load photos from localStorage or property
      const storedPhotos = localStorage.getItem(`property_photos_${id}`);
      if (storedPhotos) {
        setPropertyPhotos(JSON.parse(storedPhotos));
      } else if (found?.photos) {
        setPropertyPhotos(found.photos);
      }
    }
  }, [properties, propertiesLoading, id]);

  const handlePhotosChange = async (newPhotos: string[]) => {
    setPropertyPhotos(newPhotos);
    // Save to localStorage
    if (id) {
      localStorage.setItem(`property_photos_${id}`, JSON.stringify(newPhotos));
    }
    toast({
      title: 'Photos Updated',
      description: 'Property photos have been updated.',
    });
  };

  if (propertiesLoading || unitsLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout title="Property Not Found">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const occupancyRate = property.totalUnits > 0
    ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
    : 0;

  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const maintenanceUnits = units.filter(u => u.status === 'maintenance').length;

  const totalMonthlyRent = units.reduce((sum, u) => sum + u.monthlyRent, 0);
  const potentialIncome = units
    .filter(u => u.status === 'occupied')
    .reduce((sum, u) => sum + u.monthlyRent, 0);

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'occupied':
        return 'bg-success text-success-foreground';
      case 'vacant':
        return 'bg-warning text-warning-foreground';
      case 'maintenance':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout
      title={property.name}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('properties.title'), href: '/properties' },
        { label: property.name },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{property.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{property.address}, {property.city}, {property.state}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/properties`, { state: { edit: property.id } })}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </Button>
          <Button asChild>
            <Link to={`/units?property=${property.id}`}>
              <Home className="mr-2 h-4 w-4" />
              Manage Units
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              {occupiedUnits} occupied, {vacantUnits} vacant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <Progress value={occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalMonthlyRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current: KES {potentialIncome.toLocaleString()}/mo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Type</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{property.propertyType}</div>
            <p className="text-xs text-muted-foreground">
              Created {new Date(property.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            Photos ({propertyPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="units">Units ({units.length})</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
                  <p>{property.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">City</h4>
                  <p>{property.city}, {property.state}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Country</h4>
                  <p>{property.country}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Postal Code</h4>
                  <p>{property.postalCode}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p>{new Date(property.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                  <p>{new Date(property.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                  <div className="p-2 bg-success/20 rounded-full">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                    <p className="text-xl font-bold">{occupiedUnits}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                  <div className="p-2 bg-warning/20 rounded-full">
                    <Home className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vacant</p>
                    <p className="text-xl font-bold">{vacantUnits}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                  <div className="p-2 bg-destructive/20 rounded-full">
                    <Calendar className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-xl font-bold">{maintenanceUnits}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <PropertyPhotoGallery
            propertyId={property.id}
            photos={propertyPhotos}
            onPhotosChange={handlePhotosChange}
            editable={true}
          />
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          {units.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{unit.unitNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {unit.unitType.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(unit.status)}>
                        {unit.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bedrooms</span>
                      <span>{unit.bedrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bathrooms</span>
                      <span>{unit.bathrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span>{unit.squareFeet} sq ft</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Rent</span>
                      <span className="font-semibold">KES {unit.monthlyRent.toLocaleString()}/mo</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Units Yet</h3>
                <p className="text-muted-foreground mb-4">
                  This property doesn't have any units configured.
                </p>
                <Button asChild>
                  <Link to={`/units?property=${property.id}`}>Add Units</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              {property.amenities.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      {amenityIcons[amenity.toLowerCase()] || <Building2 className="h-4 w-4" />}
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No amenities listed for this property.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
