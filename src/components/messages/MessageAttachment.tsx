import type { MessageAttachment as Attachment } from '@/types/message';
import { chatApi } from '@/api/service/chatApi';
import { downloadProtectedFile } from '@/api/service/mediaApi';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  conversationId: number;
  attachment: Attachment;
}

export function MessageAttachment({ conversationId, attachment }: Props) {
  const path = chatApi.attachmentUrl(conversationId, attachment.id);
  const image = attachment.contentType.startsWith('image/');
  const picture = useProtectedMedia(image ? path : null);
  const size = attachment.size >= 1024 * 1024
    ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(attachment.size / 1024))} KB`;

  const download = async () => {
    try {
      await downloadProtectedFile(path, attachment.filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download attachment');
    }
  };

  return (
    <div className="mt-2 max-w-[min(20rem,75vw)] overflow-hidden rounded-lg border border-border/40 bg-background/80 text-foreground">
      {image && (
        <button type="button" aria-label={`Download ${attachment.filename}`}
          onClick={() => void download()} className="block w-full overflow-hidden">
          {picture
            ? <img src={picture} alt={attachment.filename}
                className="max-h-64 w-full bg-muted object-contain" loading="lazy" />
            : <div className="flex h-28 items-center justify-center bg-muted/60">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>}
        </button>
      )}
      <div className="flex min-w-0 items-center gap-2 p-2">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={attachment.filename}>
            {attachment.filename}
          </p>
          <p className="text-[11px] text-muted-foreground">{size}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0"
          aria-label={`Download ${attachment.filename}`} title="Download file"
          onClick={() => void download()}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
