import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, UserCheck, Wrench, CheckCircle } from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceStatsProps {
  requests: MaintenanceRequest[];
}

export function MaintenanceStats({ requests }: MaintenanceStatsProps) {
  const { t } = useTranslation();

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const assignedCount = requests.filter((r) => r.status === 'assigned').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress' || r.status === 'reopened').length;
  const resolvedCount = requests.filter((r) => r.status === 'confirmed').length;

  const stats = [
    {
      label: t('maintenance.pending'),
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Assigned',
      value: assignedCount.toString(),
      icon: UserCheck,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: t('maintenance.inProgress'),
      value: inProgressCount.toString(),
      icon: Wrench,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Tenant Confirmed',
      value: resolvedCount.toString(),
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="min-w-0">
          <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:p-5">
            <div className={`shrink-0 p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground break-words">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
