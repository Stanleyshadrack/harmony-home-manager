import { useRef, useState } from 'react';
import type { Conversation } from '@/types/message';
import { chatApi } from '@/api/service/chatApi';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmActionDialog } from './ConfirmActionDialog';

interface Props {
  conversation: Conversation;
  onChanged: (conversation: Conversation) => void;
}
export function GroupPhotoControl({ conversation, onChanged }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const image = useProtectedMedia(conversation.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const upload = async (file: File) => {
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type) ||
         file.size < 1 || file.size > 3 * 1024 * 1024) {
      toast.error('Choose a JPG, PNG, GIF or WEBP image up to 3 MB.');
      return;
    }
    setBusy(true);
    try {
      const changed = await chatApi.uploadGroupAvatar(conversation.id, file);
      onChanged(changed);
      toast.success('Group photo updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update group photo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
        <Avatar className="h-20 w-20">
          <AvatarImage src={image || undefined} alt={conversation.title} />
          <AvatarFallback><UsersRound className="h-9 w-9" /></AvatarFallback>
        </Avatar>
        {conversation.currentUserAdmin ? (
          <div className="flex flex-wrap justify-center gap-2">
            <input ref={input} type="file" className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void upload(file);
              }} />
            <Button type="button" size="sm" variant="outline" disabled={busy}
              onClick={() => input.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              {conversation.avatarUrl ? 'Change photo' : 'Add group photo'}
            </Button>
            {conversation.avatarUrl && (
              <Button type="button" size="sm" variant="outline" disabled={busy}
                onClick={() => setConfirmRemove(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
        ) : <p className="text-xs text-muted-foreground">Only group admins can change this picture.</p>}
      </div>
      <ConfirmActionDialog open={confirmRemove} onOpenChange={setConfirmRemove}
        title="Remove group photo?"
        description="The group picture will be removed for every participant."
        confirmLabel="Remove photo"
        onConfirm={async () => {
          const changed = await chatApi.removeGroupAvatar(conversation.id);
          onChanged(changed);
          toast.success('Group photo removed');
        }}
      />
    </>
  );
}
