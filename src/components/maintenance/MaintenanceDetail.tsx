import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Wrench, Building2 } from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceDetailProps {
  request: MaintenanceRequest;
  onAddNote: (content: string) => Promise<void>;
  onClose: () => void;
  onTenantDecision?: (accepted: boolean, reason?: string) => Promise<void>;
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
  resolved: 'bg-warning/10 text-warning border-warning/20',
  reopened: 'bg-destructive/10 text-destructive border-destructive/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const roleIcons = {
  landlord: Building2,
  employee: Wrench,
  tenant: User,
  system: Wrench,
  super_admin: Building2,
};

export function MaintenanceDetail({ request, onAddNote, onClose, onTenantDecision }: MaintenanceDetailProps) {
  const { t } = useTranslation();
  const [noteContent, setNoteContent] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [tenantReason, setTenantReason] = useState('');
  const [decisionPending, setDecisionPending] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const submitTenantDecision = async (accepted: boolean) => {
    if (!onTenantDecision || decisionPending) return;
    if (!accepted && !tenantReason.trim()) {
      setDecisionError('Please explain why the issue is not resolved.');
      return;
    }
    setDecisionPending(true);
    setDecisionError('');
    try {
      await onTenantDecision(accepted, tenantReason.trim() || undefined);
      setTenantReason('');
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'Unable to submit your decision');
    } finally {
      setDecisionPending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendNote = async () => {
    if (!noteContent.trim() || sendingNote) return;
    setSendingNote(true);
    try {
      await onAddNote(noteContent.trim());
      setNoteContent('');
    } catch {
      // Keep the text available to retry, and let parent show the API error.
    } finally { setSendingNote(false); }
  };

  return (
    <div className="min-w-0 space-y-4 pb-4">
      {/* Header */}
      <div className="space-y-4 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{request.ticketNumber}</h3>
            <p className="text-sm text-muted-foreground capitalize">{request.category}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={priorityColors[request.priority]}>
              {t(`maintenance.${request.priority}`)}
            </Badge>
            <Badge variant="outline" className={statusColors[request.status]}>
              {request.status === 'resolved' ? 'Awaiting Tenant Confirmation'
                : request.status === 'reopened' ? 'Reopened'
                : request.status === 'confirmed' ? 'Confirmed / Closed'
                : t(`maintenance.${request.status === 'in_progress' ? 'inProgress' : request.status}`)}
            </Badge>
          </div>
        </div>

        <div>
          <h4 className="font-medium">{request.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
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
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
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

      {onTenantDecision && request.status === 'resolved' && (
        <div className="mt-4 space-y-3 rounded-lg border p-3 sm:p-4">
          <p className="font-medium">Confirm the maintenance repair</p>
          <p className="text-sm text-muted-foreground">
            The employee has marked the repair resolved. Confirm it is fixed to close the request,
            or reject it to send the issue back for further work.
          </p>
          <Textarea value={tenantReason} onChange={event => setTenantReason(event.target.value)}
            maxLength={2000} placeholder="Reason if the problem is not fixed (required for rejection)" />
          {decisionError && <p role="alert" className="text-sm text-destructive">{decisionError}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="w-full whitespace-normal" disabled={decisionPending} onClick={() => void submitTenantDecision(true)}>
              Confirm Repair & Close
            </Button>
            <Button className="w-full whitespace-normal" variant="destructive" disabled={decisionPending || !tenantReason.trim()}
              onClick={() => void submitTenantDecision(false)}>
              Not Fixed — Reopen
            </Button>
          </div>
        </div>
      )}

      <Separator />

      {/* Notes Section */}
      <div className="pt-4">
        <h4 className="font-medium mb-3">Activity & Notes</h4>
        
        <div className="space-y-2">
          {request.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add a note below.
            </p>
          ) : (
            <div className="space-y-4">
              {request.notes.map((note) => {
                const RoleIcon = roleIcons[note.userRole] || Wrench;
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
        </div>

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
            onClick={() => void handleSendNote()}
            disabled={!noteContent.trim() || sendingNote}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
