import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Wrench, AlertCircle } from 'lucide-react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useAuth } from '@/contexts/AuthContext';
import { MaintenanceStats } from '@/components/maintenance/MaintenanceStats';
import { MaintenanceCard } from '@/components/maintenance/MaintenanceCard';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { AssignmentForm } from '@/components/maintenance/AssignmentForm';
import { MaintenanceDetail } from '@/components/maintenance/MaintenanceDetail';
import { useToast } from '@/hooks/use-toast';
import type { MaintenanceRequest, MaintenanceStatus } from '@/types/maintenance';

export default function Maintenance() {
  const [viewMode, setViewMode] = useViewMode('maintenance');
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const {
    requests,
    isLoading,
    createRequest,
    assignRequest,
    updateStatus,
    addNote,
    getEmployees,
    availableUnits,
    loadError,
  } = useMaintenance();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<MaintenanceRequest['priority'] | 'all'>('all');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | undefined>();
  const [eligibleEmployees, setEligibleEmployees] = useState<Array<{id:string;name:string;specialty:string}>>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (selectedRequest) {
      const latest = requests.find(item => item.id === selectedRequest.id);
      if (latest && latest !== selectedRequest) setSelectedRequest(latest);
    }
  }, [requests, selectedRequest?.id]);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('request');
    if (!id) return;
    const match = requests.find(item => item.id === id);
    if (match) {
      setSelectedRequest(match);
      setShowDetail(true);
    }
  }, [location.search, requests.length]);

  const canAssign = user?.role === 'landlord' || user?.role === 'super_admin';
  const canCreate = user?.role === 'tenant';

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && request.status === 'pending') ||
      (activeTab === 'in_progress' && (request.status === 'assigned' || request.status === 'in_progress' || request.status === 'reopened')) ||
      (activeTab === 'resolved' && (request.status === 'resolved' || request.status === 'confirmed'));
    return matchesSearch && matchesPriority && matchesTab;
  });

  const handleCreateRequest = async (data: Parameters<typeof createRequest>[0]) => {
    setBusy(true);
    try {
      await createRequest(data);
      setShowRequestForm(false);
      toast({ title: 'Request created', description: 'Your request was saved.' });
    } catch (error) {
      toast({ title: 'Creation failed', description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleAssign = async (data: Parameters<typeof assignRequest>[0]) => {
    if (!canAssign) return;
    setBusy(true);
    try {
      await assignRequest(data);
      setShowAssignForm(false);
      setSelectedRequest(undefined);
      toast({ title: 'Maintenance assigned', description: 'The task was saved and notifications queued.' });
    } catch (error) {
      toast({ title: 'Assignment failed', description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleUpdateStatus = async (request: MaintenanceRequest, status: MaintenanceStatus) => {
    setBusy(true);
    try {
      await updateStatus(request.id, status);
      toast({ title: 'Status updated', description: `Maintenance is now ${status.replaceAll('_', ' ')}.` });
    } catch (error) {
      toast({ title: 'Status update failed',
        description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const handleAssignClick = async (request: MaintenanceRequest) => {
    if (!canAssign || request.status !== 'pending') return;
    setSelectedRequest(request);
    setEligibleEmployees([]);
    setShowAssignForm(true);
    setAssigneeLoading(true);
    try {
      const employees = await getEmployees(request.id);
      setEligibleEmployees(employees);
    } catch (error) {
      toast({ title: 'Cannot load eligible employees',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive' });
      setShowAssignForm(false);
    } finally { setAssigneeLoading(false); }
  };

  const handleAddNote = async (content: string) => {
    if (!selectedRequest) return;
    setBusy(true);
    try {
      const created = await addNote(selectedRequest.id, content);
      setSelectedRequest(previous => previous ? {
        ...previous,
        notes: [...previous.notes, {
          id: String(created.id), requestId: previous.id,
          userId: user?.id || '', userName: created.userName,
          userRole: (created.userRole || 'SYSTEM').toLowerCase() as MaintenanceRequest['notes'][number]['userRole'],
          content: created.content, createdAt: created.createdAt,
        }],
      } : previous);
    } catch (error) {
      toast({ title: 'Note was not saved',
        description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
      throw error;
    } finally { setBusy(false); }
  };

  return (
    <DashboardLayout
      title={t('maintenance.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('maintenance.title') },
      ]}
    >
      <div className="space-y-6">
        {loadError && <Card className="border-destructive/40"><CardContent className="py-3 text-sm text-destructive">
          Unable to load maintenance: {loadError}
        </CardContent></Card>}
        <MaintenanceStats requests={requests} />

        {/* Role-based info banner for employees */}
        {user?.role === 'employee' && (
          <Card className="border-info/50 bg-info/5">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-info" />
              <p className="text-sm">
                You can view and update the status of assigned tasks. Contact your landlord to have tasks assigned to you.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as MaintenanceRequest['priority'] | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('maintenance.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="low">{t('maintenance.low')}</SelectItem>
                <SelectItem value="medium">{t('maintenance.medium')}</SelectItem>
                <SelectItem value="high">{t('maintenance.high')}</SelectItem>
                <SelectItem value="urgent">{t('maintenance.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <Button onClick={() => setShowRequestForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('maintenance.newRequest')}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              {t('maintenance.pending')} ({requests.filter((r) => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              {t('maintenance.inProgress')} ({requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress' || r.status === 'reopened').length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Awaiting / Confirmed ({requests.filter((r) => r.status === 'resolved' || r.status === 'confirmed').length})
            </TabsTrigger>
          </TabsList>

      <div className="flex justify-end mb-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
          <TabsContent value={activeTab} className="mt-6">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No requests found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {searchQuery || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No maintenance requests have been submitted yet.'}
                  </p>
                  {canCreate && (
                    <Button onClick={() => setShowRequestForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('maintenance.newRequest')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3"}>
                {filteredRequests.map((request) => (
                  <MaintenanceCard
                    key={request.id}
                    request={request}
                    onView={handleViewRequest}
                    onAssign={canAssign ? handleAssignClick : undefined}
                    onUpdateStatus={busy ? undefined : (request, status) => { void handleUpdateStatus(request, status); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('maintenance.newRequest')}</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            onSubmit={handleCreateRequest}
            units={availableUnits}
            onCancel={() => setShowRequestForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <AssignmentForm
              request={selectedRequest}
              employees={eligibleEmployees}
              onSubmit={handleAssign}
              onCancel={() => {
                setShowAssignForm(false);
                setSelectedRequest(undefined);
              }}
              isLoading={isLoading || busy || assigneeLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="flex h-[100dvh] w-full flex-col overflow-hidden p-4 sm:max-w-xl sm:p-6">
          <SheetHeader className="shrink-0 border-b pb-4 pr-8 text-left">
            <SheetTitle>{t('maintenance.requestDetails')}</SheetTitle>
          </SheetHeader>
          {selectedRequest && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pr-1 pb-6 sm:pr-2">
              <MaintenanceDetail
                request={selectedRequest}
                onAddNote={handleAddNote}
                onClose={() => {
                  setShowDetail(false);
                  setSelectedRequest(undefined);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
