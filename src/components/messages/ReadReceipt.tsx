import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReadReceiptProps {
  readBy: string[];
  isOwn: boolean;
  totalParticipants: number;
  className?: string;
}

export function ReadReceipt({ readBy, isOwn, totalParticipants, className }: ReadReceiptProps) {
  if (!isOwn) return null;

  const isSent = true;
  const isRead = readBy.length > 0;
  const allRead = readBy.length >= totalParticipants - 1;

  const getReadText = () => {
    if (readBy.length === 0) return 'Sent';
    if (readBy.length === 1) return `Read by ${readBy[0]}`;
    if (allRead) return 'Read by all';
    return `Read by ${readBy.length} of ${totalParticipants - 1}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center', className)}>
            {allRead || isRead ? (
              <CheckCheck className={cn('h-3.5 w-3.5', isRead ? 'text-primary' : 'text-muted-foreground')} />
            ) : (
              <Check className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          {getReadText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
