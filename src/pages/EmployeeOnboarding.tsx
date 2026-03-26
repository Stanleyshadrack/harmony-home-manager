"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";

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

  role: z.enum(["MANAGER", "CARETAKER", "ACCOUNTANT"]),

  termsAccepted: z.boolean().refine((v) => v === true),
});

type FormData = z.infer<typeof schema>;

/* ========================= COMPONENT ========================= */

export default function EmployeeOnboarding() {
  const router = useRouter();
  const token = useSearchParams()?.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [property, setProperty] =
    useState<InviteValidationResponse["property"] | null>(null);

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
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    validateInvite(token)
      .then((res) => {
        // Prefill
        setValue("firstName", res.firstName || "");
        setValue("lastName", res.lastName || "");
        setValue("phone", res.phone || "");

        // Property assignment
        setProperty(res.property || null);

        setLoading(false);
      })
      .catch(() => {
        setError("Invalid invite");
        setLoading(false);
      });
  }, [token, setValue]);

  /* ========================= SUBMIT ========================= */

  const onSubmit = async (data: FormData) => {
    if (!token) return;

    try {
      const payload: CompleteOnboardingPayload = {
  type: "EMPLOYEE", // ✅ REQUIRED

  token,

  user: {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  },

  employee: {
    role: data.role,
    propertyId: property?.id,
  },

  termsAccepted: data.termsAccepted,
};

      console.log("EMPLOYEE PAYLOAD 🚀", payload);

      await completeOnboardingService(payload);

      toast.success("Employee onboarding complete!");
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
      <Card className="max-w-xl w-full">
        <CardContent className="p-6 space-y-6">

          <h2 className="text-xl font-bold text-center">
            Employee Onboarding
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* PROPERTY */}
            {property && (
              <div className="border rounded-lg p-4 bg-muted/40">
                <p className="text-sm text-muted-foreground">
                  Assigned Property
                </p>
                <p className="font-medium">{property.name}</p>
              </div>
            )}

            {/* PERSONAL */}
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="First Name" {...register("firstName")} />
                <Input placeholder="Last Name" {...register("lastName")} />
              </div>

              <Input placeholder="Phone" {...register("phone")} />
            </div>

            {/* ROLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>

              <select
                className="w-full border rounded-md p-2"
                {...register("role")}
              >
                <option value="MANAGER">Manager</option>
                <option value="CARETAKER">Caretaker</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
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

            {/* SUBMIT */}
            <Button type="submit" className="w-full">
              Complete Onboarding
            </Button>

          </form>

        </CardContent>
      </Card>
    </div>
  );
}