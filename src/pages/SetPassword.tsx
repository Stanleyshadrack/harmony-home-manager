"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { XCircle, Eye, EyeOff, Lock, Loader2 } from "lucide-react";

import { validateSetPasswordToken } from "@/api/service/validateSetPassword.service";
import { setPasswordService } from "@/api/service/setPasswordApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

/* =========================
   Schema
========================= */
const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormData = z.infer<typeof schema>;

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* =========================
     Token pre-validation
  ========================= */
  useEffect(() => {
    if (!token) {
      setError("Invalid or expired password setup link");
      setLoading(false);
      return;
    }

    validateSetPasswordToken(token)
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err?.message ?? "Invalid or expired password setup link");
        setLoading(false);
      });
  }, [token]);

  /* =========================
     Submit
  ========================= */
 const onSubmit = async (data: FormData) => {
  if (!token) {
    toast.error("Invalid or expired password setup link");
    return;
  }

  setSubmitting(true);
  try {
    await setPasswordService({
      token,
      password: data.password,
    });

    toast.success("Password set successfully. Please log in.");

    // ✅ NEXT.JS NAVIGATION
    router.replace("/auth");

  } catch (err: any) {
    toast.error(err?.message ?? "Failed to set password");
  } finally {
    setSubmitting(false);
  }
};

  /* =========================
     Guarded UI states
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
            <h2 className="text-xl font-semibold">Link Invalid</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Set Your Password</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a strong password to secure your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Password */}
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  className={`pl-10 pr-10 ${
                    errors.password ? "border-destructive" : ""
                  }`}
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>

              <PasswordStrengthIndicator password={watch("password")} />
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                className={errors.confirmPassword ? "border-destructive" : ""}
                {...register("confirmPassword")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Setting password…" : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}