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
  const [apartments, setApartments] =
  useState<InviteValidationResponse["apartments"] | null>(null);

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
        setApartments(res.apartments || []);

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
  propertyIds: apartments?.map((p) => p.id) || [],
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
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-white" />
    </div>
  );
}

  if (loading) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-white" />
    </div>
  );
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

            {apartments && apartments.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/40">
              <p className="text-sm text-muted-foreground mb-3">
                Assigned Properties
              </p>

              <div className="flex flex-wrap gap-2">
                {apartments.map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

            {/* PERSONAL */}
            
           <div className="space-y-4">

  {/* NAME ROW */}
  <div className="grid md:grid-cols-2 gap-4">

    <div className="space-y-1">
      <label className="text-sm font-medium">
        First Name
      </label>
      <Input
        placeholder="Enter first name"
        {...register("firstName")}
      />
    </div>

    <div className="space-y-1">
      <label className="text-sm font-medium">
        Last Name
      </label>
      <Input
        placeholder="Enter last name"
        {...register("lastName")}
      />
    </div>

  </div>

  {/* PHONE */}
  <div className="space-y-1">
    <label className="text-sm font-medium">
      Phone Number
    </label>
    <Input
      placeholder="e.g. 0712345678"
      {...register("phone")}
    />
  </div>

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
            <div className="flex items-center gap-3">
            <input
              type="checkbox"
              
              {...register("termsAccepted")}
            />
            <span className="text-sm text-muted-foreground">
              I agree to the terms
            </span>
          </div>

          {errors.termsAccepted && (
            <p className="text-red-500 text-sm">
              You must accept terms
            </p>
          )}

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