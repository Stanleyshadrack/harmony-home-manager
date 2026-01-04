import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { sendBulkAnnouncementEmail, BulkAnnouncementEmailData } from '@/services/adminEmailService';
import {
  Send,
  Users,
  Building2,
  Wrench,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface RecipientGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

interface BulkEmailFormProps {
  recipientGroups: RecipientGroup[];
  onSuccess?: () => void;
}

export function BulkEmailForm({ recipientGroups, onSuccess }: BulkEmailFormProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const totalRecipients = recipientGroups
    .filter(g => selectedGroups.includes(g.id))
    .reduce((sum, g) => sum + g.count, 0);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === recipientGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(recipientGroups.map(g => g.id));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both subject and message.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedGroups.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one recipient group.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResult(null);

    try {
      // Simulate collecting recipient emails from selected groups
      const recipients = selectedGroups.map(groupId => {
        const group = recipientGroups.find(g => g.id === groupId);
        return {
          groupId,
          groupName: group?.label || groupId,
          count: group?.count || 0,
        };
      });

      const emailData: BulkAnnouncementEmailData = {
        subject,
        message,
        recipientGroups: recipients.map(r => r.groupName),
        senderName: 'System Administrator',
        senderEmail: 'admin@propertymanagement.com',
        timestamp: new Date().toISOString(),
      };

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setSendProgress(i);
      }

      const result = await sendBulkAnnouncementEmail(emailData, totalRecipients);
      
      setSendResult({ sent: result.sentCount, failed: result.failedCount });
      
      toast({
        title: 'Announcement Sent',
        description: `Successfully sent to ${result.sentCount} recipients.`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedGroups([]);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Send Failed',
        description: 'Failed to send announcement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Recipients
          </CardTitle>
          <CardDescription>
            Choose which user groups should receive this announcement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedGroups.length === recipientGroups.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Badge variant="secondary">
              {totalRecipients} total recipients
            </Badge>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recipientGroups.map(group => (
              <div
                key={group.id}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedGroups.includes(group.id)
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/50 border-transparent hover:border-muted-foreground/20'
                }`}
                onClick={() => handleGroupToggle(group.id)}
              >
                <Checkbox
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={() => handleGroupToggle(group.id)}
                />
                <div className="flex items-center gap-2 flex-1">
                  {group.icon}
                  <div>
                    <p className="font-medium">{group.label}</p>
                    <p className="text-xs text-muted-foreground">{group.count} users</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your announcement message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              disabled={isSending}
            />
          </div>

          {/* Send Progress */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Sending to {totalRecipients} recipients...
                </span>
              </div>
              <Progress value={sendProgress} />
            </div>
          )}

          {/* Send Result */}
          {sendResult && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium">Announcement Sent</p>
                <p className="text-sm text-muted-foreground">
                  {sendResult.sent} sent successfully
                  {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim() || selectedGroups.length === 0}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Announcement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
