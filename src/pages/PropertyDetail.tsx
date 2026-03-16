import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProperties, useUnits } from "@/hooks/useProperties";
import { Property, Unit } from "@/types/property";
import { useLandlords } from "@/hooks/useLandlords";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { PropertyPhotoGallery } from "@/components/properties/PropertyPhotoGallery";

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
} from "lucide-react";

/* =========================
   Amenity icons
========================= */

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

  const { properties, isLoading: propertiesLoading } = useProperties();
  const { units, isLoading: unitsLoading } = useUnits();

  const [property, setProperty] = useState<Property | null>(null);
  const [propertyPhotos, setPropertyPhotos] = useState<string[]>([]);
  const [featuredPhotoIndex, setFeaturedPhotoIndex] = useState(0);

  const { getLandlordById } = useLandlords();

const landlord = property?.landlordId
  ? getLandlordById(Number(property.landlordId))
  : undefined;


  /* =========================
     Find property
  ========================= */

  useEffect(() => {
    if (!propertiesLoading && id) {
      const found = properties.find((p) => String(p.id) === id) ?? null;
      setProperty(found);

      if (found) {
        const storedPhotos = localStorage.getItem(`property_photos_${id}`);
        const storedFeatured = localStorage.getItem(
          `property_featured_photo_${id}`
        );

        setPropertyPhotos(
          storedPhotos ? JSON.parse(storedPhotos) : found.photos ?? []
        );

        if (storedFeatured) {
          setFeaturedPhotoIndex(Number(storedFeatured));
        }
      }
    }
  }, [properties, propertiesLoading, id]);

  /* =========================
     Units for this property
  ========================= */

  const propertyUnits = useMemo(
    () => units.filter((u) => String(u.propertyId) === id),
    [units, id]
  );

  /* =========================
     Derived stats
  ========================= */

  const totalUnits = propertyUnits.length;
  const occupiedUnits = propertyUnits.filter((u) => u.status === "occupied").length;
  const vacantUnits = propertyUnits.filter((u) => u.status === "vacant").length;
  const maintenanceUnits = propertyUnits.filter(
    (u) => u.status === "maintenance"
  ).length;

  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalMonthlyRent = propertyUnits.reduce(
    (sum, u) => sum + u.monthlyRent,
    0
  );

  const currentIncome = propertyUnits
    .filter((u) => u.status === "occupied")
    .reduce((sum, u) => sum + u.monthlyRent, 0);

  const getStatusColor = (status: Unit["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-success text-success-foreground";
      case "vacant":
        return "bg-warning text-warning-foreground";
      case "maintenance":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /* =========================
     Loading / Not found
  ========================= */

  if (propertiesLoading || unitsLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout title="Property Not Found">
        <div className="text-center py-16">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="mb-4">Property not found</p>

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

  return (
    <DashboardLayout
      title={property.name}
      breadcrumbs={[
        { label: t("navigation.dashboard"), href: "/dashboard" },
        { label: t("properties.title"), href: "/properties" },
        { label: property.name },
      ]}
    >
      {/* Header */}

      <div className="flex justify-between flex-wrap gap-4 mb-6">

  {/* Property Info */}
  <div className="space-y-1">

    {/* Property Code */}
    {property.country && (
      <p className="text-sm text-muted-foreground">
        Postal Code: {property.address}
      </p>
    )}

    {/* Location */}
    <div className="flex items-center gap-1 text-muted-foreground">
      <MapPin className="h-4 w-4" />
      {property.city}, {property.country}
    </div>

    {/* Owner */}
    {landlord && (
      <p className="text-sm text-muted-foreground">
        Owner:{" "}
        <span className="font-medium text-foreground">
          {landlord.firstName} {landlord.lastName}
        </span>
      </p>
    )}

  </div>

  {/* Quick Actions */}
  <div className="flex gap-2 flex-wrap">

    <Button variant="outline" onClick={() => navigate("/properties")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>

    <Button asChild variant="outline">
      <Link to={`/properties/edit/${property.id}`}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Property
      </Link>
    </Button>

    <Button asChild>
      <Link to={`/units?property=${property.id}`}>
        <Home className="mr-2 h-4 w-4" />
        Manage Units
      </Link>
    </Button>

  </div>

</div>


      {/* Stats */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">

        <Stat
          title="Total Units"
          value={totalUnits}
          subtitle={`${occupiedUnits} occupied, ${vacantUnits} vacant`}
          icon={<Home />}
        />

        <Stat
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          progress={occupancyRate}
          icon={<Users />}
        />

        <Stat
          title="Potential Income"
          value={`KES ${totalMonthlyRent.toLocaleString()}`}
          subtitle={`Current: KES ${currentIncome.toLocaleString()}`}
          icon={<DollarSign />}
        />

        <Stat
          title="Property Type"
          value={property.propertyType}
          subtitle={`Created ${new Date(property.createdAt).toLocaleDateString()}`}
          icon={<Building2 />}
        />

      </div>

      {/* Property Performance */}

      <Card className="mb-6">
  <CardHeader>
    <CardTitle>Property Performance</CardTitle>
  </CardHeader>

  <CardContent className="grid md:grid-cols-3 gap-6">

    {/* Potential Rent */}
    <div className="p-4 rounded-lg bg-muted/40 border flex items-center gap-3">
      <div className="p-2 rounded-md bg-primary/10 text-primary">
        <DollarSign className="h-4 w-4" />
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          Potential Monthly Rent
        </p>
        <p className="text-xl font-semibold">
          KES {totalMonthlyRent.toLocaleString()}
        </p>
      </div>
    </div>

    {/* Collected Rent */}
    <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-center gap-3">
      <div className="p-2 rounded-md bg-green-100 text-green-600">
        <DollarSign className="h-4 w-4" />
      </div>

      <div>
        <p className="text-sm text-green-700">
          Collected Rent
        </p>
        <p className="text-xl font-semibold text-green-700">
          KES {currentIncome.toLocaleString()}
        </p>
      </div>
    </div>

    {/* Lost Revenue */}
    <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3">
      <div className="p-2 rounded-md bg-red-100 text-red-600">
        <DollarSign className="h-4 w-4" />
      </div>

      <div>
        <p className="text-sm text-red-700">
          Lost Revenue
        </p>
        <p className="text-xl font-semibold text-red-700">
          KES {(totalMonthlyRent - currentIncome).toLocaleString()}
        </p>
      </div>
    </div>

  </CardContent>
</Card>


   

      {/* Tabs */}

      <Tabs defaultValue="overview" className="space-y-4">

        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">
            <Image className="h-4 w-4 mr-1" />
            Photos ({propertyPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="units">Units ({totalUnits})</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        {/* Overview */}

        <TabsContent value="overview" className="space-y-4">

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            

            <CardContent className="grid md:grid-cols-2 gap-6">

              <Info label="Property Type" value={property.propertyType} />
              <Info label="City" value={property.city} />
              <Info label="Country" value={property.country} />
              <Info label="Address" value={property.address} />

            </CardContent>

            
          </Card>

          

          <Card>
            <CardHeader>
              <CardTitle>Unit Summary</CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4">

              <SummaryCard label="Occupied" value={occupiedUnits} icon={<Users />} />
              <SummaryCard label="Vacant" value={vacantUnits} icon={<Home />} />
              <SummaryCard label="Maintenance" value={maintenanceUnits} icon={<Calendar />} />

            </CardContent>
          </Card>

        </TabsContent>

        {/* Photos */}

        <TabsContent value="photos">

          <PropertyPhotoGallery
            propertyId={property.id}
            photos={propertyPhotos}
            featuredPhotoIndex={featuredPhotoIndex}
            onPhotosChange={(photos, index) => {
              setPropertyPhotos(photos);
              if (index !== undefined) setFeaturedPhotoIndex(index);
            }}
            editable
          />

        </TabsContent>

        {/* Units */}

        <TabsContent value="units">

          {propertyUnits.length === 0 ? (
            <EmptyUnits propertyId={property.id} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {propertyUnits.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}

        </TabsContent>

        {/* Amenities */}

        <TabsContent value="amenities">

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>

            <CardContent>

              {property.amenities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No amenities listed.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">

                  {property.amenities.map((a) => (
                    <div
                      key={a}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded"
                    >
                      {amenityIcons[a.toLowerCase()] ?? (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span className="capitalize">{a}</span>
                    </div>
                  ))}

                </div>
              )}

            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>
    </DashboardLayout>
  );
}

/* =========================
   Components
========================= */

function Stat({ title, value, subtitle, progress, icon }: any) {
  return (
    <Card>
      <CardHeader className="flex justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {progress !== undefined && (
          <Progress value={progress} className="mt-2" />
        )}

        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: any) {
  const percent = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>

      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-2 bg-muted rounded">
        <div
          className={`h-2 rounded ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>

    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function UnitCard({ unit, getStatusColor }: any) {
  return (
    <Card className="hover:shadow-lg transition">

      <CardHeader className="pb-2 flex justify-between">

        <div>
          <CardTitle>{unit.unitNumber}</CardTitle>

          <p className="text-sm capitalize text-muted-foreground">
            {unit.unitType.replace("_", " ")}
          </p>
        </div>

        <Badge className={getStatusColor(unit.status)}>
          {unit.status}
        </Badge>

      </CardHeader>

      <CardContent className="space-y-2">

        <div className="flex justify-between text-sm">
          <span>Bedrooms</span>
          <span>{unit.bedrooms}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Bathrooms</span>
          <span>{unit.bathrooms}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Rent</span>
          <span>KES {unit.monthlyRent.toLocaleString()}</span>
        </div>

      </CardContent>
    </Card>
  );
}

function EmptyUnits({ propertyId }: { propertyId: string }) {
  return (
    <Card>
      <CardContent className="text-center py-12">

        <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

        <p className="mb-4">No units yet</p>

        <Button asChild>
          <Link to={`/units?property=${propertyId}`}>Add Units</Link>
        </Button>

      </CardContent>
    </Card>
  );
}
