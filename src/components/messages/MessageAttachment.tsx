import { useEffect, useState } from 'react';
import type { Message } from '@/types/message';
import { chatApi } from '@/api/service/chatApi';
import { downloadProtectedFile, fetchProtectedFile } from '@/api/service/mediaApi';
import { decryptChatFile } from '@/services/chatE2EE';
import { useAuth } from '@/contexts/AuthContext';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

interface Props { conversationId: number; message: Message; }

export function MessageAttachment({ conversationId, message }: Props) {
  const { user } = useAuth();
  const attachment = message.attachment!;
  const path = chatApi.attachmentUrl(conversationId, attachment.id);
  const encrypted = !!attachment.encrypted;
  const type = encrypted
    ? message.decryptedAttachment?.contentType || 'application/octet-stream'
    : attachment.contentType;
  const filename = encrypted
    ? message.decryptedAttachment?.filename || 'Encrypted attachment'
    : attachment.filename;
  const image = type.startsWith('image/');
  const ordinaryPicture = useProtectedMedia(!encrypted && image ? path : null);
  const [securePicture, setSecurePicture] = useState<string | null>(null);

  useEffect(() => {
    setSecurePicture(null);
    if (!encrypted || !image || !message.decryptedAttachment || !user?.id) return;
    let active = true;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const bytes = await fetchProtectedFile(path);
        const decrypted = await decryptChatFile(conversationId, Number(user.id), message, bytes);
        if (!active) return;
        objectUrl = URL.createObjectURL(decrypted);
        setSecurePicture(objectUrl);
      } catch {
        if (active) setSecurePicture(null);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, encrypted, image, message.decryptedAttachment?.fileIv, user?.id, conversationId]);

  const download = async () => {
    try {
      if (!encrypted) {
        await downloadProtectedFile(path, filename);
        return;
      }
      if (!user?.id || !message.decryptedAttachment)
        throw new Error('This device cannot decrypt the attachment');
      const bytes = await fetchProtectedFile(path);
      const decrypted = await decryptChatFile(conversationId, Number(user.id), message, bytes);
      const url = URL.createObjectURL(decrypted);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download attachment');
    }
  };

  const picture = encrypted ? securePicture : ordinaryPicture;
  const size = attachment.size >= 1024 * 1024
    ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(attachment.size / 1024))} KB`;

  return (
    <div className="mt-2 max-w-[min(20rem,75vw)] overflow-hidden rounded-lg border border-border/40 bg-background/80 text-foreground">
      {image && (
        <button type="button" aria-label={`Download ${filename}`}
          onClick={() => void download()} className="block w-full overflow-hidden">
          {picture
            ? <img src={picture} alt={filename} className="max-h-64 w-full bg-muted object-contain" loading="lazy" />
            : <div className="flex h-28 items-center justify-center bg-muted/60">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>}
        </button>
      )}
      <div className="flex min-w-0 items-center gap-2 p-2">
        {encrypted
          ? <LockKeyhole className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          : <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={filename}>{filename}</p>
          <p className="text-[11px] text-muted-foreground">
            {size}{encrypted ? ' · Encrypted' : ''}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0"
          aria-label={`Download ${filename}`} title="Download file"
          disabled={encrypted && !message.decryptedAttachment}
          onClick={() => void download()}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
