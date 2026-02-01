import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Loader2,
  XCircle,
  CheckCircle,
  Mail,
  Phone,
  CreditCard,
  AlertTriangle,
  User,
} from "lucide-react";

import { validateInvite } from "@/api/service/validateInvite.service";
import { completeOnboardingService } from "@/api/service/completeOnboardingService";

/* =========================
   Schema
========================= */
const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  idNumber: z.string().min(5),

  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  relationship: z.string().optional(),
  emergencyContact: z.string().optional(),

 termsAccepted: z
  .boolean()
  .refine((v) => v === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof schema>;

type Invite = {
  email: string;
  role: string;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invite, setInvite] = useState<Invite | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* =========================
     Validate invite
  ========================= */
  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    validateInvite(token)
      .then(setInvite)
      .catch((err) =>
        setError(err?.message ?? "Invite expired or invalid")
      )
      .finally(() => setLoading(false));
  }, [token]);

  /* =========================
     Submit onboarding
  ========================= */
  const onSubmit = async (data: FormData) => {
    if (!token) return;

    setSubmitting(true);
    try {
      await completeOnboardingService({
        token,
        ...data,
      });

      setCompleted(true);
      toast.success("Onboarding completed. Awaiting approval.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI STATES
  ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invalid Invitation</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-10 w-10 text-success mx-auto" />
            <h2 className="text-xl font-semibold">Onboarding Complete</h2>
            <p className="text-muted-foreground">
              Your account is pending admin approval.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================
     FORM
  ========================= */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <span>Invited as</span>
              <Badge variant="secondary">{invite?.role}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted p-3 rounded">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{invite?.email}</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField label="First Name" icon={User} register={register("firstName")} />
            <InputField label="Last Name" icon={User} register={register("lastName")} />
            <InputField label="Phone" icon={Phone} register={register("phone")} />
            <InputField label="ID Number" icon={CreditCard} register={register("idNumber")} />

            {/* Emergency Contact (Optional) */}
            <InputField label="Emergency Contact Name" icon={User} register={register("emergencyContactName")} />
            <InputField label="Emergency Contact Phone" icon={Phone} register={register("emergencyContactPhone")} />
            <InputField label="Relationship" register={register("relationship")} />
            <InputField label="Emergency Contact (Notes)" register={register("emergencyContact")} />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Checkbox
  onCheckedChange={(checked) =>
    setValue("termsAccepted", checked === true, {
      shouldValidate: true,
    })
  }
/>

              <span className="text-sm text-muted-foreground">
                  I accept the terms and conditions
                </span>
              </div>
              {errors.termsAccepted && (
                <p className="text-xs text-destructive">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            <div className="bg-warning/10 p-3 rounded flex gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-xs">
                Account activation requires admin approval
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Complete Onboarding"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   Small Helper
========================= */
function InputField({ label, icon: Icon, register }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />}
        <Input className={Icon ? "pl-10" : ""} {...register} />
      </div>
    </div>
  );
}
