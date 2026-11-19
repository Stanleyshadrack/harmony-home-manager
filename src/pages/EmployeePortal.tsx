import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/api/https';
import { waterReadingsApi } from '@/api/service/water.readings.service';
import type { WaterReadingFormData } from '@/types/billing';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard,
  Wrench,
  Droplets,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Building2,
  User,
} from 'lucide-react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useUnits } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceCard } from '@/components/maintenance/MaintenanceCard';
import { WaterReadingForm } from '@/components/billing/WaterReadingForm';

interface EmployeeProfile {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  propertyIds?: number[] | null;
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { requests, updateStatus, loadError: maintenanceError } = useMaintenance();
  const { units, isLoading: unitsLoading, loadError: unitsError } = useUnits();
  const profile = useQuery({
    queryKey: ['employee-profile', user?.id],
    enabled: !!user?.id && user.role === 'employee',
    queryFn: () => apiRequest<null, EmployeeProfile>({ path: '/api/employees/me', method: 'GET' }),
    retry: 1,
  });
  const propertyIds = profile.data?.propertyIds ?? [];
  const assignedUnits = units.filter(unit => propertyIds.includes(Number(unit.propertyId)));
  const occupiedAssignedUnits = assignedUnits.filter(unit => unit.status === 'occupied');
  const profileName = profile.data?.fullName?.trim()
    || [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ')
    || user?.email || 'Employee';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWaterReadingForm, setShowWaterReadingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // The backend already scopes maintenance to the authenticated employee's assignments.
  const assignedRequests = requests;

  const filteredRequests = assignedRequests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingTasks = assignedRequests.filter((r) => r.status === 'assigned').length;
  const inProgressTasks = assignedRequests.filter((r) => r.status === 'in_progress').length;
  const completedToday = assignedRequests.filter((r) => {
    if (!r.completedDate) return false;
    const today = new Date().toDateString();
    return new Date(r.completedDate).toDateString() === today;
  }).length;

  const handleStartTask = async (requestId: string) => {
    setIsLoading(true);
    try {
      await updateStatus(requestId, 'in_progress');
      toast({
        title: 'Task Started',
        description: 'You have started working on this task.',
      });
    } catch (error) {
      toast({ title: 'Maintenance action failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (requestId: string) => {
    setIsLoading(true);
    try {
      await updateStatus(requestId, 'resolved');
      toast({
        title: 'Task Completed',
        description: 'The maintenance task has been marked as completed.',
      });
    } catch (error) {
      toast({ title: 'Maintenance action failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterReading = async (data: WaterReadingFormData) => {
    if (!occupiedAssignedUnits.some(unit => Number(unit.id) === Number(data.unitId))) {
      toast({ title: 'Invalid unit', description: 'Select a unit assigned to you.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await waterReadingsApi.create({
        unitId: Number(data.unitId),
        meterId: String(data.meterId),
        currentReading: Number(data.currentReading),
        ratePerUnit: Number(data.ratePerUnit),
        readingDate: data.readingDate,
        billingPeriod: data.billingPeriod,
      });
      toast({
        title: 'Water reading recorded',
        description: result.status === 'PENDING'
          ? 'Saved for landlord approval; no invoice was generated.'
          : 'Reading saved successfully.',
      });
      setShowWaterReadingForm(false);
    } catch (error) {
      toast({
        title: 'Water reading failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Employee Portal' }]}
      title="Employee Portal"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.isLoading ? 'Loading employee...' : profileName}</h1>
              <p className="text-muted-foreground">{profile.data?.jobTitle || 'Employee'}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {profile.isLoading ? 'Loading properties...' : `${propertyIds.length} Properties Assigned`}
          </Badge>
        </div>

        {profile.isError && <p role="alert" className="text-sm text-destructive">
          Employee profile could not be loaded: {profile.error instanceof Error ? profile.error.message : 'Please retry.'}
        </p>}
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingTasks}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-info/10">
                <Wrench className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTasks}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">{completedToday}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
                <p className="text-2xl font-bold">{assignedRequests.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">My Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Water Readings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Urgent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Urgent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignedRequests
                    .filter((r) => r.priority === 'urgent' && r.status !== 'resolved')
                    .slice(0, 3)
                    .map((request) => (
                      <div
                        key={request.id}
                        className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.propertyName} • Unit {request.unitNumber}
                            </p>
                          </div>
                          <Badge variant="destructive">Urgent</Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {request.status === 'assigned' && (
                            <Button size="sm" onClick={() => handleStartTask(request.id)}>
                              Start Task
                            </Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleCompleteTask(request.id)}>
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  {assignedRequests.filter((r) => r.priority === 'urgent' && r.status !== 'resolved').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No urgent tasks</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignedRequests
                    .filter((r) => r.status !== 'resolved' && r.status !== 'cancelled')
                    .slice(0, 5)
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            request.status === 'in_progress' ? 'bg-info' : 'bg-warning'
                          }`} />
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.category}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{request.status.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  {assignedRequests.filter((r) => r.status !== 'resolved').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No tasks scheduled</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {maintenanceError && (
              <p role="alert" className="text-sm text-destructive">
                Maintenance tasks could not be loaded: {maintenanceError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="relative">
                  <MaintenanceCard request={request} />
                  <div className="px-4 pb-4 flex gap-2">
                    {request.status === 'assigned' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleStartTask(request.id)}
                        disabled={isLoading}
                      >
                        Start Working
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCompleteTask(request.id)}
                        disabled={isLoading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
              {filteredRequests.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Tasks Found</p>
                    <p className="text-muted-foreground">You don't have any assigned tasks</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Water Readings Tab */}
          <TabsContent value="water" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Water Meter Readings</h2>
                <p className="text-muted-foreground">Record water consumption for units</p>
              </div>
              <Button disabled={profile.isLoading || profile.isError || occupiedAssignedUnits.length === 0} onClick={() => setShowWaterReadingForm(true)}>
                <Droplets className="h-4 w-4 mr-2" />
                New Reading
              </Button>
            </div>

            {unitsError && <p role="alert" className="text-sm text-destructive">{unitsError}</p>}
            {(profile.isLoading || unitsLoading) && <p className="text-sm text-muted-foreground">Loading assigned units...</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupiedAssignedUnits.map((unit) => (
                <Card key={unit.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Unit {unit.unitNumber}</p>
                        <p className="text-sm text-muted-foreground">Meter: {unit.meterId}</p>
                      </div>
                      <Droplets className="h-5 w-5 text-info" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowWaterReadingForm(true)}
                    >
                      Record Reading
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Messages</p>
                <p className="text-muted-foreground">
                  View and respond to tenant messages from the main Messages page
                </p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/messages'}>
                  Go to Messages
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Water Reading Dialog */}
      <Dialog open={showWaterReadingForm} onOpenChange={setShowWaterReadingForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Water Reading</DialogTitle>
          </DialogHeader>
          <WaterReadingForm
            onSubmit={handleWaterReading}
            allowedUnitIds={occupiedAssignedUnits.map(unit => Number(unit.id))}
            onCancel={() => setShowWaterReadingForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
