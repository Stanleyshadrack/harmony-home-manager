import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
} from 'lucide-react';

import { useTenants } from '@/hooks/useTenants';
import { usePendingRegistrations } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { TenantCard } from '@/components/tenants/TenantCard';
import { TenantDetail } from '@/components/tenants/TenantDetail';
import { TenantApprovals } from '@/components/tenants/TenantApprovals';
import { Tenant } from '@/types/tenant';
import { useToast } from '@/hooks/use-toast';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';

export default function Tenants() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { tenants, isLoading, updateTenant, deleteTenant } = useTenants();
  const { registrations } = usePendingRegistrations();
  const { user } = useAuth();

  const pendingTenantRegistrations = registrations.filter(
    r => r.requestedRole === 'tenant' && r.status === 'pending'
  );

  const isLandlordOrAdmin =
    user?.role === 'landlord' || user?.role === 'super_admin';

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

const searchTerm = search.toLowerCase();

const filteredTenants = tenants.filter((tenant) => {
  const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
  const unit = tenant.unitNumber?.toLowerCase() ?? "";

  const matchesSearch =
    fullName.includes(searchTerm) ||
    tenant.email.toLowerCase().includes(searchTerm) ||
    unit.includes(searchTerm);

  if (activeTab === "all") return matchesSearch;
  return matchesSearch && tenant.status === activeTab;
});

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    pending: tenants.filter(t => t.status === 'PENDING').length,
    inactive: tenants.filter(t => t.status === 'MOVED_OUT').length,
  };

  const handleUpdate = async (data: Partial<Tenant>) => {
    if (!editingTenant) return;
    setIsSubmitting(true);
    try {
      await updateTenant(editingTenant.id, data);
      toast({
        title: t('tenants.updated'),
        description: `${data.firstName} ${data.lastName} has been updated.`,
      });
      setEditingTenant(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update user.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;
    try {
      await deleteTenant(deletingTenant.id);
      toast({
        title: t('tenants.deleted'),
        description: `${deletingTenant.firstName} ${deletingTenant.lastName} has been removed.`,
      });
      setDeletingTenant(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout
      title={t('tenants.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('tenants.title') },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, value: stats.total, label: t('tenants.totalTenants') },
          { icon: UserCheck, value: stats.active, label: t('tenants.activeTenants'), color: 'text-green-500' },
          { icon: Clock, value: stats.pending, label: t('tenants.pendingTenants'), color: 'text-yellow-500' },
          { icon: UserX, value: stats.inactive, label: t('tenants.inactiveTenants') },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Icon className={`h-5 w-5 ${color ?? 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Invite */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tenants.searchTenants')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLandlordOrAdmin && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
          {isLandlordOrAdmin && (
            <TabsTrigger value="approvals">
              Approvals
              {pendingTenantRegistrations.length > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center">
                  {pendingTenantRegistrations.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {activeTab === 'approvals' ? (
            <TenantApprovals />
          ) : isLoading ? (
            <div className="flex justify-center py-12">Loading…</div>
          ) : filteredTenants.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onView={setSelectedTenant}
                  onEdit={setEditingTenant}
                  onDelete={setDeletingTenant}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  Invite users to grant them access.
                </p>
                {isLandlordOrAdmin && (
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tenant Details */}
      <TenantDetail
        tenant={selectedTenant}
        open={!!selectedTenant}
        onOpenChange={(open) => !open && setSelectedTenant(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTenant} onOpenChange={() => setDeletingTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Dialog */}
      {isLandlordOrAdmin && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          inviterRole={user?.role || 'landlord'}
        />
      )}
    </DashboardLayout>
  );
}
