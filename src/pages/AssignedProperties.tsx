import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, DoorOpen, Users, Wrench, Droplets, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/api/https';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaintenance } from '@/hooks/useMaintenance';

interface MyEmployee {
  id: number;
  propertyIds?: number[] | null;
  propertyNames?: string[] | null;
}
interface EmployeeUnit {
  id: string | number;
  propertyId: string | number;
  unitNumber: string;
  status: string;
  meterId?: string | null;
  meterName?: string | null;
}
interface EmployeeTenant {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  unitId?: number | null;
  unitNumber?: string | null;
  propertyName?: string | null;
  status?: string | null;
}

export default function AssignedProperties() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState('units');
  const { requests, loadError: maintenanceError } = useMaintenance();

  const profile = useQuery({
    queryKey: ['employee-profile', user?.id],
    enabled: !!user?.id && user.role === 'employee',
    queryFn: () => apiRequest<null, MyEmployee>({ path: '/api/employees/me', method: 'GET' }),
  });
  const unitsQuery = useQuery({
    queryKey: ['employee-assigned-units', user?.id],
    enabled: !!user?.id && user.role === 'employee',
    queryFn: () => apiRequest<null, EmployeeUnit[]>({ path: '/api/tenants/employee/units', method: 'GET' }),
  });
  const tenantsQuery = useQuery({
    queryKey: ['employee-assigned-tenants', user?.id],
    enabled: !!user?.id && user.role === 'employee',
    queryFn: () => apiRequest<null, EmployeeTenant[]>({ path: '/api/tenants', method: 'GET' }),
  });

  const properties = useMemo(() => {
    const ids = profile.data?.propertyIds ?? [];
    const names = profile.data?.propertyNames ?? [];
    return ids.map((id, index) => ({ id: String(id), name: names[index] || `Property #${id}` }));
  }, [profile.data]);

  const propertyById = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);
  const assignedUnits = (unitsQuery.data ?? []).filter(u => propertyById.has(String(u.propertyId)));
  const unitById = new Map(assignedUnits.map(unit => [String(unit.id), unit]));
  const assignedTenants = (tenantsQuery.data ?? []).filter(tenant =>
    tenant.unitId != null && unitById.has(String(tenant.unitId))
  );
  const propertyRequests = requests.filter(request => propertyById.has(String(request.propertyId)));
  const activeRequest = (status: string) => !['confirmed', 'cancelled'].includes(status.toLowerCase());

  const selected = properties.find(p => p.id === selectedId) ?? null;
  const visible = properties.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const propertyUnits = selected ? assignedUnits.filter(u => String(u.propertyId) === selected.id) : [];
  const propertyUnitIds = new Set(propertyUnits.map(u => String(u.id)));
  const propertyTenants = selected ? assignedTenants.filter(t => t.unitId != null && propertyUnitIds.has(String(t.unitId))) : [];
  const selectedRequests = selected ? propertyRequests.filter(r => String(r.propertyId) === selected.id) : [];

  const loading = profile.isLoading || unitsQuery.isLoading || tenantsQuery.isLoading;
  const errors = [profile.error, unitsQuery.error, tenantsQuery.error].filter(Boolean);
  return (
    <DashboardLayout breadcrumbs={[{ label: 'Assigned Properties' }]} title="Assigned Properties">
      <div className="min-w-0 max-w-full space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Your assigned buildings, units, tenants and maintenance work. Read-only property access.</p>
          </div>
          <Badge variant="outline">{loading ? 'Loading...' : `${properties.length} assigned`}</Badge>
        </div>

        {errors.length > 0 && <div role="alert" className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
          Some assigned information could not be loaded: {errors.map(e => e instanceof Error ? e.message : 'Request failed').join('; ')}
        </div>}
        {maintenanceError && <p role="alert" className="text-sm text-destructive">Maintenance: {maintenanceError}</p>}

        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Properties', value: properties.length, icon: Building2 },
            { label: 'Units', value: assignedUnits.length, icon: DoorOpen },
            { label: 'Tenants', value: assignedTenants.length, icon: Users },
            { label: 'Open Maintenance', value: propertyRequests.filter(r => activeRequest(r.status)).length, icon: Wrench },
          ].map(item => (
            <Card className="min-w-0" key={item.label}><CardContent className="flex min-w-0 items-center gap-3 p-3 sm:p-4">
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0"><p className="text-xs text-muted-foreground break-words">{item.label}</p>
                <p className="text-xl font-bold">{loading ? '—' : item.value}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Search assigned properties..." aria-label="Search assigned properties" />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading assigned properties and units...</p>}
        {!loading && visible.length === 0 && <p className="rounded-lg border p-5 text-sm text-muted-foreground">
          {properties.length ? 'No assigned properties match your search.' : 'No properties have been assigned to your employee account.'}
        </p>}

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(property => {
            const units = assignedUnits.filter(u => String(u.propertyId) === property.id);
            const ids = new Set(units.map(u => String(u.id)));
            const tenants = assignedTenants.filter(t => t.unitId != null && ids.has(String(t.unitId)));
            const open = propertyRequests.filter(r => String(r.propertyId) === property.id && activeRequest(r.status));
            return <Card key={property.id} className={`min-w-0 overflow-hidden ${selected?.id === property.id ? 'border-primary' : ''}`}>
              <CardHeader className="pb-2"><CardTitle className="flex min-w-0 items-start gap-2 text-base">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 break-words">{property.name}</span>
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{units.length} units</span><span>{tenants.length} tenants</span><span>{open.length} open tasks</span>
                </div>
                <Button className="w-full" variant={selected?.id === property.id ? 'default' : 'outline'}
                  onClick={() => { setSelectedId(property.id); setTab('units'); }}>
                  {selected?.id === property.id ? 'Viewing Property' : 'View Property'}
                </Button>
              </CardContent>
            </Card>;
          })}
        </div>

        {selected && <Card className="min-w-0 overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 break-words"><MapPin className="h-5 w-5 shrink-0" />{selected.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Information associated with this assigned property</p>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
                <TabsTrigger className="min-w-0 text-xs sm:text-sm" value="units">Units ({propertyUnits.length})</TabsTrigger>
                <TabsTrigger className="min-w-0 text-xs sm:text-sm" value="tenants">Tenants ({propertyTenants.length})</TabsTrigger>
                <TabsTrigger className="min-w-0 text-xs sm:text-sm" value="tasks">Tasks ({selectedRequests.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="units" className="space-y-2">
                {propertyUnits.length === 0 && <p className="py-4 text-sm text-muted-foreground">No units available for this assignment.</p>}
                {propertyUnits.map(unit => <div key={unit.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <div className="min-w-0"><p className="font-semibold break-words">Unit {unit.unitNumber}</p>
                    <p className="text-muted-foreground">Meter: {unit.meterName || unit.meterId || 'Not assigned'}</p></div>
                  <Badge variant="outline">{unit.status}</Badge>
                </div>)}
              </TabsContent>
              <TabsContent value="tenants" className="space-y-2">
                {propertyTenants.length === 0 && <p className="py-4 text-sm text-muted-foreground">No current tenant records for these units.</p>}
                {propertyTenants.map(tenant => <div key={tenant.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <div className="min-w-0"><p className="font-semibold break-words">{tenant.fullName || [tenant.firstName, tenant.lastName].filter(Boolean).join(' ') || 'Tenant'}</p>
                    <p className="text-muted-foreground">Unit {tenant.unitNumber || unitById.get(String(tenant.unitId))?.unitNumber || '—'}</p></div>
                  <Badge variant="outline">{tenant.status || 'Tenant'}</Badge>
                </div>)}
              </TabsContent>
              <TabsContent value="tasks" className="space-y-2">
                {selectedRequests.length === 0 && <p className="py-4 text-sm text-muted-foreground">No maintenance requests for this property.</p>}
                {selectedRequests.map(task => <div key={task.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <div className="min-w-0"><p className="font-semibold break-words">{task.title}</p>
                    <p className="text-muted-foreground break-words">{task.ticketNumber} · Unit {task.unitNumber}</p></div>
                  <Badge variant="outline" className="max-w-full whitespace-normal break-words">{task.status.replaceAll('_', ' ')}</Badge>
                </div>)}
                <Button variant="outline" asChild><Link to="/maintenance">View Assigned Maintenance</Link></Button>
              </TabsContent>
            </Tabs>
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Button variant="outline" asChild><Link to="/employee-portal?tab=water"><Droplets className="mr-2 h-4 w-4" />Water Readings</Link></Button>
              <Button variant="outline" asChild><Link to="/maintenance"><Wrench className="mr-2 h-4 w-4" />Maintenance</Link></Button>
            </div>
          </CardContent>
        </Card>}
      </div>
    </DashboardLayout>
  );
}
