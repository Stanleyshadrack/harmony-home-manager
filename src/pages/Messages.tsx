import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Plus, Search, Users, ArrowLeft } from 'lucide-react';
import { useConversations, useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { MessageInput } from '@/components/messages/MessageInput';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { Conversation, Message } from '@/types/message';
import { useToast } from '@/hooks/use-toast';

export default function Messages() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { conversations, isLoading: loadingConversations, createConversation, markAsRead } = useConversations();

  const [search, setSearch] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const { messages, isLoading: loadingMessages, sendMessage, forwardMessage, typingUsers } = useMessages(
    selectedConversation?.id || ''
  );

  const filteredConversations = conversations.filter((conv) => {
    const participantNames = conv.participants.map((p) => p.name.toLowerCase()).join(' ');
    return (
      participantNames.includes(search.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileList(false);
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    try {
      await sendMessage({
        conversationId: selectedConversation.id,
        content,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleForwardMessage = async (message: Message) => {
    toast({
      title: 'Forward message',
      description: 'Select a conversation to forward this message to.',
    });
  };

  const handleNewConversation = async (
    participantIds: string[],
    subject: string,
    message: string
  ) => {
    try {
      await createConversation({
        participantIds,
        subject,
        initialMessage: message,
      });
      toast({
        title: 'Conversation started',
        description: 'Your message has been sent.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const otherParticipant = selectedConversation?.participants.find(
    (p) => p.userId !== 'current-user'
  );

  return (
    <DashboardLayout
      title={t('messages.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('messages.title') },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 ${!showMobileList && 'hidden lg:block'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{t('messages.conversations')}</CardTitle>
                {totalUnread > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{totalUnread}</Badge>
                )}
              </div>
              <Button size="icon" variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('messages.searchConversations')}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedConversation?.id}
                onSelect={handleSelectConversation}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('messages.noConversations')}</p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setShowNewDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t('messages.startConversation')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className={`lg:col-span-2 flex flex-col ${showMobileList && 'hidden lg:flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowMobileList(true)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{otherParticipant?.name}</CardTitle>
                    {selectedConversation.subject && (
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.subject}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      otherParticipant?.role === 'tenant'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : otherParticipant?.role === 'employee'
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                    }
                  >
                    {otherParticipant?.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <MessageThread
                  messages={messages}
                  isLoading={loadingMessages}
                  onForward={handleForwardMessage}
                  typingUsers={typingUsers}
                  totalParticipants={selectedConversation.participants.length}
                />
                <MessageInput onSend={handleSendMessage} />
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('messages.selectConversation')}</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                {t('messages.selectConversationDescription')}
              </p>
              <Button variant="outline" className="gap-2" onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4" />
                {t('messages.startConversation')}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSubmit={handleNewConversation}
      />
    </DashboardLayout>
  );
}
