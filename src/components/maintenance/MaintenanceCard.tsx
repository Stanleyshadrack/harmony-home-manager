import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  UserPlus,
  Play,
  CheckCircle,
  XCircle,
  Wrench,
  Zap,
  Thermometer,
  Bug,
  Hammer,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onView?: (request: MaintenanceRequest) => void;
  onAssign?: (request: MaintenanceRequest) => void;
  onUpdateStatus?: (request: MaintenanceRequest, status: MaintenanceRequest['status']) => void;
}

const priorityColors: Record<MaintenanceRequest['priority'], string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColors: Record<MaintenanceRequest['status'], string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  assigned: 'bg-info/10 text-info border-info/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const categoryIcons: Record<MaintenanceRequest['category'], React.ReactNode> = {
  plumbing: <Wrench className="h-4 w-4" />,
  electrical: <Zap className="h-4 w-4" />,
  hvac: <Thermometer className="h-4 w-4" />,
  appliance: <Hammer className="h-4 w-4" />,
  structural: <Hammer className="h-4 w-4" />,
  pest: <Bug className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

export function MaintenanceCard({ request, onView, onAssign, onUpdateStatus }: MaintenanceCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {categoryIcons[request.category]}
            </div>
            <div>
              <p className="font-semibold">{request.ticketNumber}</p>
              <p className="text-sm text-muted-foreground capitalize">{request.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={priorityColors[request.priority]}>
              {t(`maintenance.${request.priority}`)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(request)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {request.status === 'pending' && (
                  <DropdownMenuItem onClick={() => onAssign?.(request)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {request.status === 'assigned' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(request, 'in_progress')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Work
                  </DropdownMenuItem>
                )}
                {request.status === 'in_progress' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(request, 'resolved')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </DropdownMenuItem>
                )}
                {request.status !== 'resolved' && request.status !== 'cancelled' && (
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus?.(request, 'cancelled')}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="font-medium mb-1">{request.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{request.propertyName}</span>
          <span>•</span>
          <span>Unit {request.unitNumber}</span>
          <span>•</span>
          <span>{request.tenantName}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <Badge variant="outline" className={statusColors[request.status]}>
            {t(`maintenance.${request.status === 'in_progress' ? 'inProgress' : request.status}`)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(request.createdAt)}
          </span>
        </div>

        {request.assignedToName && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('maintenance.assignedTo')}:</span>
              <span className="font-medium">{request.assignedToName}</span>
            </div>
            {request.scheduledDate && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Scheduled:</span>
                <span>{formatDate(request.scheduledDate)}</span>
              </div>
            )}
            {request.estimatedCost && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">{t('maintenance.estimatedCost')}:</span>
                <span>${request.estimatedCost}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
