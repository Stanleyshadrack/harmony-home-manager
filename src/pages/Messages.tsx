import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Search, UsersRound, ArrowLeft, Settings2, Trash2, Lock, LockOpen } from 'lucide-react';
import { useConversations, useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { MessageInput } from '@/components/messages/MessageInput';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { GroupManagementDialog } from '@/components/messages/GroupManagementDialog';
import { ForwardMessageDialog } from '@/components/messages/ForwardMessageDialog';
import { ConfirmActionDialog } from '@/components/messages/ConfirmActionDialog';
import { chatApi } from '@/api/service/chatApi';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { encryptionSupported } from '@/services/chatE2EE';
import type { Conversation, Message, NewConversationData } from '@/types/message';
import { useToast } from '@/hooks/use-toast';

export default function Messages() {
  const { toast } = useToast();
  const location = useLocation();
  const {
    conversations, isLoading: loadingConversations, error: conversationsError, encryptionError,
    createConversation, markAsRead, refreshConversations,
  } = useConversations();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Conversation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [forwardCandidate, setForwardCandidate] = useState<Message | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);

  const selectedConversation = selectedSnapshot?.id === selectedId
    ? selectedSnapshot : conversations.find(item => item.id === selectedId) ?? null;
  const {
    messages, isLoading: loadingMessages, error: messagesError,
    sendMessage, uploadAttachment, forwardMessage, deleteMessage,
  } = useMessages(selectedId, !!selectedConversation?.e2eeEnabled);

  useEffect(() => {
    if (selectedId == null) return;
    const updated = conversations.find(item => item.id === selectedId);
    if (updated) setSelectedSnapshot(updated);
    else if (!loadingConversations && !conversationsError) {
      setSelectedSnapshot(null);
      setSelectedId(null);
      setShowMobileList(true);
      setShowGroupDialog(false);
    }
  }, [conversations, selectedId, loadingConversations, conversationsError]);

  useEffect(() => {
    const value = new URLSearchParams(location.search).get('conversation');
    const id = value ? Number(value) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0 || !conversations.length) return;
    const found = conversations.find(c => c.id === id);
    if (found) {
      setSelectedId(id);
      setSelectedSnapshot(found);
      setShowMobileList(false);
      if (found.unreadCount > 0) void markAsRead(id).catch(() => {});
    }
  }, [location.search, conversations.length]);

  const deleteChatForMe = async () => {
    if (!selectedConversation) return;
    await chatApi.deleteConversation(selectedConversation.id);
    setSelectedId(null);
    setSelectedSnapshot(null);
    setShowGroupDialog(false);
    setShowMobileList(true);
    await refreshConversations();
    toast({ title: 'Conversation deleted from your inbox',
      description: 'Other participants still have their own copies.' });
  };

  const filteredConversations = conversations.filter(conv => {
    const query = search.toLowerCase().trim();
    return conv.title.toLowerCase().includes(query) ||
      conv.members.some(member => member.name.toLowerCase().includes(query)) ||
      (conv.lastMessage?.content.toLowerCase().includes(query) ?? false);
  });
  const unread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const select = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    setSelectedSnapshot(conversation);
    setShowMobileList(false);
    if (conversation.unreadCount > 0) {
      void markAsRead(conversation.id).catch(() => {
        // The next server refresh will retain any real unread count.
      });
    }
  };

  const send = async (content: string) => {
    try {
      await sendMessage(content);
      void refreshConversations();
    } catch (error) {
      toast({
        title: 'Could not send message',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadFile = async (file: File, caption: string) => {
    try {
      await uploadAttachment(file, caption);
      void refreshConversations();
    } catch (error) {
      toast({ title: 'Could not upload attachment',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive' });
      throw error;
    }
  };

  const forward = async (message: Message, destinationId: number) => {
    const destination = conversations.find(c => c.id === destinationId);
    if (!destination) throw new Error('Destination conversation no longer available');
    await forwardMessage(message, destinationId, !!destination.e2eeEnabled);
    await refreshConversations();
    toast({ title: 'Message forwarded', description: 'Sent to the selected conversation.' });
  };

  const removeMessage = async (message: Message) => {
    // Confirmation dialog owns error display and stays open on failed deletion.
    await deleteMessage(message.id);
    void refreshConversations();
  };

  const create = async (data: NewConversationData) => {
    const conversation = await createConversation(data);
    setSelectedId(conversation.id);
    setSelectedSnapshot(conversation);
    setShowMobileList(false);
    toast({ title: data.type === 'GROUP' ? 'Group created' : 'Conversation opened' });
    return conversation;
  };

  const updateGroup = (conversation: Conversation) => {
    setSelectedSnapshot(conversation);
    void refreshConversations();
  };

  const leaveGroup = () => {
    setSelectedId(null);
    setSelectedSnapshot(null);
    setShowMobileList(true);
    setShowGroupDialog(false);
    void refreshConversations();
  };

  const enableEncryption = async () => {
    if (!selectedConversation) return;
    try {
      const updated = await chatApi.enableE2EE(selectedConversation.id);
      setSelectedSnapshot(updated);
      await refreshConversations();
      toast({ title: 'Encryption enabled', description:
        'New messages are now encrypted on participants’ devices. Earlier messages remain unencrypted.' });
    } catch (error) {
      toast({ title: 'Cannot enable encryption',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive' });
    }
  };

  const canSend = (!selectedConversation?.e2eeEnabled || encryptionSupported()) &&
    (!selectedConversation ||
    selectedConversation.type === 'DIRECT' ||
    !selectedConversation.adminsOnlySend ||
    selectedConversation.currentUserAdmin);

  return (
    <DashboardLayout
      title="Messages"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Messages' }]}
    >
      {encryptionError && (
        <p role="alert" className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <Lock className="mr-2 inline-block h-4 w-4" />
          {encryptionError}
        </p>
      )}
      <div className="flex h-[calc(100dvh-11rem)] min-h-[29rem] gap-3 lg:gap-5">
        {/* Conversation navigation on desktop; replaces thread on narrow phones. */}
        <Card className={`min-h-0 w-full flex-col overflow-hidden lg:flex lg:w-[340px] lg:shrink-0 ${!showMobileList ? 'hidden' : 'flex'}`}>
          <CardHeader className="shrink-0 border-b p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Chats</CardTitle>
                {unread > 0 && <Badge>{unread > 99 ? '99+' : unread}</Badge>}
              </div>
              <Button type="button" size="icon" variant="outline"
                title="Start a new chat or group" aria-label="Start a new chat or group"
                onClick={() => setShowNewDialog(true)}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Search conversations…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            {conversationsError && (
              <p role="alert" className="border-b p-3 text-xs text-destructive">{conversationsError}</p>
            )}
            {loadingConversations ? (
              <p className="p-4 text-sm text-muted-foreground">Loading chats…</p>
            ) : filteredConversations.length ? (
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedId}
                onSelect={select}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No matching chats' : 'No conversations yet'}
                </p>
                <Button variant="outline" className="gap-2" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4" /> New chat
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active conversation. */}
        <Card className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex ${showMobileList ? 'hidden' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="shrink-0 border-b p-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon"
                    aria-label="Back to conversations" className="h-10 w-10 shrink-0 lg:hidden"
                    onClick={() => setShowMobileList(true)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  {selectedConversation.type === 'GROUP' && (
                    <UserAvatar name={selectedConversation.title}
                      avatarUrl={selectedConversation.avatarUrl} className="h-10 w-10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base sm:text-lg">
                      {selectedConversation.title}
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedConversation.type === 'GROUP'
                        ? `${selectedConversation.members.length} participants${selectedConversation.currentUserAdmin ? ' · You are an admin' : ''}`
                        : 'One-to-one conversation'}
                    </p>
                  </div>
                  <Button type="button" size="icon" variant="outline"
                    className="h-10 w-10 shrink-0"
                    title="Delete conversation for me"
                    aria-label="Delete conversation for me"
                    onClick={() => setConfirmDeleteChat(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {selectedConversation.type === 'GROUP' && (
                    <Button type="button" variant="outline" size="sm"
                      className="min-h-10 shrink-0 gap-2"
                      aria-label="Group information and settings"
                      onClick={() => setShowGroupDialog(true)}>
                      <Settings2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Group info</span>
                    </Button>
                  )}
                </div>
              </CardHeader>

              {selectedConversation.e2eeEnabled ? (
                <p className="flex shrink-0 items-center gap-2 border-b bg-emerald-500/5 p-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>End-to-end encrypted on this browser (beta). The server cannot read new message text or attachments.
                    Older history and group details may be unencrypted. No multi-device key recovery yet.</span>
                </p>
              ) : (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-amber-500/5 p-2 text-xs">
                  <span className="flex items-center gap-2"><LockOpen className="h-4 w-4" />
                    Legacy chat: messages are not end-to-end encrypted.</span>
                  {(selectedConversation.type === 'DIRECT' || selectedConversation.currentUserAdmin) && (
                    <Button type="button" size="sm" variant="outline"
                      disabled={!encryptionSupported()}
                      onClick={() => void enableEncryption()}>
                      Enable encryption
                    </Button>
                  )}
                </div>
              )}
              {messagesError && (
                <p role="alert" className="border-b p-2 text-sm text-destructive">
                  {messagesError}
                </p>
              )}
              <MessageThread
                messages={messages}
                isLoading={loadingMessages}
                onDelete={removeMessage}
                onForward={setForwardCandidate}
                canDeleteOthers={selectedConversation.type === 'GROUP' && selectedConversation.currentUserAdmin}
                totalParticipants={selectedConversation.members.length}
              />
              {!canSend && (
                <p className="border-t bg-muted p-3 text-center text-sm text-muted-foreground">
                  Only group admins can send messages in this group.
                </p>
              )}
              <MessageInput onSend={send} onUploadFile={uploadFile} disabled={!canSend}
                placeholder={canSend ? 'Type a message…' : selectedConversation.e2eeEnabled &&
                  !encryptionSupported() ? 'HTTPS required for encrypted messages' : 'Only admins can send'} />
            </>
          ) : (
            <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
              <UsersRound className="h-10 w-10 text-muted-foreground" />
              <h2 className="font-semibold">Choose a conversation</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Send private messages or create a group with members of your company.
              </p>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Start a conversation
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      <ConfirmActionDialog
        open={confirmDeleteChat}
        onOpenChange={setConfirmDeleteChat}
        title="Delete this conversation?"
        description="The chat and its previous messages will disappear from your inbox. Other participants will retain their messages. New messages can make this conversation appear again."
        confirmLabel="Delete for me"
        onConfirm={deleteChatForMe}
      />
      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSubmit={create}
      />
      <ForwardMessageDialog
        open={forwardCandidate !== null}
        onOpenChange={open => { if (!open) setForwardCandidate(null); }}
        message={forwardCandidate}
        conversations={conversations}
        onForward={forward}
      />
      <GroupManagementDialog
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        conversation={selectedConversation}
        onChanged={updateGroup}
        onLeft={leaveGroup}
      />
    </DashboardLayout>
  );
}
