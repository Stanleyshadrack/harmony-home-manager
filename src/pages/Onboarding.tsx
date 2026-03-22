"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, XCircle, CheckCircle } from "lucide-react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  InviteValidationResponse,
  validateInvite,
} from "@/api/service/validateInvite.service";
import { completeOnboardingService } from "@/api/service/completeOnboardingService";

/* ========================= SCHEMA ========================= */

const baseSchema = {
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  termsAccepted: z.boolean().refine((v) => v === true),
};

const tenantSchema = z.object({
  ...baseSchema,
  idNumber: z.string().min(5),

  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(10),
  relationship: z.string().min(2),

  leaseStartDate: z.string().min(1),
  leaseEndDate: z.string().min(1),

  rentAmount: z.coerce.number(),
  depositAmount: z.coerce.number(),

  numberOfOccupants: z.coerce.number(),

  paymentMethod: z.string().min(2),
  mpesaNumber: z.string().optional(),
});

type FormData = z.infer<typeof tenantSchema>;

/* ========================= COMPONENT ========================= */

export default function OnboardingPage() {
  const router = useRouter();
  const token = useSearchParams()?.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] =
    useState<InviteValidationResponse["unit"] | null>(null);
    const [leaseFile, setLeaseFile] = useState<File | null>(null);
const [idFile, setIdFile] = useState<File | null>(null);

  const isUnitAssigned = !!unit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
  resolver: zodResolver(tenantSchema),
  defaultValues: {
    paymentMethod: "M-Pesa",
  },
});

  /* ========================= LOAD INVITE ========================= */

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    validateInvite(token)
      .then((res) => {
        setUnit(res.unit || null);

        // 🔥 Prefill
        setValue("firstName", res.firstName || "");
        setValue("lastName", res.lastName || "");
        setValue("phone", res.phone || "");

        // 🔥 Rent + Deposit auto-fill
        if (res.unit) {
          setValue("rentAmount", res.rentAmount);
          setValue("depositAmount", res.depositAmount);
        }

        setLoading(false);
      })
      .catch(() => {
        setError("Invalid invite");
        setLoading(false);
      });
  }, [token, setValue]);

  /* ========================= SUBMIT ========================= */

 const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const onSubmit = async (data: FormData) => {
  console.log("SUBMIT HIT ✅", data);
  if (!token) return;

  try {
    // 🔥 convert files
    const leaseBase64 = leaseFile ? await toBase64(leaseFile) : null;
    const idBase64 = idFile ? await toBase64(idFile) : null;

    // 🔥 build payload (IMPORTANT)
    const payload = {
      token,

      tenant: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        propertyId: unit?.id,
        unitId: unit?.id,
        emergencyContact: `${data.emergencyContactName} (${data.relationship}) - ${data.emergencyContactPhone}`,
      },

      lease: {
        startDate: data.leaseStartDate,
        endDate: data.leaseEndDate,
        monthlyRent: data.rentAmount,
        securityDeposit: data.depositAmount,
        terms: "Standard lease agreement",
      },

      leaseBase64,
      idBase64,

      termsAccepted: data.termsAccepted,
    };

    await completeOnboardingService(payload);

    toast.success("Onboarding complete!");
    router.push("/auth");

  } catch (err: any) {
    toast.error(err?.message || "Failed");
  }
};

  /* ========================= STATES ========================= */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-10">{error}</div>;
  }

  /* ========================= UI ========================= */

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-center">
            Complete Your Profile
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

  {/* 🔥 UNIT DISPLAY */}
  {unit && (
    <div className="border rounded-lg p-4 bg-muted/40">
      <p className="text-sm text-muted-foreground">Assigned Unit</p>
      <div className="flex justify-between">
        <span>{unit.propertyName}</span>
        <span>{unit.unitNumber}</span>
      </div>
    </div>
  )}

  {/* ================= PERSONAL ================= */}
  <div className="space-y-3">
    <h3 className="text-sm font-medium">
      Personal Information
    </h3>

    <div className="grid md:grid-cols-2 gap-4">
      <Input placeholder="First Name" {...register("firstName")} />
      <Input placeholder="Last Name" {...register("lastName")} />
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <Input placeholder="Phone" {...register("phone")} />
      <Input placeholder="ID Number" {...register("idNumber")} />
    </div>
  </div>

  {/* ================= LEASE ================= */}
  <div className="space-y-3">
    <h3 className="text-sm font-medium">
      Lease Details
    </h3>

    <div className="grid md:grid-cols-2 gap-4">
      <Input type="date" {...register("leaseStartDate")} />
      <Input type="date" {...register("leaseEndDate")} />
    </div>
  </div>

  {/* ================= FINANCIAL ================= */}
  <div className="space-y-2">

    <h3 className="text-sm font-medium">
      Financial Details
    </h3>

    {isUnitAssigned ? (
      <div className="grid md:grid-cols-2 gap-4">

        <div className="rounded-md border p-3 bg-muted/40">
          <p className="text-xs text-muted-foreground">Rent</p>
          <p className="font-semibold">
            KES {Number(watch("rentAmount") || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-md border p-3 bg-muted/40">
          <p className="text-xs text-muted-foreground">Deposit</p>
          <p className="font-semibold">
            KES {Number(watch("depositAmount") || 0).toLocaleString()}
          </p>
        </div>

      </div>
    ) : (
     <div className="grid md:grid-cols-2 gap-4">

  <div>
    
    <Input
      type="number"
      placeholder="Rent Amount"
      {...register("rentAmount")}
    />
  </div>

  <div>
    <Input
      type="number"
      placeholder="Deposit amount"
      {...register("depositAmount")}
    />
  </div>

</div>
    )}

    {isUnitAssigned && (
      <p className="text-xs text-muted-foreground">
        These values are predefined for the assigned unit.
      </p>
    )}
  </div>

  {/* ================= OCCUPANCY ================= */}
  <div className="space-y-3">
    <h3 className="text-sm font-medium">
      Occupancy
    </h3>

    <Input
      type="number"
      placeholder="Number of Occupants"
      {...register("numberOfOccupants")}
    />
  </div>

  {/* ================= EMERGENCY ================= */}
  <div className="space-y-3">
    <h3 className="text-sm font-medium">
      Emergency Contact
    </h3>

    <div className="grid md:grid-cols-2 gap-4">
      <Input
        placeholder="Emergency Name"
        {...register("emergencyContactName")}
      />
      <Input
        placeholder="Emergency Phone"
        {...register("emergencyContactPhone")}
      />
    </div>

    <Input
      placeholder="Relationship"
      {...register("relationship")}
    />
  </div>

 
{/* ================= DOCUMENTS ================= */}
<div className="space-y-3">
  <h3 className="text-sm font-medium">
    Documents
  </h3>

  <div className="grid md:grid-cols-2 gap-4">

    {/* LEASE */}
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Lease Agreement</p>
          <p className="text-xs text-muted-foreground">
            Download, sign & upload
          </p>
        </div>

       <Button
  type="button"
  size="sm"
  variant="outline"
  onClick={() => window.open("/lease-template.pdf")}
  className="flex items-center gap-2"
>
  <Download className="h-4 w-4" />
  
</Button>
      </div>

      <Input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setLeaseFile(e.target.files?.[0] || null)}
      />
    </div>

    {/* ID */}
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">ID / Passport</p>
        <p className="text-xs text-muted-foreground">
          Upload identification document
        </p>
      </div>

      <Input
        type="file"
        accept=".jpg,.png,.pdf"
        onChange={(e) => setIdFile(e.target.files?.[0] || null)}
      />
    </div>

  </div>
</div>

  {/* TERMS */}
  <div className="space-y-1">
  <div className="flex gap-2 items-center">
    <input type="checkbox" {...register("termsAccepted")} />
    <span className="text-sm">Accept terms</span>
  </div>

  {errors.termsAccepted && (
    <p className="text-red-500 text-sm">
      You must accept terms
    </p>
  )}
</div>

  <Button type="submit" className="w-full">
    Complete Onboarding
  </Button>
</form>
        </CardContent>
      </Card>
    </div>
  );
}