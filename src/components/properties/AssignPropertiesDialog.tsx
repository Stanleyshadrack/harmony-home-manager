import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Search, MapPin, Home } from 'lucide-react';
import { Property } from '@/types/property';
import { Landlord } from '@/hooks/useLandlords';
interface AssignPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlord: Landlord | null;
  properties: Property[];
  assignedPropertyIds: string[];
  onSave: (landlordId: string, propertyIds: string[]) => Promise<void>;
}
export function AssignPropertiesDialog({
  open,
  onOpenChange,
  landlord,
  properties,
  assignedPropertyIds,
  onSave,
}: AssignPropertiesDialogProps) {
  const [selected, setSelected] = useState<string[]>(assignedPropertyIds);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // The backend company ID defines what this landlord may manage.
  const companyProperties = useMemo(
    () => properties.filter(p => landlord?.companyId != null &&
      p.companyId === landlord.companyId),
    [properties, landlord?.companyId]
  );

  // Read existing assignments from the server every time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelected(assignedPropertyIds);
      setSearch('');
    }
  }, [open, landlord?.id, assignedPropertyIds.join(',')]);

  const filteredProperties = useMemo(() => {
    if (!search.trim()) return companyProperties;
    const q = search.trim().toLowerCase();
    return companyProperties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  }, [companyProperties, search]);

  const toggleProperty = (id: string) => {
    setSelected(prev => prev.includes(id)
      ? prev.filter(item => item !== id)
      : [...prev, id]);
  };

  const handleSave = async () => {
    if (!landlord || saving || landlord.companyId == null) return;
    setSaving(true);
    try {
      await onSave(String(landlord.id), selected);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save property assignments');
    } finally {
      setSaving(false);
    }
  };
  if (!landlord) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(''); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Assign Properties
          </DialogTitle>
          <DialogDescription>
            Assign properties to <strong>{landlord.firstName} {landlord.lastName}</strong>.
            Only properties belonging to <strong>{landlord.company || 'this landlord\'s company'}</strong> can be assigned.
            Company subscription limits apply across all landlords in the company.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Selection count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selected.length} of {companyProperties.length} company properties selected
            </span>
            {landlord.companyId == null && (
              <Badge variant="destructive" className="text-xs">
                Landlord has no assigned company
              </Badge>
            )}
          </div>
          {/* Property List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2" />
                  <p className="text-sm">No properties found</p>
                </div>
              ) : (
                filteredProperties.map((property) => {
                  const isSelected = selected.includes(property.id);
                  const assignedToOther = (property.landlordIds ?? [])
                    .some(id => id !== landlord.id);
                  return (
                    <label
                      key={property.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border border-primary/20'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProperty(property.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{property.name}</p>
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {property.propertyType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {property.totalUnits} units
                          </span>
                        </div>
                        {assignedToOther && (
                          <p className="text-xs text-warning mt-1">
                            Currently assigned to another landlord
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected([])}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(companyProperties.map(p => p.id))}
              className="text-xs"
            >
              Select All
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || landlord.companyId == null}>
            <Building2 className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : `Save Assignment (${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}