import { useState } from 'react';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    requests,
    isLoading,
    createRequest,
    assignRequest,
    updateStatus,
    addNote,
    getEmployees,
  } = useMaintenance();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<MaintenanceRequest['priority'] | 'all'>('all');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | undefined>();

  // Only landlords and super_admin can assign tasks
  const canAssign = user?.role === 'landlord' || user?.role === 'super_admin';

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
      (activeTab === 'in_progress' && (request.status === 'assigned' || request.status === 'in_progress')) ||
      (activeTab === 'resolved' && request.status === 'resolved');
    return matchesSearch && matchesPriority && matchesTab;
  });

  const handleCreateRequest = (data: any) => {
    createRequest(data, 't1', 'John Doe');
    setShowRequestForm(false);
    toast({
      title: 'Request Created',
      description: 'Maintenance request has been submitted successfully.',
    });
  };

  const handleAssign = (data: any) => {
    if (!canAssign) {
      toast({
        title: 'Permission Denied',
        description: 'Only landlords can assign maintenance tasks.',
        variant: 'destructive',
      });
      return;
    }
    assignRequest(data);
    setShowAssignForm(false);
    setSelectedRequest(undefined);
    toast({
      title: 'Request Assigned',
      description: 'Maintenance request has been assigned successfully.',
    });
  };

  const handleUpdateStatus = (request: MaintenanceRequest, status: MaintenanceStatus) => {
    updateStatus(request.id, status);
    toast({
      title: 'Status Updated',
      description: `Request marked as ${status}.`,
    });
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const handleAssignClick = (request: MaintenanceRequest) => {
    if (!canAssign) {
      toast({
        title: 'Permission Denied',
        description: 'Only landlords can assign maintenance tasks.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRequest(request);
    setShowAssignForm(true);
  };

  const handleAddNote = (content: string) => {
    if (selectedRequest) {
      const userRole = user?.role === 'super_admin' ? 'landlord' : (user?.role || 'landlord');
      const userName = (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'Property Manager';
      
      addNote(selectedRequest.id, content, user?.id || 'user', userName, userRole as 'employee' | 'landlord' | 'tenant');
      setSelectedRequest({
        ...selectedRequest,
        notes: [
          ...selectedRequest.notes,
          {
            id: `note-${Date.now()}`,
            requestId: selectedRequest.id,
            userId: user?.id || 'user',
            userName,
            userRole: userRole as 'employee' | 'landlord' | 'tenant',
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
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
          {canAssign && (
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
              {t('maintenance.inProgress')} ({requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              {t('maintenance.resolved')} ({requests.filter((r) => r.status === 'resolved').length})
            </TabsTrigger>
          </TabsList>

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
                  {canAssign && (
                    <Button onClick={() => setShowRequestForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('maintenance.newRequest')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <MaintenanceCard
                    key={request.id}
                    request={request}
                    onView={handleViewRequest}
                    onAssign={canAssign ? handleAssignClick : undefined}
                    onUpdateStatus={handleUpdateStatus}
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
              employees={getEmployees()}
              onSubmit={handleAssign}
              onCancel={() => {
                setShowAssignForm(false);
                setSelectedRequest(undefined);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('maintenance.requestDetails')}</SheetTitle>
          </SheetHeader>
          {selectedRequest && (
            <div className="mt-6">
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
