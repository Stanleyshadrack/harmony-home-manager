import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Unit, UnitFormData, Property } from "@/types/property";
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
  meterId: z.string().min(1, "Water meter ID is required"),
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
      propertyId: unit?.propertyId
        ? Number(unit.propertyId)
        : defaultPropertyId ?? 0,
      unitNumber: unit?.unitNumber ?? "",
      unitType: unit?.unitType ?? "one_bedroom",
      bedrooms: unit?.bedrooms ?? 1,
      bathrooms: unit?.bathrooms ?? 1,
      squareFeet: unit?.squareFeet ?? 500,
      monthlyRent: unit?.monthlyRent ?? 0,
      deposit: unit?.deposit ?? 0,
      status: unit?.status ?? "vacant",
      meterId: unit?.meterId ?? "",
      amenities: unit?.amenities ?? [],
    },
  });

  /* =========================
     Reset on Open / Edit
  ========================= */
  useEffect(() => {
    if (!open) return;

    reset({
      propertyId: unit?.propertyId
        ? Number(unit.propertyId)
        : defaultPropertyId ?? 0,
      unitNumber: unit?.unitNumber ?? "",
      unitType: unit?.unitType ?? "one_bedroom",
      bedrooms: unit?.bedrooms ?? 1,
      bathrooms: unit?.bathrooms ?? 1,
      squareFeet: unit?.squareFeet ?? 500,
      monthlyRent: unit?.monthlyRent ?? 0,
      deposit: unit?.deposit ?? 0,
      status: unit?.status ?? "vacant",
      meterId: unit?.meterId ?? "",
      amenities: unit?.amenities ?? [],
    });
  }, [open, unit, defaultPropertyId, reset]);

  const propertyId = watch("propertyId");
  const unitType = watch("unitType");
  const status = watch("status");

  const handleFormSubmit = async (data: UnitFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

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
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Property */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Property *</Label>
              <Select
                value={propertyId ? String(propertyId) : ""}
                onValueChange={(value) =>
                  setValue("propertyId", Number(value), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  className={errors.propertyId ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem
                      key={property.id}
                      value={String(property.id)}
                    >
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

            {/* Unit Number */}
            <div className="space-y-2">
              <Label>{t("units.unitNumber")} *</Label>
              <Input {...register("unitNumber")} />
            </div>

            {/* Unit Type */}
            <div className="space-y-2">
              <Label>{t("units.unitType")} *</Label>
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

            {/* Bedrooms / Bathrooms / Size */}
            <Input type="number" {...register("bedrooms")} />
            <Input type="number" {...register("bathrooms")} />
            <Input type="number" {...register("squareFeet")} />

            {/* Status */}
            <div className="space-y-2">
              <Label>{t("units.status")} *</Label>
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
                  <SelectItem value="vacant">{t("units.vacant")}</SelectItem>
                  <SelectItem value="occupied">
                    {t("units.occupied")}
                  </SelectItem>
                  <SelectItem value="maintenance">
                    {t("units.maintenance")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rent / Deposit */}
            <Input type="number" {...register("monthlyRent")} />
            <Input type="number" {...register("deposit")} />

            {/* Meter */}
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("units.meterId")} *</Label>
              <Input {...register("meterId")} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
