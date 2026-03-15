import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

import { Unit, UnitFormData, Property  } from "@/types/property";
import { useMeters } from "@/hooks/useMeters";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2 } from "lucide-react";

/* =========================
   Validation Schema
========================= */

const unitSchema = z.object({
  propertyId: z.coerce.number().min(1, "Property is required"),
  unitNumber: z.string().min(1, "Unit number is required"),
  unitType: z.enum([
    "studio",
    "one_bedroom",
    "two_bedroom",
    "three_bedroom",
    "penthouse",
  ]),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(1),
  squareFeet: z.coerce.number().min(1),
  monthlyRent: z.coerce.number().min(1),
  deposit: z.coerce.number().min(0),
  status: z.enum(["vacant", "occupied", "maintenance"]),
  meterId: z.coerce.number().min(1, "Water meter ID is required"),
});

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  properties: Property[];
  defaultPropertyId?: number;
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
  isLoading,
}: UnitFormProps) {

  const { t } = useTranslation();

  /* =========================
     METERS
  ========================= */

  const { meters, loading: metersLoading } = useMeters();

  /* =========================
     FORM
  ========================= */

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
      propertyId: unit?.propertyId ?? "",
      unitNumber: unit?.unitNumber ?? "",
      unitType: unit?.unitType ?? "one_bedroom",
      bedrooms: unit?.bedrooms ?? 1,
      bathrooms: unit?.bathrooms ?? 1,
      squareFeet: unit?.squareFeet ?? 500,
      monthlyRent: unit?.monthlyRent ?? 0,
      deposit: unit?.deposit ?? 0,
      status: unit?.status ?? "vacant",
      meterId: unit?.meterId ?? ""
    },
  });

  /* =========================
     WATCHERS
  ========================= */

  const propertyId = watch("propertyId");
  const unitType = watch("unitType");
  const status = watch("status");

  /* =========================
     FILTER METERS
  ========================= */

 const availableMeters = meters.filter(
  (m) =>
    String(m.propertyId) === String(propertyId) &&
    (!m.unitId || m.unitId === unit?.id)
);

  /* =========================
     RESET FORM
  ========================= */

  useEffect(() => {
    if (!open) return;

    reset({
      propertyId: unit?.propertyId ?? "",
      unitNumber: unit?.unitNumber ?? "",
      unitType: unit?.unitType ?? "one_bedroom",
      bedrooms: unit?.bedrooms ?? 1,
      bathrooms: unit?.bathrooms ?? 1,
      squareFeet: unit?.squareFeet ?? 500,
      monthlyRent: unit?.monthlyRent ?? 0,
      deposit: unit?.deposit ?? 0,
      status: unit?.status ?? "vacant",
      meterId: unit?.meterId ?? "",
    });

  }, [open, unit, defaultPropertyId, reset]);

  /* =========================
     SUBMIT
  ========================= */

  const handleFormSubmit = async (data: UnitFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  /* =========================
     UNIT TYPE LOGIC
  ========================= */

  const handleUnitTypeChange = (type: UnitFormData["unitType"]) => {

    setValue("unitType", type, { shouldValidate: true });

    const bedroomMap: Record<UnitFormData["unitType"], number> = {
      studio: 0,
      one_bedroom: 1,
      two_bedroom: 2,
      three_bedroom: 3,
      penthouse: 4,
    };

    setValue("bedrooms", bedroomMap[type], { shouldValidate: true });
  };

  /* =========================
     UI
  ========================= */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>
            {unit ? t("units.editUnit") : t("units.addUnit")}
          </DialogTitle>

          <DialogDescription>
            {unit
              ? "Update the unit details below."
              : "Fill in the details to add a new unit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

  {/* PROPERTY */}
  <div className="space-y-2">
    <Label>Property *</Label>

    <Select
      value={propertyId ? String(propertyId) : ""}
      onValueChange={(value) =>
        setValue("propertyId", value, { shouldValidate: true })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a property" />
      </SelectTrigger>

      <SelectContent>
        {properties.map((property) => (
          <SelectItem key={property.id} value={String(property.id)}>
            {property.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {errors.propertyId && (
      <p className="text-sm text-destructive">
        {errors.propertyId.message}
      </p>
    )}
  </div>

  {/* MAIN GRID */}
  <div className="grid grid-cols-2 gap-4">

    {/* UNIT NUMBER */}
    <div className="space-y-2">
      <Label>Unit Number *</Label>
      <Input {...register("unitNumber")} placeholder="A101" />
    </div>

    {/* UNIT TYPE */}
    <div className="space-y-2">
      <Label>Unit Type *</Label>

      <Select value={unitType} onValueChange={handleUnitTypeChange}>
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

    {/* BEDROOMS */}
    <div className="space-y-2">
      <Label>Bedrooms</Label>
      <Input type="number" {...register("bedrooms")} />
    </div>

    {/* BATHROOMS */}
    <div className="space-y-2">
      <Label>Bathrooms</Label>
      <Input type="number" {...register("bathrooms")} />
    </div>

    {/* SQUARE FEET */}
    <div className="space-y-2">
      <Label>Square Feet</Label>
      <Input type="number" {...register("squareFeet")} />
    </div>

    {/* STATUS */}
    <div className="space-y-2">
      <Label>Status *</Label>

      <Select
        value={status}
        onValueChange={(value) =>
          setValue("status", value as UnitFormData["status"], {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="vacant">Vacant</SelectItem>
          <SelectItem value="occupied">Occupied</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* MONTHLY RENT */}
    <div className="space-y-2">
      <Label>Monthly Rent</Label>
      <Input type="number" {...register("monthlyRent")} />
    </div>

    {/* DEPOSIT */}
    <div className="space-y-2">
      <Label>Deposit</Label>
      <Input type="number" {...register("deposit")} />
    </div>

  </div>

  {/* WATER METER */}
<div className="space-y-2">
  <Label>Water Meter *</Label>

  <Select
    value={watch("meterId") ? String(watch("meterId")) : ""}
    onValueChange={(value) =>
      setValue("meterId", value, { shouldValidate: true })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select water meter" />
    </SelectTrigger>

   <SelectContent>
  {metersLoading ? (
    <SelectItem key="loading" value="loading" disabled>
      Loading meters...
    </SelectItem>
  ) : availableMeters.length === 0 ? (
    <SelectItem key="no-meters" value="none" disabled>
      No available meters
    </SelectItem>
  ) : (
   availableMeters.map((meter) => (
  <SelectItem
    key={meter.id}
    value={String(meter.id)}
  >
    {meter.meterName} ({meter.meterType})
  </SelectItem>
))
  )}
</SelectContent>
  </Select>

  {errors.meterId && (
    <p className="text-sm text-destructive">
      {errors.meterId.message}
    </p>
  )}
</div>

  {/* FOOTER */}
  <DialogFooter>

    <Button
      variant="outline"
      type="button"
      onClick={() => onOpenChange(false)}
    >
      Cancel
    </Button>

    <Button type="submit" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save"
      )}
    </Button>

  </DialogFooter>

</form>
      </DialogContent>
    </Dialog>
  );
}