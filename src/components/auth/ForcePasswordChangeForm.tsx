import { useState } from "react";
import { apiRequest } from "@/api/https";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function ForcePasswordChangeForm({ email, onSuccess, onBack }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 12) {
      toast.error("Choose a password of at least 12 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiRequest<{email: string; oldPassword: string; newPassword: string}, unknown>({
        path: "/api/auth/force-password-change",
        method: "POST",
        body: { email, oldPassword, newPassword },
      });
      toast.success("Password changed. Please sign in again to receive your email verification code.");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Change your temporary password</h2>
        <p className="text-sm text-muted-foreground">
          Your account requires a password change before login. You will verify by email next.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="forced-email">Email address</Label>
        <Input id="forced-email" value={email} readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="forced-old-password">Current password</Label>
        <Input id="forced-old-password" type="password" autoComplete="current-password"
          value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="forced-new-password">New password (12+ characters)</Label>
        <Input id="forced-new-password" type="password" autoComplete="new-password"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={12} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="forced-confirm-password">Confirm new password</Label>
        <Input id="forced-confirm-password" type="password" autoComplete="new-password"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : "Change password"}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Back to login
      </Button>
    </form>
  );
}
