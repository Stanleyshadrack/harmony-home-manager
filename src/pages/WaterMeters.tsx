import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ResponsiveTableView } from '@/components/ui/responsive-table-view';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Home,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperties, useUnits } from "@/hooks/useProperties";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { ConfirmActionDialog } from '@/components/messages/ConfirmActionDialog';
import { useMeters } from "@/hooks/useMeters";
import { WaterMeter } from "@/api/dto/WaterMeterDTO";
import { MeterForm } from '@/types/MeterForm';



export default function WaterMeters() {
  const [viewMode, setViewMode] = useViewMode('watermeters', 'list');
  const { t } = useTranslation();
  const { toast } = useToast();
 const { meters, stats, loading, createMeter, updateMeter, deleteMeter, assignMeter, unassignMeter } = useMeters();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { properties } = useProperties();
  const { units } = useUnits();
  const [selectedMeter, setSelectedMeter] = useState<WaterMeter | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<WaterMeter | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignUnitId, setAssignUnitId] = useState<string>("");
  const [formData, setFormData] = useState<MeterForm>({
    meterName: "",
    propertyId: "",
    meterType: "DIGITAL",
    manufacturer: "",
    model: "",
    serialNumber: "",
    notes: "",
    lastReading:0,
      lastReadingDate: '',
    status: "ACTIVE"
  });

  const resetForm = () => {
    setFormData({
      meterName: "",
      propertyId: "",
      meterType: "DIGITAL",
      manufacturer: "",
      model: "",
      serialNumber: "",
      notes: "",
      lastReading:0,
      lastReadingDate: ''
    });
  };



  const propertyMap = useMemo(() => {
    const map = new Map();
    properties.forEach(p => map.set(p.id, p));
    return map;
  }, [properties]);

  const unitMap = useMemo(() => {
    const map = new Map();
    units.forEach(u => map.set(u.id, u));
    return map;
  }, [units]);

  const unitHasMeter = (unitId: string | number) => {
  return meters.some(m => String(m.unitId) === String(unitId));
};

  const filteredMeters = useMemo(() => {
    return meters.filter((m) => {
      const matchesSearch =
  m.meterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  m.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  m.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  m.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

        
     const matchesProperty =
  propertyFilter === "all" || String(m.propertyId) === propertyFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = typeFilter === 'all' || m.meterType === typeFilter;
      return matchesSearch && matchesProperty && matchesStatus && matchesType;
    });
  }, [
    meters,
    searchQuery,
    propertyFilter,
    statusFilter,
    typeFilter,
    propertyMap,
    unitMap
  ]);



  const getStatusBadge = (status: WaterMeter['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'MAINTENANCE':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
    }
  };

  const getMeterTypeBadge = (type: WaterMeter['meterType']) => {
    switch (type) {
      case 'SMART':
        return <Badge variant="outline" className="border-primary/50 text-primary">Smart</Badge>;
      case 'DIGITAL':
        return <Badge variant="outline">Digital</Badge>;
      case 'ANALOG':
        return <Badge variant="outline" className="border-muted-foreground/50">Analog</Badge>;
    }
  };

  const sortedMeters = useMemo(() => {
    return [...filteredMeters].sort((a, b) =>
      a.meterName.localeCompare(b.meterName)
    );
  }, [filteredMeters]);



  const handleAddMeter = async () => {
   if (!formData.meterName || !formData.propertyId) {
      toast({
        title: "Validation Error",
       description: "Meter ID and property are required.",
        variant: "destructive",
      });
      return;
    }
    const newMeter: Partial<WaterMeter> = {
      meterName: formData.meterName,
  propertyId: formData.propertyId,
  meterType: formData.meterType,
  manufacturer: formData.manufacturer,
  model: formData.model,
  serialNumber: formData.serialNumber,
  notes: formData.notes,
  lastReading: formData.lastReading,
      lastReadingDate: formData.lastReadingDate || undefined,
      status: "ACTIVE",
    };

    const created = await createMeter(newMeter as WaterMeter);
    if (!created) return;

    setShowAddDialog(false);
    resetForm();
    toast({
      title: 'Meter Added',
      description: `Water meter ${formData.meterName} has been added successfully.`,
    });
  };

  const handleEditMeter = async () => {
    if (!selectedMeter) return;

    const updated: Partial<WaterMeter> = {
     meterName: formData.meterName,
      propertyId: formData.propertyId,
      meterType: formData.meterType,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      notes: formData.notes,
       lastReading: formData.lastReading,
       status: formData.status ?? selectedMeter.status,
    };

    const saved = await updateMeter(Number(selectedMeter.id), {
      ...selectedMeter,
      ...updated,
    });

    if (!saved) return;
    setShowEditDialog(false);
    setSelectedMeter(null);
    resetForm();
    toast({
      title: 'Meter Updated',
      description: 'Water meter has been updated successfully.',
    });
  };

  const handleAssignUnit = async () => {
  if (!selectedMeter || !assignUnitId) return;

  const assigned = await assignMeter(
    Number(selectedMeter.id),
    Number(assignUnitId)
  );
  if (!assigned) return;

  setShowAssignDialog(false);
  setAssignUnitId("");
  setSelectedMeter(null);
};

  const handleDeleteMeter = async () => {
    if (!selectedMeter) return;

    const deleted = await deleteMeter(Number(selectedMeter.id));
    if (!deleted) return;

    setShowDeleteDialog(false);
    setSelectedMeter(null);
    toast({
      title: 'Meter Deleted',
      description: 'Water meter has been removed.',
      variant: 'destructive',
    });
  };

  const openEditDialog = (meter: WaterMeter) => {
    setSelectedMeter(meter);

   setFormData({
  meterName: meter.meterName ?? "",
  propertyId: meter.propertyId ?? "",
  meterType: meter.meterType ?? "DIGITAL",
  manufacturer: meter.manufacturer ?? "",
  model: meter.model ?? "",
  serialNumber: meter.serialNumber ?? "",
  notes: meter.notes ?? "",
  lastReading: meter.lastReading ?? 0,
  lastReadingDate: meter.lastReadingDate ?? '',
  status: meter.status,
});

    setShowEditDialog(true);
  };

  const openDeleteDialog = (meter: WaterMeter) => {
    setSelectedMeter(meter);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Water Meters">
        <div className="p-6 text-muted-foreground">
          Loading water meters...
        </div>
      </DashboardLayout>
    );
  }


  return (

    <DashboardLayout
      title="Water Meters"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Water Meters' },
      ]}
    >
      <ConfirmActionDialog
        open={unassignTarget!==null}
        onOpenChange={open=>{if(!open)setUnassignTarget(null);}}
        title="Unassign water meter?"
        description={`Unassign ${unassignTarget?.meterName||'this meter'} from its unit? Reading history will be retained and the meter will be marked inactive.`}
        confirmLabel="Unassign meter"
        onConfirm={async()=>{
          if(!unassignTarget)return false;
          const result=await unassignMeter(Number(unassignTarget.id));
          return Boolean(result);
        }}
      />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Meters</p>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats?.active ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats?.inactive ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{stats?.maintenance ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by meter ID, unit, or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}

            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SMART">Smart</SelectItem>
              <SelectItem value="DIGITAL">Digital</SelectItem>
              <SelectItem value="ANALOG">Analog</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="gap-2">
            <Plus className="h-4 w-4" />
            Add Meter
          </Button>
        </div>

        {/* Meters Table */}
        <Card>
          <div className="flex justify-end mb-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
              <ResponsiveTableView mode={viewMode}>
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meter ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Reading</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
  {sortedMeters.length === 0 ? (
    <TableRow key="no-meters">
      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
        No water meters found
      </TableCell>
    </TableRow>
  ) : (
                sortedMeters.map((meter, index) => (
  <TableRow key={`meter-${meter.id ?? index}`}>
                    <TableCell className="font-medium">{meter.meterName}</TableCell>
                    <TableCell>
  <div className="flex items-center gap-2">
    <Building2 className="h-4 w-4 text-muted-foreground" />
    {meter.propertyName ?? propertyMap.get(meter.propertyId)?.name}
  </div>
</TableCell>


                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {meter.unitNumber ? (
  meter.unitNumber
) : (
  <Badge variant="outline">Unassigned</Badge>
)}
                      </div>
                    </TableCell>
                    <TableCell>{getMeterTypeBadge(meter.meterType)}</TableCell>
                    <TableCell>
                      {meter.lastReading != null ? (
                        <div>
                          <p className="font-medium">
                            {(meter.lastReading ?? 0).toLocaleString()} m³
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {meter.lastReadingDate ? format(new Date(meter.lastReadingDate), "MMM d, yyyy") : "Opening baseline"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No readings</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(meter.status)}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2">

  {!meter.unitNumber && (
    <Button
      size="sm"
  variant="secondary"
      onClick={() => {
        setSelectedMeter(meter);
        setShowAssignDialog(true);
      }}
    >
      Assign
    </Button>
  )}

  {meter.unitNumber && <Button size="sm" variant="outline" onClick={() => setUnassignTarget(meter)}>Unassign</Button>}
  <Button variant="ghost" size="icon" onClick={() => openEditDialog(meter)}>
    <Edit className="h-4 w-4" />
  </Button>

  <Button
    variant="ghost"
    size="icon"
    className="text-destructive"
    onClick={() => openDeleteDialog(meter)}
  >
    <Trash2 className="h-4 w-4" />
  </Button>

</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
              </ResponsiveTableView>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setSelectedMeter(null);
            resetForm();
          }
        }}>
          <DialogContent className="flex max-h-[min(92dvh,820px)] w-[calc(100vw-1.5rem)] max-w-[760px] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[760px]">
            <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 sm:px-6">
              <DialogTitle>{showEditDialog ? 'Edit Water Meter' : 'Add Water Meter'}</DialogTitle>
              <DialogDescription>
                {showEditDialog
                  ? 'Update meter details and status. Approved readings must be changed through Water Data.'
                  : 'Register your meter, opening reading, and property before assigning it to a unit.'}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meter identification</h3>
                <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="meterId">Meter code <span className="text-destructive">*</span></Label>
                    <Input id="meterId" className="w-full" value={formData.meterName}
                      onChange={e => setFormData({...formData, meterName: e.target.value})}
                      placeholder="WM-001" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="serialNumber">Serial number</Label>
                    <Input id="serialNumber" className="w-full" value={formData.serialNumber}
                      onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="SN-2026-001" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="propertyName">Property <span className="text-destructive">*</span></Label>
                    <Select value={String(formData.propertyId || '')}
                      onValueChange={value => setFormData({...formData, propertyId: value})}>
                      <SelectTrigger id="propertyName" className="w-full min-w-0">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(property => (
                          <SelectItem key={property.id} value={String(property.id)}>{property.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="meterType">Meter type</Label>
                    <Select value={formData.meterType}
                      onValueChange={(value: WaterMeter['meterType']) => setFormData({...formData, meterType: value})}>
                      <SelectTrigger id="meterType" className="w-full min-w-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMART">Smart</SelectItem>
                        <SelectItem value="DIGITAL">Digital</SelectItem>
                        <SelectItem value="ANALOG">Analog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" className="w-full" value={formData.manufacturer}
                      onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                      placeholder="Manufacturer name" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" className="w-full" value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                      placeholder="Meter model" />
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Readings & status</h3>
                <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="lastReading">{showEditDialog ? 'Last approved reading (m³)' : 'Opening reading (m³)'}</Label>
                    <Input id="lastReading" className="w-full" type="number" step="any" min={0}
                      disabled={showEditDialog} value={formData.lastReading}
                      onChange={e => setFormData({...formData, lastReading: Number(e.target.value)})} />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="lastReadingDate">{showEditDialog ? 'Last reading date' : 'Opening reading date'}</Label>
                    <Input id="lastReadingDate" className="w-full" type="date" disabled={showEditDialog}
                      value={formData.lastReadingDate || ''}
                      onChange={e => setFormData({...formData, lastReadingDate: e.target.value})} />
                  </div>
                  <div className="min-w-0 space-y-1.5 sm:col-span-2">
                    <Label htmlFor="meterStatus">Meter status</Label>
                    <Select value={formData.status || 'ACTIVE'}
                      onValueChange={(value: WaterMeter['status']) => setFormData({...formData, status: value})}
                      disabled={!showEditDialog}>
                      <SelectTrigger id="meterStatus" className="w-full min-w-0 sm:max-w-[340px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {showEditDialog
                        ? 'Meter readings are maintained in Water Data to protect billing history.'
                        : 'New meters are registered as Active. Assign the meter to a unit after saving.'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-1.5 border-t pt-4">
                <Label htmlFor="notes">Additional notes</Label>
                <Input id="notes" className="w-full" value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional installation or maintenance details" />
              </section>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t bg-background px-5 py-3 sm:px-6">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setSelectedMeter(null);
                resetForm();
              }}>Cancel</Button>
              <Button onClick={showEditDialog ? handleEditMeter : handleAddMeter}>
                {showEditDialog ? 'Save changes' : 'Add meter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Water Meter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete meter {selectedMeter?.id}? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMeter} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog
  open={showAssignDialog}
  onOpenChange={(open) => {
    setShowAssignDialog(open);
    if (!open) {
      setAssignUnitId("");
      setSelectedMeter(null);
    }
  }}
>
  <DialogContent className="sm:max-w-[450px]">
    <DialogHeader>
      <DialogTitle>Assign Meter to Unit</DialogTitle>
      <DialogDescription>
        Select a unit to assign this water meter.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <Label>Select Unit</Label>

      <Select value={assignUnitId} onValueChange={setAssignUnitId}>
        <SelectTrigger>
          <SelectValue placeholder="Choose unit" />
        </SelectTrigger>

        <SelectContent>
          {units
  .filter((unit) => String(unit.propertyId) === String(selectedMeter?.propertyId))
  .map((unit) => (
            <SelectItem
  key={unit.id}
  value={String(unit.id)}
  disabled={unitHasMeter(unit.id)}
>
  {unit.unitNumber} — {propertyMap.get(unit.propertyId)?.name}
  {unitHasMeter(unit.id) && " (Meter assigned)"}
</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => {
          setShowAssignDialog(false);
          setAssignUnitId("");
        }}
      >
        Cancel
      </Button>

      <Button  onClick={handleAssignUnit}
      disabled={!assignUnitId}
      >
        Assign Meter
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </DashboardLayout>
  );
}
