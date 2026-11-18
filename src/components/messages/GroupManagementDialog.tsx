import { useEffect, useState } from 'react';
import { chatApi } from '@/api/service/chatApi';
import type { ChatContact, Conversation } from '@/types/message';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Shield, UserMinus, DoorOpen, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  onChanged: (conversation: Conversation) => void;
  onLeft: () => void;
}

export function GroupManagementDialog({ open, onOpenChange, conversation, onChanged, onLeft }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adminsOnlySend, setAdminsOnlySend] = useState(false);
  const [adminsOnlyEditInfo, setAdminsOnlyEditInfo] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !conversation) return;
    setTitle(conversation.title);
    setDescription(conversation.description || '');
    setAdminsOnlySend(conversation.adminsOnlySend);
    setAdminsOnlyEditInfo(conversation.adminsOnlyEditInfo);
    setSearch('');
  }, [open, conversation?.id]);

  useEffect(() => {
    if (!open || !conversation?.currentUserAdmin) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await chatApi.contacts(search);
        if (active) setContacts(result);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Could not load contacts');
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, conversation?.id, conversation?.currentUserAdmin, search]);

  if (!conversation || conversation.type !== 'GROUP') return null;
  const group = conversation;
  const isAdmin = group.currentUserAdmin;
  const canEditInfo = isAdmin || !group.adminsOnlyEditInfo;
  const members = group.members;
  const eligibleContacts = contacts.filter(contact =>
    !members.some(member => member.userId === contact.id) &&
    (contact.role === 'SUPER_ADMIN' || contact.companyId === group.companyId)
  );

  const execute = async (action: () => Promise<Conversation>, success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const changed = await action();
      onChanged(changed);
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Group operation failed');
    } finally {
      setBusy(false);
    }
  };

  const save = () => void execute(
    () => chatApi.updateGroup(group.id, {
      ...(canEditInfo ? { title: title.trim(), description: description.trim() } : {}),
      ...(isAdmin ? { adminsOnlySend, adminsOnlyEditInfo } : {}),
    }),
    'Group settings updated'
  );

  const leave = async () => {
    if (!window.confirm('Leave this group? You will lose access to its messages.')) return;
    setBusy(true);
    try {
      await chatApi.leave(group.id);
      toast.success('You left the group');
      onOpenChange(false);
      onLeft();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not leave group');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Group details</DialogTitle>
          <DialogDescription>
            {members.length} members · {isAdmin ? 'You are a group admin' : 'Group participant'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="chat-info-title">Group name</Label>
            <Input id="chat-info-title" value={title} maxLength={120}
              disabled={!canEditInfo || busy} onChange={event => setTitle(event.target.value)} />
            <Label htmlFor="chat-info-description">Description</Label>
            <Textarea id="chat-info-description" value={description} maxLength={500}
              disabled={!canEditInfo || busy} rows={2}
              onChange={event => setDescription(event.target.value)} />
            {!canEditInfo && <p className="text-xs text-muted-foreground">Only group admins can edit group details.</p>}
          </div>

          {isAdmin && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Admin privileges</p>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox checked={adminsOnlySend}
                  disabled={busy} onCheckedChange={checked => setAdminsOnlySend(checked === true)} />
                <span><strong>Only admins can send messages</strong>
                  <span className="block text-xs text-muted-foreground">Members can read messages but cannot post.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox checked={adminsOnlyEditInfo}
                  disabled={busy} onCheckedChange={checked => setAdminsOnlyEditInfo(checked === true)} />
                <span><strong>Only admins can edit group details</strong>
                  <span className="block text-xs text-muted-foreground">Choose who may change the group name and description.</span>
                </span>
              </label>
            </div>
          )}

          {(isAdmin || canEditInfo) && (
            <Button type="button" onClick={save} disabled={busy || !title.trim()} className="w-full">
              {busy ? 'Saving…' : 'Save group settings'}
            </Button>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Participants ({members.length})</h3>
            {members.map(member => {
              const self = member.userId === Number(user?.id);
              return (
                <div key={member.userId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name}{self ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.role.replaceAll('_', ' ').toLowerCase()}</p>
                  </div>
                  {member.admin && <Badge variant="secondary">Group admin</Badge>}
                  {isAdmin && !self && (
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" disabled={busy}
                        onClick={() => void execute(
                          () => chatApi.setAdmin(group.id, member.userId, !member.admin),
                          member.admin ? 'Group admin removed' : 'Group admin added'
                        )}>
                        {member.admin ? 'Demote' : 'Make admin'}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy}
                        className="text-destructive" aria-label={`Remove ${member.name}`}
                        onClick={() => {
                          if (window.confirm(`Remove ${member.name} from this group?`)) {
                            void execute(() => chatApi.removeMember(group.id, member.userId),
                              'Member removed');
                          }
                        }}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4" /> Add participants</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search company members…" />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {eligibleContacts.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No eligible users found.</p>
                )}
                {eligibleContacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between gap-2 border-b p-2 last:border-0">
                    <span className="min-w-0 truncate text-sm">{contact.name}</span>
                    <Button size="sm" variant="outline" disabled={busy}
                      onClick={() => void execute(() => chatApi.addMember(group.id, contact.id),
                        'Participant added')}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="button" variant="outline" className="w-full text-destructive"
            disabled={busy} onClick={() => void leave()}>
            <DoorOpen className="mr-2 h-4 w-4" /> Leave group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
