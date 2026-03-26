"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

/* ========================= SCHEMA ========================= */

const landlordSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),

  password: z.string().min(6),

  company: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional(),

  subscription: z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]),

  termsAccepted: z.boolean().refine((v) => v === true),
});

type FormData = z.infer<typeof landlordSchema>;

/* ========================= COMPONENT ========================= */

export default function LandlordOnboarding() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(landlordSchema),
    defaultValues: {
      subscription: "BASIC",
      billingCycle: "MONTHLY",
    },
  });

  /* ========================= SUBMIT ========================= */

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        user: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        },

        landlord: {
          company: data.company,
          billingCycle: data.billingCycle,
          subscription: data.subscription,
        },

        termsAccepted: data.termsAccepted,
      };

      console.log("LANDLORD PAYLOAD 🚀", payload);

      // TODO: replace with API
      // await registerLandlordService(payload);

      toast.success("Account created successfully!");
      router.push("/dashboard");

    } catch (err: any) {
      toast.error(err?.message || "Failed to create account");
    }
  };

  /* ========================= UI ========================= */

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6 space-y-6">

          <h2 className="text-xl font-bold text-center">
            Create Landlord Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
                <Input placeholder="Email" {...register("email")} />
                <Input placeholder="Phone" {...register("phone")} />
              </div>

              <Input
                type="password"
                placeholder="Password"
                {...register("password")}
              />
            </div>

            {/* ================= BUSINESS ================= */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Business Information
              </h3>

              <Input
                placeholder="Company (optional)"
                {...register("company")}
              />

              <select
                className="w-full border rounded-md p-2"
                {...register("billingCycle")}
              >
                <option value="MONTHLY">Monthly Billing</option>
                <option value="ANNUAL">Annual Billing</option>
              </select>
            </div>

            {/* ================= SUBSCRIPTION ================= */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Subscription Plan
              </h3>

              <select
                className="w-full border rounded-md p-2"
                {...register("subscription")}
              >
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>

              <p className="text-xs text-muted-foreground">
                Choose a plan based on your property scale.
              </p>
            </div>

            {/* ================= TERMS ================= */}
            <div className="space-y-1">
              <div className="flex gap-2 items-center">
                <input type="checkbox" {...register("termsAccepted")} />
                <span className="text-sm">
                  I accept terms & conditions
                </span>
              </div>

              {errors.termsAccepted && (
                <p className="text-red-500 text-sm">
                  You must accept terms
                </p>
              )}
            </div>

            {/* ================= SUBMIT ================= */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}