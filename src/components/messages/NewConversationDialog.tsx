import { useEffect, useState } from 'react';
import { chatApi } from '@/api/service/chatApi';
import type { ChatContact, Conversation, ChatType, NewConversationData } from '@/types/message';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UsersRound, UserRound, Search, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewConversationData) => Promise<Conversation>;
}

export function NewConversationDialog({ open, onOpenChange, onSubmit }: Props) {
  const [type, setType] = useState<ChatType>('DIRECT');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selected, setSelected] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType('DIRECT');
    setSelected([]);
    setSearch('');
    setTitle('');
    setDescription('');
    setInitialMessage('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingContacts(true);
    const timer = window.setTimeout(async () => {
      try {
        const list = await chatApi.contacts(search);
        if (active) setContacts(list);
      } catch (error) {
        if (active) {
          setContacts([]);
          toast.error(error instanceof Error ? error.message : 'Could not load contacts');
        }
      } finally {
        if (active) setLoadingContacts(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, search]);

  const changeType = (next: ChatType) => {
    setType(next);
    setSelected([]);
    setSearch('');
  };

  const selectedCompany = selected.find(contact =>
    contact.role !== 'SUPER_ADMIN' && contact.companyId != null
  )?.companyId;

  const visibleContacts = contacts.filter(contact => {
    if (selected.some(item => item.id === contact.id)) return false;
    if (type !== 'GROUP' || selectedCompany == null) return true;
    return contact.role === 'SUPER_ADMIN' || contact.companyId === selectedCompany;
  });

  const choose = (contact: ChatContact) => {
    setSelected(previous => type === 'DIRECT' ? [contact] : [...previous, contact]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected.length) return;
    if (type === 'GROUP' && (!title.trim() || selectedCompany == null)) {
      toast.error('Name the group and select people from one company');
      return;
    }
    setWorking(true);
    try {
      await onSubmit({
        type,
        participantIds: selected.map(contact => contact.id),
        ...(type === 'GROUP' ? { title: title.trim(), description: description.trim() } : {}),
        initialMessage: initialMessage.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create conversation');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!working) onOpenChange(value); }}>
      <DialogContent className="flex h-[min(760px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] min-h-0 w-[calc(100vw-2rem)] max-w-lg flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 pr-5">
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Message another person or create a company group. Group creator becomes an admin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={event => void submit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={type === 'DIRECT' ? 'default' : 'outline'}
              onClick={() => changeType('DIRECT')} className="min-h-11 gap-2">
              <UserRound className="h-4 w-4" /> One-to-one
            </Button>
            <Button type="button" variant={type === 'GROUP' ? 'default' : 'outline'}
              onClick={() => changeType('GROUP')} className="min-h-11 gap-2">
              <UsersRound className="h-4 w-4" /> Group
            </Button>
          </div>

          {type === 'GROUP' && (
            <div className="grid gap-2">
              <Label htmlFor="chat-group-name">Group name *</Label>
              <Input id="chat-group-name" maxLength={120} value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Building A Management" />
              <Textarea maxLength={500} value={description} rows={2}
                onChange={event => setDescription(event.target.value)}
                placeholder="Group description (optional)" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="chat-contact-search">
              {type === 'DIRECT' ? 'Choose a person' : 'Add group members'} *
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="chat-contact-search" className="pl-9" value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search by name or email…" />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(contact => (
                <Badge key={contact.id} variant="secondary" className="max-w-full gap-1.5 py-1.5">
                  <span className="max-w-48 truncate">{contact.name}</span>
                  <button type="button" aria-label={`Remove ${contact.name}`}
                    onClick={() => setSelected(previous => previous.filter(x => x.id !== contact.id))}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="min-h-24 max-h-40 overflow-y-auto rounded-md border">
            {loadingContacts && <p className="p-3 text-sm text-muted-foreground">Searching contacts…</p>}
            {!loadingContacts && visibleContacts.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No eligible contacts found.</p>
            )}
            {!loadingContacts && visibleContacts.map(contact => (
              <button type="button" key={contact.id}
                onClick={() => choose(contact)}
                className="flex min-h-12 w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60">
                <UserAvatar name={contact.name} avatarUrl={contact.avatarUrl}
                  online={contact.online} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{contact.role.replaceAll('_', ' ').toLowerCase()} · {contact.online ? 'Online' : 'Offline'} · {contact.email}</p>
                </div>
                <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          {type === 'GROUP' && (
            <p className="text-xs text-muted-foreground">
              Members must belong to one company. Group admins can manage membership and permissions.
            </p>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="chat-first-message">First message (optional)</Label>
              <EmojiPicker label="Add emoji to first message" onSelect={emoji =>
                setInitialMessage(previous => (previous + emoji).slice(0, 4000))} />
            </div>
            <Textarea id="chat-first-message" maxLength={4000} rows={2}
              value={initialMessage} onChange={event => setInitialMessage(event.target.value)}
              placeholder="Say hello…" />
          </div>

          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t bg-background pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="submit" disabled={working || !selected.length || (type === 'GROUP' && (!title.trim() || selectedCompany == null))}>
              {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'GROUP' ? 'Create group' : 'Start chat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
