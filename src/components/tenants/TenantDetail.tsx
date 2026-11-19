import type { Tenant } from '@/types/tenant';
import { TenantMoveInClearancePanel } from './TenantMoveInClearancePanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, FileText, Mail, Phone, ShieldCheck } from 'lucide-react';

interface TenantDetailProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const money = (value: number | null | undefined) =>
  value == null ? 'Not configured' :
    new Intl.NumberFormat('en-KE', {style: 'currency', currency: 'KES'}).format(value);

function ApprovalIndicator({ status }: { status?: string | null }) {
  const label = status === 'APPROVED' ? 'Approved' : status === 'REJECTED'
    ? 'Rejected' : status === 'PENDING' ? 'Pending review' : 'Not submitted';
  return <Badge variant={status === 'APPROVED' ? 'default' : 'outline'}>{label}</Badge>;
}

/** Tenant details are derived from the backend; no fake lease signing, document uploads or deletes. */
export function TenantDetail({ tenant, open, onOpenChange }: TenantDetailProps) {
  if (!tenant) return null;
  const fullName = [tenant.firstName, tenant.lastName].filter(Boolean).join(' ');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Tenant details</SheetTitle></SheetHeader>
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={tenant.avatarUrl} />
              <AvatarFallback>{tenant.firstName?.[0]}{tenant.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{fullName}</h2>
              <p className="truncate text-sm text-muted-foreground">{tenant.email}</p>
              <Badge variant="outline" className="mt-1">{tenant.status}</Badge>
            </div>
          </div>
          <Tabs defaultValue="clearance" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
              <TabsTrigger value="clearance">Move-in</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="clearance" className="mt-4">
              <TenantMoveInClearancePanel tenantId={tenant.id} />
            </TabsContent>
            <TabsContent value="profile" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Contact & assigned property</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" />{tenant.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" />{tenant.phone || 'No phone recorded'}</p>
                  <p><strong>Property:</strong> {tenant.propertyName || 'Awaiting assignment'}</p>
                  <p><strong>Unit:</strong> {tenant.unitNumber || 'Awaiting reservation'}</p>
                  <p><strong>Account status:</strong> {tenant.status}</p>
                  <p><strong>Move-in confirmed:</strong> {tenant.moveInClearedAt
                    ? new Date(tenant.moveInClearedAt).toLocaleString('en-KE') : 'Not yet cleared'}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="lease" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" /> Lease details
                </CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <p><strong>Lease status:</strong> {tenant.leaseStatus || 'Not yet submitted'}</p>
                  <p><strong>Unit:</strong> {tenant.unitNumber || 'Not assigned'}</p>
                  <p><strong>Start:</strong> {tenant.leaseStart || 'Not set'}</p>
                  <p><strong>End:</strong> {tenant.leaseEnd || 'Not set'}</p>
                  <p><strong>Monthly rent:</strong> {money(tenant.rentAmount)}</p>
                  <p><strong>Security deposit required:</strong> {money(tenant.depositAmount)}</p>
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    A signed lease is reviewed under Approvals. Approving a lease reserves the
                    unit; it does not itself clear the tenant to move in.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Tenant document review
                </CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>Identification document</span>
                    <ApprovalIndicator status={tenant.idDocumentStatus} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>Signed lease agreement</span>
                    <ApprovalIndicator status={tenant.leaseDocumentStatus} />
                  </div>
                  <p className="flex gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Review originals securely from the landlord's Approvals queue.
                    This screen does not simulate document uploads, signing or approval.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
