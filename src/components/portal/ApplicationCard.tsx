import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Clock, X } from 'lucide-react';
import { UnitApplication } from '@/types/application';

interface ApplicationCardProps {
  application: UnitApplication;
  onWithdraw?: (id: string) => void;
}

const statusConfig: Record<UnitApplication['status'], { label: string; className: string }> = {
  pending: { label: 'Pending Review', className: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground' },
};

export function ApplicationCard({ application, onWithdraw }: ApplicationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const status = statusConfig[application.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Unit {application.unitNumber}</h3>
              <p className="text-sm text-muted-foreground">{application.propertyName}</p>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Move-in: {formatDate(application.moveInDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Applied: {formatDate(application.submittedAt)}</span>
          </div>
        </div>

        {application.reviewNotes && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-1">Review Notes:</p>
            <p className="text-muted-foreground">{application.reviewNotes}</p>
          </div>
        )}

        {application.status === 'pending' && onWithdraw && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWithdraw(application.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Withdraw Application
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
