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
} from "@/api/service/validateInvite.service";

import { completeOnboardingService } from "@/api/service/completeOnboardingService";
import { CompleteOnboardingPayload } from "@/api/dto/onboading";

/* ========================= SCHEMA ========================= */

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),

  password: z.string().min(6),
  confirmPassword: z.string().min(6),

  role: z.enum(["SUPER_ADMIN", "SUPPORT"]).default("SUPPORT"),

  termsAccepted: z.boolean().refine((v) => v === true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

/* ========================= COMPONENT ========================= */

export default function AdminOnboarding() {
  const router = useRouter();
  const token = useSearchParams()?.get("token");

  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* ========================= INVITE (OPTIONAL) ========================= */

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    validateInvite(token)
      .then((res) => {
        // Prefill if invited
        setValue("firstName", res.firstName || "");
        setValue("lastName", res.lastName || "");
        setValue("email", res.email || "");
        setValue("phone", res.phone || "");

        setLoading(false);
      })
      .catch(() => {
        setError("Invalid invite");
        setLoading(false);
      });
  }, [token, setValue]);

  /* ========================= SUBMIT ========================= */

 const onSubmit = async (data: FormData) => {
  if (!token) {
    toast.error("Invalid invite link");
    return;
  }

  try {
    const payload: CompleteOnboardingPayload = {
      type: "ADMIN", // ✅ correct type

      token,

      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,        // ✅ required
        phone: data.phone,
        password: data.password,  // ✅ required
      },

      admin: {
        role: data.role, // ✅ correct place
      },

      termsAccepted: data.termsAccepted,
    };

    console.log("ADMIN PAYLOAD 🚀", payload);

    await completeOnboardingService(payload);

    toast.success("Admin account created!");
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
            Admin Onboarding
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* PERSONAL */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="First Name" {...register("firstName")} />
              <Input placeholder="Last Name" {...register("lastName")} />
            </div>

            <Input placeholder="Email" {...register("email")} />
            <Input placeholder="Phone" {...register("phone")} />

            {/* PASSWORD */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="password"
                placeholder="Password"
                {...register("password")}
              />
              <Input
                type="password"
                placeholder="Confirm Password"
                {...register("confirmPassword")}
              />
            </div>

            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}

            {/* ROLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Admin Role
              </label>

              <select
                className="w-full border rounded-md p-2"
                {...register("role")}
              >
                <option value="SUPPORT">Support</option>
                <option value="SUPER_ADMIN">Super Admin</option>
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
              Create Admin Account
            </Button>

          </form>

        </CardContent>
      </Card>
    </div>
  );
}