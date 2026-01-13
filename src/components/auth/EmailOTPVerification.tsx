import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { tokenService, AuthTokens } from "@/services/tokenService";
import { verifyMfaService } from "@/api/service/verifyMfaService";
import { resendOtpService } from "@/api/service/resendOtpService";

interface EmailOTPVerificationProps {
  email: string;
  onSuccess: (tokens: AuthTokens) => void;
  onBack: () => void;
}

export function EmailOTPVerification({
  email,
  onSuccess,
  onBack,
}: EmailOTPVerificationProps) {
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  /** --------------------------------------------------
   * Enable resend after 30s (UX only)
   * -------------------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => setCanResend(true), 30_000);
    return () => clearTimeout(timer);
  }, []);

  /** --------------------------------------------------
   * VERIFY OTP (EXPLICIT ACTION ONLY)
   * -------------------------------------------------- */
 const verify = async () => {
  if (code.length !== 6 || isVerifying) return;

  setIsVerifying(true);

  try {
    const res = await verifyMfaService({
      email,
      otp: code,
    });

    const tokens: AuthTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };

    // ✅ CORRECT storage method
    tokenService.setTokens(tokens);

    toast.success("Verification successful", {
      description: "You are now logged in.",
    });

    onSuccess(tokens);
  } catch (err: any) {
    toast.error(
      typeof err?.message === "string"
        ? err.message
        : "Invalid verification code"
    );
    setCode("");
  } finally {
    setIsVerifying(false);
  }
};


  /** --------------------------------------------------
   * RESEND OTP
   * -------------------------------------------------- */
  const handleResend = async () => {
    setIsResending(true);

    try {
      await resendOtpService({ email });

      toast.success("Verification code resent", {
        description: "Please check your email.",
      });

      setCode("");
      setCanResend(false);
      setTimeout(() => setCanResend(true), 30_000);
    } catch (err: any) {
      toast.error(
        typeof err?.message === "string"
          ? err.message
          : "Unable to resend code"
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">
          {t("auth.verifyEmail", "Verify Your Email")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          We've sent a 6-digit code to
        </p>
        <p className="font-medium">{email}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          disabled={isVerifying}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={verify}
        className="w-full"
        disabled={code.length !== 6 || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify & Login"
        )}
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={!canResend || isResending}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {canResend ? "Resend Code" : "Resend available soon"}
            </>
          )}
        </Button>

        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("auth.backToLogin", "Back to Login")}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Check your spam folder if you don’t see the email
      </p>
    </div>
  );
}
