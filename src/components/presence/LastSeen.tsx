import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  online?: boolean;
  lastSeenAt?: string | null;
  className?: string;
  showDot?: boolean;
}

export function LastSeen({ online, lastSeenAt, className, showDot = false }: Props) {
  let label = 'Last seen unavailable';
  if (online) label = 'Online';
  else if (lastSeenAt) {
    const date = new Date(lastSeenAt);
    if (!Number.isNaN(date.getTime())) {
      label = `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
  }

  return (
    <span className={cn(
      'inline-flex max-w-full items-center gap-1.5 truncate text-xs',
      online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
      className
    )} title={label}>
      {showDot && (
        <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full',
          online ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/40')} />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
