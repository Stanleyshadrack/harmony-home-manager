"use client";

import { useRouter } from "next/navigation"; // ⚠️ keep if using Next
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/api/https";
import { validateInvite } from "@/api/service/validateInvite.service";

/* ========================= SCHEMA ========================= */

const landlordSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),

  companyName: z.string().optional(),

  termsAccepted: z.boolean().refine((v) => v === true),
});

type FormData = z.infer<typeof landlordSchema>;

/* ========================= COMPONENT ========================= */

export default function LandlordOnboarding({ token }: { token: string }) {
  const router = useRouter();

  const [apartments, setApartments] = useState<
    { id: number; name: string }[]
  >([]);

  const [selectedApartments, setSelectedApartments] = useState<number[]>([]);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(landlordSchema),
  });

  /* ========================= LOAD INVITE ========================= */

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invite link");
      return;
    }

    validateInvite(token)
      .then((res: any) => {
        setInviteData(res);
        // Prefill user data
        if (res.firstName) setValue("firstName", res.firstName);
        if (res.lastName) setValue("lastName", res.lastName);
        if (res.phone) setValue("phone", res.phone);

        // Load apartments
        if (res.apartments) {
          setApartments(res.apartments);
          setSelectedApartments(res.apartments.map((a: any) => a.id));
        }

        setLoadingInvite(false);
      })
      .catch(() => {
        toast.error("Invalid or expired invite");
      });
  }, [token, setValue]);

  /* ========================= SUBMIT ========================= */

  const onSubmit = async (data: FormData) => {
  try {
    if (!token) {
      toast.error("Invalid invite");
      return;
    }

    const payload = {
      token,
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      landlord: {
        companyName: data.companyName,
      },
      apartmentIds: selectedApartments,
      termsAccepted: data.termsAccepted,
    };

    await apiRequest({
      path: "/api/auth/onboarding",
      method: "POST",
      body: payload,
    });

    toast.success("Onboarding completed");

    if (!inviteData?.email) {
      toast.error("Missing email from invite");
      return;
    }

    router.push(
  `/awaiting-approval?email=${inviteData.email}&role=${inviteData.role}`
);

  } catch (err: any) {
    toast.error(err?.message || "Failed");
  }
};

  /* ========================= UI ========================= */

  if (loadingInvite) {
    return <div className="text-center mt-10">Loading invite...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6 space-y-6">

          <h2 className="text-xl font-bold text-center">
            Complete Your Registration
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* PERSONAL */}
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="First Name" {...register("firstName")} />
                <Input placeholder="Last Name" {...register("lastName")} />
              </div>

              <Input placeholder="Phone" {...register("phone")} />
            </div>

            {/* BUSINESS */}
            <Input
              placeholder="Company Name"
              {...register("companyName")}
            />

            {/* APARTMENTS */}
            <div>
              <p className="text-sm font-medium mb-2">
                Assigned Apartments
              </p>

              <div className="flex flex-wrap gap-2">
                {apartments.map((apt) => (
                  <span
                    key={apt.id}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    {apt.name}
                  </span>
                ))}
              </div>
            </div>

            {/* TERMS */}
            <label className="flex gap-2 items-center">
              <input type="checkbox" {...register("termsAccepted")} />
              Accept terms
            </label>

            {/* SUBMIT */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Complete"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}