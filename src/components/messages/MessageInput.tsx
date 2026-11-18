import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Paperclip, Send, X, FileText } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { toast } from 'sonner';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  onUploadFile: (file: File, caption: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

type QueuedFile = { id: number; file: File; preview: string | null };
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv', 'docx', 'xlsx'];

export function MessageInput({
  onSend, onUploadFile, disabled = false, placeholder,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileId = useRef(0);
  const filesRef = useRef<QueuedFile[]>([]);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => filesRef.current.forEach(f => {
    if (f.preview) URL.revokeObjectURL(f.preview);
  }), []);

  const insertEmoji = (emoji: string) => {
    if (disabled || sending) return;
    const input = textareaRef.current;
    const start = input?.selectionStart ?? message.length;
    const end = input?.selectionEnd ?? message.length;
    const text = (message.slice(0, start) + emoji + message.slice(end)).slice(0, 4000);
    const caret = Math.min(start + emoji.length, text.length);
    setMessage(text);
    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(caret, caret);
    });
  };

  const chooseFiles = (selected: FileList | File[]) => {
    const incoming = Array.from(selected);
    const available = Math.max(0, 5 - filesRef.current.length);
    if (incoming.length > available) toast.error('You can send up to 5 files at once.');
    const queued: QueuedFile[] = [];
    for (const file of incoming.slice(0, available)) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} must be 10 MB or smaller.`);
        continue;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      queued.push({ id: ++fileId.current, file, preview });
    }
    if (queued.length) {
      setFiles(previous => {
        const next = [...previous, ...queued];
        filesRef.current = next;
        return next;
      });
    }
  };

  const removeFile = (id: number) => {
    setFiles(previous => {
      const next = previous.filter(item => {
        if (item.id === id && item.preview) URL.revokeObjectURL(item.preview);
        return item.id !== id;
      });
      filesRef.current = next;
      return next;
    });
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = message.trim();
    if (disabled || sending || (!text && files.length === 0)) return;
    setSending(true);
    try {
      if (files.length) {
        let first = true;
        // Each attachment is its own persisted message; retain pending files
        // after any failure so the user can retry without reselecting them.
        for (const entry of files) {
          await onUploadFile(entry.file, first ? text : '');
          if (first) setMessage('');
          first = false;
          removeFile(entry.id);
        }
      } else {
        await onSend(text);
        setMessage('');
      }
    } catch {
      // Parent shows the API error. Keep the unsent message/files for retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={event => void submit(event)} className="shrink-0 border-t p-2 sm:p-4">
      {files.length > 0 && (
        <div className="mb-2 flex max-h-36 gap-2 overflow-x-auto overscroll-contain pb-1" aria-label="Selected attachments">
          {files.map(entry => (
            <div key={entry.id} className="relative flex w-24 shrink-0 flex-col gap-1 rounded-md border bg-muted/40 p-1.5">
              {entry.preview
                ? <img src={entry.preview} alt={entry.file.name}
                    className="h-14 w-full rounded object-cover" />
                : <div className="flex h-14 items-center justify-center">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>}
              <span className="truncate text-xs" title={entry.file.name}>{entry.file.name}</span>
              <button type="button" disabled={sending} onClick={() => removeFile(entry.id)}
                title="Remove attachment" aria-label={`Remove ${entry.file.name}`}
                className="absolute right-0 top-0 rounded-bl-md bg-background/90 p-1 hover:bg-destructive/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex min-w-0 items-end gap-1 sm:gap-2">
        <EmojiPicker onSelect={insertEmoji} disabled={disabled || sending} label="Add emoji to message" />
        <input ref={fileRef} type="file" multiple className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.docx,.xlsx"
          onChange={event => {
            if (event.target.files) chooseFiles(event.target.files);
            event.target.value = '';
          }} />
        <Button type="button" variant="ghost" size="icon"
          title="Attach images or documents" aria-label="Attach images or documents"
          className="h-10 w-10 shrink-0"
          disabled={disabled || sending}
          onClick={() => fileRef.current?.click()}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          aria-label="Type a message"
          ref={textareaRef}
          value={message}
          onChange={event => setMessage(event.target.value)}
          onPaste={event => {
            const images = Array.from(event.clipboardData.files).filter(file => file.type.startsWith('image/'));
            if (images.length) {
              event.preventDefault();
              chooseFiles(images);
            }
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={4000}
          placeholder={files.length ? 'Add a caption (optional)…' : placeholder || 'Type a message…'}
          disabled={disabled || sending}
          className="min-h-11 max-h-32 min-w-0 flex-1 resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" aria-label="Send message or attachments"
          disabled={disabled || sending || (!message.trim() && !files.length)}
          className="h-11 w-11 shrink-0">
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="mt-1 pl-1 text-[11px] text-muted-foreground">
        Images, PDF, Word, Excel, TXT or CSV · 10 MB each · Up to 5 files
      </p>
    </form>
  );
}
