"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import {
  validateInvite,
  InviteValidationResponse,
} from "@/api/service/validateInvite.service";

import { completeOnboardingService } from "@/api/service/completeOnboardingService";
import { CompleteOnboardingPayload } from "@/api/dto/onboading";

/* ========================= SCHEMA ========================= */

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),

  emergencyContact: z.string().min(2),
  emergencyPhone: z.string().min(10),
  relationship: z.string().min(2),

  startDate: z.string().min(1),
  endDate: z.string().min(1),

  monthlyRent: z.coerce.number(),
  securityDeposit: z.coerce.number(),

  termsAccepted: z.boolean().refine((v) => v === true),
});

type FormData = z.infer<typeof schema>;

/* ========================= COMPONENT ========================= */

export default function TenantOnboarding() {
  const router = useRouter();
  const token = useSearchParams()?.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteValidationResponse | null>(null);

  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* ========================= LOAD INVITE ========================= */

  useEffect(() => {
    if (!token) return;

    validateInvite(token)
      .then((res) => {
        setInvite(res);

        setValue("firstName", res.firstName || "");
        setValue("lastName", res.lastName || "");
        setValue("phone", res.phone || "");

        if (res.unit) {
          setValue("monthlyRent", res.rentAmount);
          setValue("securityDeposit", res.depositAmount);
        }

        setLoading(false);
      })
      .catch(() => {
        toast.error("Invalid invite");
        setLoading(false);
      });
  }, [token, setValue]);

  /* ========================= HELPERS ========================= */

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ========================= SUBMIT ========================= */

  console.log("INVITE:", invite);

  const onSubmit = async (data: FormData) => {
    if (!token) return;

    try {
      const leaseBase64 = leaseFile ? await toBase64(leaseFile) : null;
      const idBase64 = idFile ? await toBase64(idFile) : null;
      const avatarBase64 = avatarFile ? await toBase64(avatarFile) : null;

     if (!invite?.unit?.id || !invite?.property?.id) {
  throw new Error("Invalid invite data");
}

     const payload: CompleteOnboardingPayload = {
  type: "TENANT",
  token,

  user: {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  },

  tenant: {
   unitId: invite.unit.id,           // ✅ correct
  propertyId: invite.property.id,
    emergencyContactName: data.emergencyContact,
    emergencyContactPhone: data.emergencyPhone,
    relationship: data.relationship,
  },

  lease: {
    startDate: data.startDate,
    endDate: data.endDate,
    monthlyRent: data.monthlyRent,
    securityDeposit: data.securityDeposit,
    terms: "Standard lease agreement",
  },

  documents: {
    leaseBase64,
    idBase64,
  },

  avatarBase64,

  termsAccepted: data.termsAccepted,
};

      console.log("TENANT PAYLOAD 🚀", payload);

      await completeOnboardingService(payload);

      toast.success("Onboarding complete!");
      router.push("/auth");

    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  /* ========================= LOADING ========================= */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  /* ========================= UI ========================= */

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6 space-y-6">

          <h2 className="text-xl font-bold text-center">
            Tenant Onboarding
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* UNIT */}
            {invite?.unit && (
              <div className="border rounded-lg p-4 bg-muted/40">
                <p className="text-sm text-muted-foreground">
                  Assigned Unit
                </p>
                <div className="flex justify-between">
                 <span>{invite.property?.name}</span>
    <span>{invite.unit.unitNumber}</span>
                </div>
              </div>
            )}

            {/* PERSONAL */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="First Name" {...register("firstName")} />
              <Input placeholder="Last Name" {...register("lastName")} />
            </div>

            <Input placeholder="Phone" {...register("phone")} />

            {/* AVATAR */}
            <div>
              <p className="text-sm font-medium">Profile Photo</p>
              <Input
                type="file"
                onChange={(e) =>
                  setAvatarFile(e.target.files?.[0] || null)
                }
              />
            </div>

            {/* EMERGENCY */}
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                placeholder="Emergency Contact Name"
                {...register("emergencyContact")}
              />
              <Input
                placeholder="Emergency Phone"
                {...register("emergencyPhone")}
              />
              <Input
                placeholder="Relationship"
                {...register("relationship")}
              />
            </div>

            {/* LEASE */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input type="date" {...register("startDate")} />
              <Input type="date" {...register("endDate")} />
            </div>

            {/* FINANCIAL */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input type="number" {...register("monthlyRent")} />
              <Input type="number" {...register("securityDeposit")} />
            </div>

            {/* DOCUMENTS */}
            <div className="grid md:grid-cols-2 gap-4">

              <div className="border p-3 rounded">
                <p className="text-sm font-medium">Lease</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("/lease-template.pdf")}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Input
                  type="file"
                  onChange={(e) =>
                    setLeaseFile(e.target.files?.[0] || null)
                  }
                />
              </div>

              <div className="border p-3 rounded">
                <p className="text-sm font-medium">ID Document</p>
                <Input
                  type="file"
                  onChange={(e) =>
                    setIdFile(e.target.files?.[0] || null)
                  }
                />
              </div>

            </div>

            {/* TERMS */}
            <div className="flex gap-2 items-center">
              <input type="checkbox" {...register("termsAccepted")} />
              <span className="text-sm">Accept terms</span>
            </div>

            {errors.termsAccepted && (
              <p className="text-red-500 text-sm">
                You must accept terms
              </p>
            )}

            <Button type="submit" className="w-full">
              Complete Onboarding
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}