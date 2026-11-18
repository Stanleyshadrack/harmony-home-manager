import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = message.trim();
    if (disabled || sending || !text) return;
    setSending(true);
    try {
      await onSend(text);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={event => void submit(event)} className="shrink-0 border-t p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Type a message"
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
