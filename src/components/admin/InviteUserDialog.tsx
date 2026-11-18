"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/contexts/AuthContext";
import { inviteUserService, invitationApi, type InviteOptions, type InviteSummary, type InviteUserPayload } from "@/api/service/invite.user.service.api";

type Role = InviteUserPayload["role"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviterRole: UserRole;
  initialRole?: Role;
}

export function InviteUserDialog({ open, onOpenChange, inviterRole, initialRole }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("TENANT");
  const [propertyIds, setPropertyIds] = useState<number[]>([]);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [options, setOptions] = useState<InviteOptions>({ properties: [], units: [], companies: [] });
  const [invitations, setInvitations] = useState<InviteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [available, existing] = await Promise.all([
        invitationApi.options(), invitationApi.list(),
      ]);
      setOptions(available);
      setInvitations(existing);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load invitation options");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setRole(initialRole === "LANDLORD" && inviterRole === "super_admin" ? "LANDLORD" : "TENANT");
      setEmail("");
      setCompanyId(null);
      setPropertyIds([]);
      setUnitId(null);
      void refresh();
    }
  }, [open, initialRole, inviterRole]);

  // Companies must be selectable before any property has been created.
  const companies = options.companies;

  const properties = options.properties.filter(p =>
    role !== "LANDLORD" || companyId === null || p.companyId === companyId
  );

  const availableUnits = options.units.filter(u => propertyIds.includes(u.propertyId));

  function selectRole(next: Role) {
    setRole(next);
    setPropertyIds([]);
    setUnitId(null);
    setCompanyId(null);
  }

  function toggleProperty(id: number, checked: boolean) {
    setPropertyIds(previous => {
      const next = role === "TENANT"
        ? (checked ? [id] : [])
        : (checked ? [...previous, id] : previous.filter(p => p !== id));
      return Array.from(new Set(next));
    });
    setUnitId(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }
    if (role !== "LANDLORD" && !propertyIds.length) {
      toast.error("Select an assigned property");
      return;
    }
    if (role === "TENANT" && !unitId) {
      toast.error("Select a vacant unit for this tenant");
      return;
    }
    if (role === "LANDLORD" && !companyId) {
      toast.error("Select the landlord's company");
      return;
    }

    setWorking(true);
    try {
      await inviteUserService({
        email: email.trim(),
        role,
        apartmentIds: propertyIds,
        companyId: role === "LANDLORD" ? companyId : undefined,
        unitId: role === "TENANT" ? unitId : undefined,
      });
      toast.success("Invitation accepted by email service");
      setEmail("");
      setPropertyIds([]);
      setUnitId(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation could not be sent");
    } finally {
      setWorking(false);
    }
  }

  async function action(invitation: InviteSummary, task: "resend" | "revoke") {
    setWorking(true);
    try {
      if (task === "resend") await invitationApi.resend(invitation.id);
      else await invitationApi.revoke(invitation.id);
      toast.success(task === "resend" ? "Invitation resent" : "Invitation revoked");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update invitation");
    } finally {
      setWorking(false);
    }
  }

  const roles: { value: Role; label: string }[] = inviterRole === "super_admin"
    ? [{ value: "TENANT", label: "Tenant" }, { value: "EMPLOYEE", label: "Employee" }, { value: "LANDLORD", label: "Landlord" }]
    : [{ value: "TENANT", label: "Tenant" }, { value: "EMPLOYEE", label: "Employee" }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>Invitations are sent by the backend and expire after 48 hours.</DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading available properties and invitations…</p>}
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <Label htmlFor="invite-email">Email address</Label>
            <Input id="invite-email" type="email" required value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>User role</Label>
            <Select value={role} onValueChange={value => selectRole(value as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map(r => <SelectItem value={r.value} key={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {role === "LANDLORD" && (
            <div className="space-y-1">
              <Label>Company <span className="text-destructive">*</span></Label>
              <Select value={companyId === null ? "" : String(companyId)}
                onValueChange={value => { setCompanyId(Number(value)); setPropertyIds([]); }}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>{companies.map(company => (
                  <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
                ))}</SelectContent>
              </Select>
              {!companies.length && !loading && (
                <p className="text-sm text-destructive">
                  Create a company in the Companies tab before inviting a landlord.
                </p>
              )}
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Assigned {role === "TENANT" ? "property" : "properties"} {role === "LANDLORD" && <span className="font-normal text-muted-foreground">(optional)</span>}</legend>
            {role === "LANDLORD" && (
              <p className="text-xs text-muted-foreground">
                You can invite a landlord without assigning properties. After approval, they can create properties within their company.
              </p>
            )}
            {!properties.length && <p className="text-sm text-muted-foreground">
              {role === "LANDLORD" ? "No properties in this company yet. You can still send the invitation." : "No available properties."}
            </p>}
            {properties.map(property => (
              <label key={property.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={propertyIds.includes(property.id)}
                  onChange={e => toggleProperty(property.id, e.target.checked)}
                  disabled={working} />
                {property.name}
              </label>
            ))}
          </fieldset>
          {role === "TENANT" && (
            <div className="space-y-1">
              <Label>Vacant unit</Label>
              <Select value={unitId === null ? "" : String(unitId)}
                onValueChange={value => setUnitId(Number(value))}>
                <SelectTrigger><SelectValue placeholder="Select a vacant unit" /></SelectTrigger>
                <SelectContent>{availableUnits.map(unit => (
                  <SelectItem key={unit.id} value={String(unit.id)}>{unit.unitNumber}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button type="submit" disabled={working || loading || (role === "LANDLORD" ? companyId === null : !propertyIds.length || (role === "TENANT" && !unitId))}>
              {working ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t pt-3 space-y-2">
          <h3 className="text-sm font-semibold">Existing invitations</h3>
          {!invitations.length && <p className="text-sm text-muted-foreground">No pending or expired invitations.</p>}
          {invitations.map(inv => (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm" key={inv.id}>
              <div><div className="font-medium">{inv.email}</div>
                <div className="text-muted-foreground">{inv.role} · {inv.status}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={working} onClick={() => action(inv, "resend")}>Resend</Button>
                {inv.status !== "REVOKED" && <Button size="sm" variant="destructive" disabled={working}
                  onClick={() => action(inv, "revoke")}>Revoke</Button>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
