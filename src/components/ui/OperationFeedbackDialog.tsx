import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type OperationFeedback = {
  kind: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  guidance?: string;
};

const themes = {
  success: { Icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', label: 'Success' },
  info: { Icon: Info, color: 'text-sky-600 dark:text-sky-400', label: 'Information' },
  warning: { Icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', label: 'Warning' },
  error: { Icon: AlertCircle, color: 'text-destructive', label: 'Error' },
} as const;

/** Accessible acknowledgment dialog. Only display short, actionable messages: never credentials. */
export function OperationFeedbackDialog({
  feedback,
  onClose,
}: {
  feedback: OperationFeedback | null;
  onClose: () => void;
}) {
  const theme = themes[feedback?.kind ?? 'info'];
  const Icon = theme.Icon;
  return (
    <AlertDialog open={feedback !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-xl">
        <AlertDialogHeader>
          <div className="mb-2 flex items-center gap-3 text-left">
            <span className={theme.color}><Icon className="h-7 w-7" aria-hidden="true" /></span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {theme.label}
            </span>
          </div>
          <AlertDialogTitle className="text-left">{feedback?.title || 'Notification'}</AlertDialogTitle>
          <AlertDialogDescription className="text-left whitespace-pre-line break-words">
            {feedback?.message || ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {feedback?.guidance && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
            <strong>What to do:</strong> {feedback.guidance}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>OK, understood</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
