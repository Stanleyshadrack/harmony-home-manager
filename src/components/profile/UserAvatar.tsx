import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  online?: boolean;
}

/** Same secured profile photo in chats, contacts, and group membership lists. */
export function UserAvatar({ name, avatarUrl, className, online = false }: Props) {
  const photo = useProtectedMedia(avatarUrl);
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '').join('') || '?';
  return (
    <Avatar className={cn('relative h-10 w-10 shrink-0 overflow-visible', className)}>
      <AvatarImage src={photo || undefined} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
      {online && (
        <span role="img" aria-label={name + ' is online'}
          className="absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 animate-pulse shadow-sm"
          title="Online" />
      )}
    </Avatar>
  );
}
