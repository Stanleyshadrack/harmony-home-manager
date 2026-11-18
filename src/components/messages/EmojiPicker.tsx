import { useMemo, useState } from 'react';
import { Smile, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type EmojiEntry = { emoji: string; name: string };
const CATEGORIES: Record<string, EmojiEntry[]> = {
  Smileys: [
    { emoji: '😀', name: 'grinning' }, { emoji: '😄', name: 'smile' },
    { emoji: '😁', name: 'happy' }, { emoji: '😂', name: 'laugh tears' },
    { emoji: '🤣', name: 'rolling laugh' }, { emoji: '😊', name: 'blush' },
    { emoji: '🥰', name: 'love face' }, { emoji: '😍', name: 'heart eyes' },
    { emoji: '😘', name: 'kiss' }, { emoji: '😎', name: 'cool' },
    { emoji: '🤩', name: 'star struck' }, { emoji: '🤔', name: 'thinking' },
    { emoji: '😅', name: 'sweat smile' }, { emoji: '😇', name: 'angel' },
    { emoji: '🥹', name: 'happy tears' }, { emoji: '😢', name: 'cry' },
    { emoji: '😭', name: 'sobbing' }, { emoji: '😴', name: 'sleepy' },
    { emoji: '😡', name: 'angry' }, { emoji: '😮', name: 'surprised' },
    { emoji: '🙃', name: 'upside down' }, { emoji: '😉', name: 'wink' },
    { emoji: '😌', name: 'relieved' }, { emoji: '🤗', name: 'hug' },
  ],
  Gestures: [
    { emoji: '👍', name: 'thumbs up' }, { emoji: '👎', name: 'thumbs down' },
    { emoji: '👏', name: 'clap' }, { emoji: '🙌', name: 'celebrate hands' },
    { emoji: '🙏', name: 'prayer thanks' }, { emoji: '👌', name: 'okay hand' },
    { emoji: '✌️', name: 'peace' }, { emoji: '👋', name: 'wave hello' },
    { emoji: '💪', name: 'strong' }, { emoji: '🤝', name: 'handshake' },
    { emoji: '🤞', name: 'fingers crossed' }, { emoji: '🫶', name: 'heart hands' },
    { emoji: '👀', name: 'eyes' }, { emoji: '☝️', name: 'one finger' },
    { emoji: '🫡', name: 'salute' }, { emoji: '🤦', name: 'facepalm' },
  ],
  Hearts: [
    { emoji: '❤️', name: 'red heart' }, { emoji: '🩷', name: 'pink heart' },
    { emoji: '💛', name: 'yellow heart' }, { emoji: '💚', name: 'green heart' },
    { emoji: '💙', name: 'blue heart' }, { emoji: '💜', name: 'purple heart' },
    { emoji: '🧡', name: 'orange heart' }, { emoji: '🤍', name: 'white heart' },
    { emoji: '🖤', name: 'black heart' }, { emoji: '💔', name: 'broken heart' },
    { emoji: '💖', name: 'sparkling heart' }, { emoji: '💕', name: 'two hearts' },
  ],
  Celebration: [
    { emoji: '🎉', name: 'party popper' }, { emoji: '🥳', name: 'party face' },
    { emoji: '🎊', name: 'confetti' }, { emoji: '🎂', name: 'cake birthday' },
    { emoji: '🎁', name: 'gift' }, { emoji: '🎈', name: 'balloon' },
    { emoji: '✨', name: 'sparkles' }, { emoji: '⭐', name: 'star' },
    { emoji: '🌟', name: 'glowing star' }, { emoji: '🏆', name: 'trophy' },
    { emoji: '✅', name: 'check completed' }, { emoji: '💯', name: 'hundred' },
    { emoji: '🔥', name: 'fire' }, { emoji: '🚀', name: 'rocket' },
  ],
  Everyday: [
    { emoji: '🏠', name: 'house home' }, { emoji: '🏢', name: 'office building' },
    { emoji: '🏘️', name: 'houses property' }, { emoji: '🔑', name: 'key' },
    { emoji: '🔒', name: 'lock' }, { emoji: '📌', name: 'pin' },
    { emoji: '📅', name: 'calendar' }, { emoji: '📞', name: 'phone' },
    { emoji: '📧', name: 'email' }, { emoji: '💬', name: 'message' },
    { emoji: '📎', name: 'attachment' }, { emoji: '📝', name: 'memo' },
    { emoji: '💡', name: 'idea' }, { emoji: '⚠️', name: 'warning' },
    { emoji: '💰', name: 'money' }, { emoji: '🧹', name: 'cleaning' },
    { emoji: '🔧', name: 'repair wrench' }, { emoji: '💧', name: 'water drop' },
  ],
};

type Props = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  label?: string;
};

export function EmojiPicker({ onSelect, disabled = false, label = 'Insert emoji' }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('Smileys');
  const [search, setSearch] = useState('');
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? Object.values(CATEGORIES).flat().filter(item => item.name.includes(term) || item.emoji.includes(term))
      : CATEGORIES[category] ?? [];
  }, [category, search]);

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          aria-label={label}
          title={label}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="z-[100] w-[min(320px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] space-y-2 p-3"
        aria-label="Emoji picker"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            aria-label="Search emojis"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search emojis…"
            className="h-9 pl-8"
          />
        </div>
        {!search && (
          <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label="Emoji categories">
            {Object.keys(CATEGORIES).map(name => (
              <Button
                type="button"
                key={name}
                size="sm"
                variant={category === name ? 'secondary' : 'ghost'}
                onClick={() => setCategory(name)}
                className="h-8 shrink-0 px-2 text-xs"
                aria-pressed={category === name}
              >
                {name}
              </Button>
            ))}
          </div>
        )}
        <div className="grid max-h-44 grid-cols-7 gap-1 overflow-y-auto overscroll-contain">
          {matches.map(item => (
            <button
              key={item.name}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md text-2xl hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={item.name}
              title={item.name}
              onClick={() => {
                onSelect(item.emoji);
                setOpen(false);
                setSearch('');
              }}
            >
              {item.emoji}
            </button>
          ))}
        </div>
        {matches.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">No matching emojis.</p>}
      </PopoverContent>
    </Popover>
  );
}
