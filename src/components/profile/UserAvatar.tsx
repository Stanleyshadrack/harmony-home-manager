import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

/** Same secured profile photo in chats, contacts, and group membership lists. */
export function UserAvatar({ name, avatarUrl, className }: Props) {
  const photo = useProtectedMedia(avatarUrl);
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '').join('') || '?';
  return (
    <Avatar className={cn('h-10 w-10 shrink-0', className)}>
      <AvatarImage src={photo || undefined} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
    </Avatar>
  );
}
