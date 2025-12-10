import { useState } from 'react';
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
import { useBilling } from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceCard } from '@/components/maintenance/MaintenanceCard';
import { WaterReadingForm } from '@/components/billing/WaterReadingForm';

// Mock current employee data
const MOCK_EMPLOYEE = {
  id: 'emp-1',
  name: 'James Kamau',
  email: 'james.kamau@property.com',
  role: 'Maintenance Technician',
  assignedProperties: ['1', '2'],
};

export default function EmployeePortal() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { requests, updateStatus, addNote } = useMaintenance();
  const { units } = useUnits();
  const { createWaterInvoice } = useBilling();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWaterReadingForm, setShowWaterReadingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter requests assigned to this employee
  const assignedRequests = requests.filter(
    (req) => req.assignedTo === MOCK_EMPLOYEE.id
  );

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
      updateStatus(requestId, 'in_progress', 'Work started by technician');
      toast({
        title: 'Task Started',
        description: 'You have started working on this task.',
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (requestId: string) => {
    setIsLoading(true);
    try {
      updateStatus(requestId, 'resolved', 'Task completed by technician');
      toast({
        title: 'Task Completed',
        description: 'The maintenance task has been marked as completed.',
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterReading = async (data: any) => {
    setIsLoading(true);
    try {
      const unit = units.find((u) => u.id === data.unitId);
      if (unit) {
        createWaterInvoice(
          data,
          'tenant-1',
          'Tenant Name',
          'Property Name',
          unit.unitNumber
        );
        toast({
          title: 'Water Reading Recorded',
          description: 'Invoice has been generated for the tenant.',
        });
        setShowWaterReadingForm(false);
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
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
              <h1 className="text-2xl font-bold">{MOCK_EMPLOYEE.name}</h1>
              <p className="text-muted-foreground">{MOCK_EMPLOYEE.role}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {MOCK_EMPLOYEE.assignedProperties.length} Properties Assigned
          </Badge>
        </div>

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
              <Button onClick={() => setShowWaterReadingForm(true)}>
                <Droplets className="h-4 w-4 mr-2" />
                New Reading
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.filter((u) => u.status === 'occupied').map((unit) => (
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
            onCancel={() => setShowWaterReadingForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
