import { Tenant } from '@/types/tenant';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TenantCardProps {
  tenant: Tenant;
  onView: (tenant: Tenant) => void;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

const statusColors: Record<string,string> = {
  ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  MOVED_OUT: 'bg-muted text-muted-foreground border-muted',
};

export function TenantCard({ tenant, onView }: TenantCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tenant.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tenant.firstName[0]}
                {tenant.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {tenant.firstName} {tenant.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tenant.unitNumber || 'Unit awaiting approval'} • {tenant.propertyName || 'Property pending'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1"
            onClick={() => onView(tenant)}>
            <Eye className="h-4 w-4" /> Journey
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{tenant.phone}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className={statusColors[tenant.status]}>
            {tenant.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Move-in: {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'Not cleared'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
