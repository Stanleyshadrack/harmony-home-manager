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
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;

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
      label: t('maintenance.resolved'),
      value: resolvedCount.toString(),
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
