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
import { UserAvatar } from '@/components/profile/UserAvatar';
import { LastSeen } from '@/components/presence/LastSeen';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { EmojiPicker } from './EmojiPicker';
import { GroupPhotoControl } from './GroupPhotoControl';

type PendingAction =
  | { kind: 'remove'; userId: number; name: string }
  | { kind: 'role'; userId: number; name: string; grant: boolean }
  | { kind: 'leave' };

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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (!open || !conversation) return;
    setTitle(conversation.title);
    setDescription(conversation.description || '');
    setAdminsOnlySend(conversation.adminsOnlySend);
    setAdminsOnlyEditInfo(conversation.adminsOnlyEditInfo);
    setSearch('');
  }, [open, conversation?.id, conversation?.updatedAt]);

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

  const execute = async (action: () => Promise<Conversation>, success: string): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    try {
      const changed = await action();
      onChanged(changed);
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Group operation failed');
      return false;
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

  const leave = async (): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    try {
      await chatApi.leave(group.id);
      toast.success('You left the group');
      onOpenChange(false);
      onLeft();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not leave group');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmPending = async (): Promise<boolean> => {
    if (!pendingAction) return false;
    if (pendingAction.kind === 'leave') return leave();
    if (pendingAction.kind === 'remove') {
      return execute(
        () => chatApi.removeMember(group.id, pendingAction.userId),
        'Member removed'
      );
    }
    return execute(
      () => chatApi.setAdmin(group.id, pendingAction.userId, pendingAction.grant),
      pendingAction.grant ? 'Group admin added' : 'Group admin removed'
    );
  };

  const confirmationTitle = pendingAction?.kind === 'leave' ? 'Leave this group?'
    : pendingAction?.kind === 'remove' ? 'Remove group member?'
    : pendingAction?.grant ? 'Make group admin?' : 'Remove admin privileges?';

  const confirmationDescription = pendingAction?.kind === 'leave'
    ? 'You will lose access to this group and its messages. If you are the last admin, promote another member first.'
    : pendingAction?.kind === 'remove'
      ? `${pendingAction.name} will no longer be able to read or send messages in this group.`
      : pendingAction?.kind === 'role'
        ? pendingAction.grant
          ? `${pendingAction.name} will be able to manage participants, permissions and group settings.`
          : `${pendingAction.name} will lose group administrator privileges.`
        : '';

  const confirmationLabel = pendingAction?.kind === 'leave' ? 'Leave group'
    : pendingAction?.kind === 'remove' ? 'Remove member'
    : pendingAction?.grant ? 'Make admin' : 'Remove admin';

  return (
    <>
    <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="flex h-[min(760px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] min-h-0 w-[calc(100vw-2rem)] max-w-lg flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 pr-5">
          <DialogTitle>Group details</DialogTitle>
          <DialogDescription>
            {members.length} members · {isAdmin ? 'You are a group admin' : 'Group participant'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-3 pr-1">
          <GroupPhotoControl conversation={group} onChanged={onChanged} />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="chat-info-title">Group name</Label>
              {canEditInfo && <EmojiPicker disabled={busy} label="Add emoji to group name"
                onSelect={emoji => setTitle(previous => (previous + emoji).slice(0, 120))} />}
            </div>
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
                  <UserAvatar name={member.name} avatarUrl={member.avatarUrl}
                    online={member.online} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name}{self ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.role.replaceAll('_', ' ').toLowerCase()}</p>
                    <LastSeen online={member.online} lastSeenAt={member.lastSeenAt} />
                  </div>
                  {member.admin && <Badge variant="secondary">Group admin</Badge>}
                  {isAdmin && !self && (
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" disabled={busy}
                        onClick={() => setPendingAction({
                          kind: 'role', userId: member.userId, name: member.name, grant: !member.admin,
                        })}>
                        {member.admin ? 'Demote' : 'Make admin'}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy}
                        className="text-destructive" aria-label={`Remove ${member.name}`}
                        onClick={() => setPendingAction({ kind: 'remove', userId: member.userId, name: member.name })}>
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
                    <UserAvatar name={contact.name} avatarUrl={contact.avatarUrl}
                      online={contact.online} className="h-8 w-8" />
                    <span className="min-w-0 flex-1 truncate text-sm">{contact.name}</span>
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
            disabled={busy} onClick={() => setPendingAction({ kind: 'leave' })}>
            <DoorOpen className="mr-2 h-4 w-4" /> Leave group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <ConfirmActionDialog
      open={pendingAction !== null}
      onOpenChange={next => { if (!next) setPendingAction(null); }}
      title={confirmationTitle}
      description={confirmationDescription}
      confirmLabel={confirmationLabel}
      destructive={pendingAction?.kind !== 'role' || !pendingAction.grant}
      onConfirm={confirmPending}
    />
    </>
  );
}
