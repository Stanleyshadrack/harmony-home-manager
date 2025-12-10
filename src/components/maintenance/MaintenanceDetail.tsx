import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Wrench, Building2 } from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceDetailProps {
  request: MaintenanceRequest;
  onAddNote: (content: string) => void;
  onClose: () => void;
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

const roleIcons = {
  landlord: Building2,
  employee: Wrench,
  tenant: User,
};

export function MaintenanceDetail({ request, onAddNote, onClose }: MaintenanceDetailProps) {
  const { t } = useTranslation();
  const [noteContent, setNoteContent] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendNote = () => {
    if (noteContent.trim()) {
      onAddNote(noteContent.trim());
      setNoteContent('');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="space-y-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{request.ticketNumber}</h3>
            <p className="text-sm text-muted-foreground capitalize">{request.category}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={priorityColors[request.priority]}>
              {t(`maintenance.${request.priority}`)}
            </Badge>
            <Badge variant="outline" className={statusColors[request.status]}>
              {t(`maintenance.${request.status === 'in_progress' ? 'inProgress' : request.status}`)}
            </Badge>
          </div>
        </div>

        <div>
          <h4 className="font-medium">{request.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Property:</span>
            <p className="font-medium">{request.propertyName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Unit:</span>
            <p className="font-medium">{request.unitNumber}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tenant:</span>
            <p className="font-medium">{request.tenantName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <p className="font-medium">{formatDate(request.createdAt)}</p>
          </div>
        </div>

        {request.assignedToName && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('maintenance.assignedTo')}:</span>
                <p className="font-medium">{request.assignedToName}</p>
              </div>
              {request.scheduledDate && (
                <div>
                  <span className="text-muted-foreground">Scheduled:</span>
                  <p className="font-medium">{request.scheduledDate}</p>
                </div>
              )}
              {request.estimatedCost && (
                <div>
                  <span className="text-muted-foreground">{t('maintenance.estimatedCost')}:</span>
                  <p className="font-medium">${request.estimatedCost}</p>
                </div>
              )}
              {request.actualCost && (
                <div>
                  <span className="text-muted-foreground">{t('maintenance.actualCost')}:</span>
                  <p className="font-medium">${request.actualCost}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Notes Section */}
      <div className="flex-1 flex flex-col min-h-0 pt-4">
        <h4 className="font-medium mb-3">Activity & Notes</h4>
        
        <ScrollArea className="flex-1 pr-4">
          {request.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add a note below.
            </p>
          ) : (
            <div className="space-y-4">
              {request.notes.map((note) => {
                const RoleIcon = roleIcons[note.userRole];
                return (
                  <div key={note.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <RoleIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{note.userName}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({note.userRole})
                        </span>
                      </div>
                      <p className="text-sm mt-1">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Add Note */}
        <div className="flex gap-2 pt-4 mt-4 border-t">
          <Textarea
            placeholder="Add a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[60px]"
          />
          <Button
            size="icon"
            onClick={handleSendNote}
            disabled={!noteContent.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
