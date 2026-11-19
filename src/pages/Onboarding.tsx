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
import { ApiHttpError } from "@/api/https";
import { completeOnboardingService, CompleteOnboardingPayload } from "@/api/service/completeOnboardingService";
import type { InviteValidationResponse } from "@/api/service/validateInvite.service";

/* =========================
   Schema
========================= */
const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  idNumber: z.string().optional(),

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

type Invite = InviteValidationResponse;

function readDocument(file: File): Promise<string> {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("Documents must be PDF, JPG or PNG and no larger than 10 MB");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read selected file"));
    reader.readAsDataURL(file);
  });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceError, setIsServiceError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [leaseDocument, setLeaseDocument] = useState<File | null>(null);

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
    let mounted = true;
    setLoading(true);
    setError(null);
    setIsServiceError(false);
    if (!token) {
      setError("The invitation link is missing its token. Ask your inviter to resend it.");
      setLoading(false);
      return;
    }

    void validateInvite(token)
      .then((details) => {
        if (!mounted) return;
        if (!details.valid) throw new Error('Invitation could not be verified');
        setInvite(details);
        if (details.firstName) setValue('firstName', details.firstName);
        if (details.lastName) setValue('lastName', details.lastName);
        if (details.phone) setValue('phone', details.phone);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const code = err instanceof ApiHttpError ? err.status : null;
        const unavailable = code === 429 || code === 500 || code === 502 ||
          code === 503 || code === 504 || code === null;
        setIsServiceError(unavailable);
        if (code === 429) setError('Too many requests. Try again shortly.');
        else if (unavailable)
          setError('The invitation service is temporarily unavailable. Your link may still be valid.');
        else setError(err instanceof Error ? err.message :
          'This invitation has expired or was replaced. Ask your inviter to resend it.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [token, setValue, retryCount]);

  /* =========================
     Submit onboarding
  ========================= */
  const onSubmit = async (data: FormData) => {
    if (!token || !invite) return;

    setSubmitting(true);
    try {
      const payload: CompleteOnboardingPayload = {
        token,
        user: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
        termsAccepted: data.termsAccepted,
      };

      if (invite.role === "TENANT") {
        const unitId = invite.unit?.id;
        const propertyId = invite.unit?.propertyId ?? invite.property?.id;
        if (!unitId || !propertyId) {
          throw new Error("This invitation is missing an assigned property or unit");
        }
        if (!data.idNumber || data.idNumber.length < 5) {
          throw new Error("Enter your identification number");
        }
        if (!leaseStart || !leaseEnd || leaseEnd < leaseStart) {
          throw new Error("Enter valid lease start and end dates");
        }
        if (!idDocument || !leaseDocument) {
          throw new Error("Upload your ID and lease documents for approval");
        }

        const [idBase64, leaseBase64] = await Promise.all([
          readDocument(idDocument),
          readDocument(leaseDocument),
        ]);
        payload.tenant = {
          propertyId,
          unitId,
          idNumber: data.idNumber,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          relationship: data.relationship,
        };
        payload.lease = {
          startDate: leaseStart,
          endDate: leaseEnd,
          monthlyRent: invite.rentAmount ?? null,
          securityDeposit: invite.depositAmount ?? null,
        };
        payload.documents = { idBase64, leaseBase64 };
      }

      if (invite.role === "LANDLORD") {
        payload.landlord = { companyName: invite.companyName ?? undefined };
        payload.companyId = invite.companyId;
        payload.apartmentIds = invite.apartments?.map((property) => property.id) ?? [];
      }

      if (invite.role === "EMPLOYEE") {
        payload.employee = {
          propertyIds: invite.apartments?.map((property) => property.id) ?? [],
        };
        if (!payload.employee.propertyIds.length) {
          throw new Error("No properties were assigned to this employee invitation");
        }
      }

      await completeOnboardingService(payload);
      setCompleted(true);
      toast.success(invite.role === "TENANT"
        ? "Application submitted. The landlord will review your documents and lease."
        : "Onboarding completed. Awaiting account approval.");
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
            <h2 className="text-xl font-semibold">{isServiceError ? 'Invitation service unavailable' : 'Invalid Invitation'}</h2>
            <p className="text-muted-foreground">{error}</p>
            {isServiceError ? (
              <Button type="button" variant="outline"
                onClick={() => setRetryCount(value => value + 1)}
                className="w-full">
                Retry invitation validation
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                The person who invited you can use <strong>Invitations → Resend</strong>
                to issue a new link. Older links stop working after resending.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Watch your email for a password-setup link after approval. Do not attempt to move in until final clearance is confirmed.
            </p>
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
              {invite?.role === "TENANT"
                ? "Your tenant application and documents have been submitted for landlord review. The unit remains reserved while approvals and initial payments are completed. You may move in only after the landlord confirms final clearance."
                : "Your account is awaiting approval."}
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
            {invite?.role === "TENANT" && (
              <InputField label="ID Number" icon={CreditCard} register={register("idNumber")} />
            )}

            {/* Emergency Contact (Optional) */}
            <InputField label="Emergency Contact Name" icon={User} register={register("emergencyContactName")} />
            <InputField label="Emergency Contact Phone" icon={Phone} register={register("emergencyContactPhone")} />
            <InputField label="Relationship" register={register("relationship")} />
            <InputField label="Emergency Contact (Notes)" register={register("emergencyContact")} />

            {invite?.role === "TENANT" && (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="font-semibold">Lease and identity documents</p>
                <p className="text-sm text-muted-foreground">
                  Unit {invite.unit?.unitNumber ?? "—"} · {invite.unit?.propertyName ?? invite.property?.name}
                </p>
                <div className="space-y-1">
                  <Label htmlFor="lease-start">Lease start date</Label>
                  <Input id="lease-start" type="date" value={leaseStart}
                    onChange={(event) => setLeaseStart(event.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lease-end">Lease end date</Label>
                  <Input id="lease-end" type="date" value={leaseEnd} min={leaseStart || undefined}
                    onChange={(event) => setLeaseEnd(event.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="id-file">Identity document (PDF, JPG or PNG)</Label>
                  <Input id="id-file" type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => setIdDocument(event.target.files?.[0] ?? null)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lease-file">Signed lease document (PDF, JPG or PNG)</Label>
                  <Input id="lease-file" type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => setLeaseDocument(event.target.files?.[0] ?? null)} required />
                </div>
              </div>
            )}

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
                {invite?.role === "TENANT"
                    ? "Your application needs landlord approval. Approved applicants receive a separate password-setup email. Signing a lease or paying a deposit does not authorize move-in."
                    : "Account activation requires approval."}
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
