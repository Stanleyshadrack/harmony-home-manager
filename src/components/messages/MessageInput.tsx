import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = message.trim();
    if (disabled || sending || !text) return;
    setSending(true);
    try {
      await onSend(text);
      setMessage('');
    } catch {
      // The parent displays the backend error. Preserve the draft for retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={event => void submit(event)} className="shrink-0 border-t p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <EmojiPicker onSelect={insertEmoji} disabled={disabled || sending} label="Add emoji to message" />
        <Textarea
          aria-label="Type a message"
          ref={textareaRef}
          value={message}
          onChange={event => setMessage(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={4000}
          placeholder={placeholder || 'Type a message…'}
          disabled={disabled || sending}
          className="min-h-11 max-h-32 flex-1 resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={disabled || sending || !message.trim()}
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
