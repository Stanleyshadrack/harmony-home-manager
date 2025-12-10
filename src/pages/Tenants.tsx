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
import { Users, Plus, Search, UserCheck, UserX, Clock, UserPlus } from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { usePendingRegistrations } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { TenantCard } from '@/components/tenants/TenantCard';
import { TenantForm } from '@/components/tenants/TenantForm';
import { TenantDetail } from '@/components/tenants/TenantDetail';
import { TenantApprovals } from '@/components/tenants/TenantApprovals';
import { Tenant, TenantFormData } from '@/types/tenant';
import { useToast } from '@/hooks/use-toast';

export default function Tenants() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { tenants, isLoading, addTenant, updateTenant, deleteTenant } = useTenants();
  const { registrations } = usePendingRegistrations();
  const { user } = useAuth();

  const pendingTenantRegistrations = registrations.filter(
    r => r.requestedRole === 'tenant' && r.status === 'pending'
  );
  const isLandlordOrAdmin = user?.role === 'landlord' || user?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      tenant.email.toLowerCase().includes(search.toLowerCase()) ||
      tenant.unitNumber.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && tenant.status === activeTab;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    pending: tenants.filter((t) => t.status === 'pending').length,
    inactive: tenants.filter((t) => t.status === 'inactive').length,
  };

  const handleSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, data);
        toast({
          title: t('tenants.updated'),
          description: `${data.firstName} ${data.lastName} has been updated.`,
        });
      } else {
        await addTenant(data);
        toast({
          title: t('tenants.created'),
          description: `${data.firstName} ${data.lastName} has been added.`,
        });
      }
      setShowForm(false);
      setEditingTenant(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save tenant. Please try again.',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tenant. Please try again.',
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t('tenants.totalTenants')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">{t('tenants.activeTenants')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{t('tenants.pendingTenants')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-muted-foreground">{t('tenants.inactiveTenants')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
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
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('tenants.addTenant')}
        </Button>
      </div>

      {/* Tabs and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('common.all')} ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">{t('tenants.active')} ({stats.active})</TabsTrigger>
          <TabsTrigger value="pending">{t('tenants.pending')} ({stats.pending})</TabsTrigger>
          <TabsTrigger value="inactive">{t('tenants.inactive')} ({stats.inactive})</TabsTrigger>
          {isLandlordOrAdmin && (
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Approvals
              {pendingTenantRegistrations.length > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onView={setSelectedTenant}
                  onEdit={(t) => {
                    setEditingTenant(t);
                    setShowForm(true);
                  }}
                  onDelete={setDeletingTenant}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('tenants.noTenants')}</h3>
                <p className="text-muted-foreground mb-4">{t('tenants.noTenantsDescription')}</p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('tenants.addTenant')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tenant Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTenant(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? t('tenants.editTenant') : t('tenants.addTenant')}
            </DialogTitle>
          </DialogHeader>
          <TenantForm
            tenant={editingTenant || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTenant(null);
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Sheet */}
      <TenantDetail
        tenant={selectedTenant}
        open={!!selectedTenant}
        onOpenChange={(open) => !open && setSelectedTenant(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTenant} onOpenChange={(open) => !open && setDeletingTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.deleteTenant')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.deleteConfirmation', {
                name: `${deletingTenant?.firstName} ${deletingTenant?.lastName}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
