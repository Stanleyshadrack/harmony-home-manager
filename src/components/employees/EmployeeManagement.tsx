import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useProperties } from '@/hooks/useProperties';
import { usePendingRegistrations, PendingRegistration } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Building2,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Clock,
  Wrench,
  AlertTriangle,
  Home,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EmployeeManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { employees, isLoading, activateEmployee, deactivateEmployee, assignToProperty, removeEmployee, getPendingCount } = useEmployees(user?.id);
  const { properties } = useProperties();
  const { registrations, approveRegistration, rejectRegistration } = usePendingRegistrations();
  const { addNotification } = useInAppNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  
  // Rejection dialog for pending registrations
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter employee and tenant registrations
  const pendingEmployeeRegistrations = registrations.filter(
    r => r.requestedRole === 'employee' && r.status === 'pending'
  );
  
  const pendingTenantRegistrations = registrations.filter(
    r => r.requestedRole === 'tenant' && r.status === 'pending'
  );
  
  const totalPendingApprovals = pendingEmployeeRegistrations.length + pendingTenantRegistrations.length;

  const filteredEmployees = employees.filter(emp =>
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleActivate = async (employee: Employee) => {
    await activateEmployee(employee.id);
    toast.success(`${employee.firstName} ${employee.lastName} has been activated`);
  };

  const handleDeactivate = async (employee: Employee) => {
    await deactivateEmployee(employee.id);
    toast.success(`${employee.firstName} ${employee.lastName} has been deactivated`);
  };

  const handleAssignProperty = async () => {
    if (!selectedEmployee || !selectedPropertyId) return;
    
    const property = properties.find(p => p.id === selectedPropertyId);
    if (property) {
      await assignToProperty(selectedEmployee.id, property.id, property.name);
      toast.success(`${selectedEmployee.firstName} assigned to ${property.name}`);
      setShowAssignDialog(false);
      setSelectedEmployee(null);
      setSelectedPropertyId('');
    }
  };

  const handleRemove = async (employee: Employee) => {
    await removeEmployee(employee.id);
    toast.success(`${employee.firstName} ${employee.lastName} has been removed`);
  };

  const handleApproveRegistration = async (registration: PendingRegistration) => {
    await approveRegistration(registration.id, user?.email || 'Landlord');
    
    const roleLabel = registration.requestedRole === 'employee' ? 'employee' : 'tenant';
    
    addNotification({
      userId: registration.email,
      title: 'Registration Approved!',
      message: `Your ${roleLabel} account has been approved by the landlord. You can now log in.`,
      category: 'registration_approved',
      priority: 'high',
      link: '/auth',
    });

    toast.success(`${registration.firstName} ${registration.lastName}'s ${roleLabel} account approved`);
  };

  const handleRejectRegistration = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const roleLabel = selectedRegistration.requestedRole === 'employee' ? 'employee' : 'tenant';
    
    await rejectRegistration(selectedRegistration.id, user?.email || 'Landlord', rejectionReason);
    
    addNotification({
      userId: selectedRegistration.email,
      title: 'Registration Rejected',
      message: `Your ${roleLabel} registration was not approved. Reason: ${rejectionReason}`,
      category: 'registration_rejected',
      priority: 'high',
    });

    toast.success(`Registration rejected`);
    setShowRejectDialog(false);
    setSelectedRegistration(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Tenants</p>
                <p className="text-2xl font-bold">{pendingTenantRegistrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Employees</p>
                <p className="text-2xl font-bold">{pendingEmployeeRegistrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Employees
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2 relative">
            <UserPlus className="h-4 w-4" />
            Employee Approvals
            {pendingEmployeeRegistrations.length > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {pendingEmployeeRegistrations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tenant-approvals" className="flex items-center gap-2 relative">
            <User className="h-4 w-4" />
            Tenant Approvals
            {pendingTenantRegistrations.length > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {pendingTenantRegistrations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Directory</CardTitle>
                  <CardDescription>Manage your property employees and assignments</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No employees found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try a different search term' : 'Employees will appear here once approved'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Assigned Property</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.phone && (
                            <span className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.assignedPropertyName ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {employee.assignedPropertyName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDetailDialog(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedEmployee(employee);
                                setShowAssignDialog(true);
                              }}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Assign Property
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {employee.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleDeactivate(employee)}>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleActivate(employee)}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemove(employee)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Pending Employee Registrations
              </CardTitle>
              <CardDescription>
                Review and approve employee registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEmployeeRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending employee registrations to review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEmployeeRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-warning/10">
                          <Wrench className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {registration.firstName} {registration.lastName}
                          </p>
                          <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.email}
                            </span>
                            {registration.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Applied {formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRegistration(registration)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Approvals Tab */}
        <TabsContent value="tenant-approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Pending Tenant Applications
              </CardTitle>
              <CardDescription>
                Review and approve tenant registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTenantRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending tenant applications to review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTenantRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-info/10">
                          <Home className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {registration.firstName} {registration.lastName}
                          </p>
                          <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.email}
                            </span>
                            {registration.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Applied {formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRegistration(registration)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Property Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Property</DialogTitle>
            <DialogDescription>
              Select a property to assign {selectedEmployee?.firstName} {selectedEmployee?.lastName} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignProperty} disabled={!selectedPropertyId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  {getStatusBadge(selectedEmployee.status)}
                </div>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedEmployee.email}
                </div>
                {selectedEmployee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedEmployee.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedEmployee.assignedPropertyName || 'No property assigned'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Joined {formatDistanceToNow(new Date(selectedEmployee.hiredAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Registration Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedRegistration?.firstName}'s registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setSelectedRegistration(null);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectRegistration}>
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
