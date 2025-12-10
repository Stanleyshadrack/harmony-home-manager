import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (participantIds: string[], subject: string, message: string) => void;
}

// Mock contacts data
const mockContacts = [
  { id: 'user-1', name: 'John Doe', role: 'tenant', unit: 'A101' },
  { id: 'user-2', name: 'Mary Wanjiku', role: 'tenant', unit: 'B202' },
  { id: 'user-3', name: 'Peter Ochieng', role: 'tenant', unit: 'C301' },
  { id: 'emp-1', name: 'James Mwangi', role: 'employee', department: 'Maintenance' },
  { id: 'emp-2', name: 'Sarah Kamau', role: 'employee', department: 'Admin' },
  { id: 'landlord-1', name: 'David Kimani', role: 'landlord' },
];

const roleColors = {
  tenant: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  employee: 'bg-green-500/10 text-green-600 border-green-500/20',
  landlord: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewConversationDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const filteredContacts = mockContacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0 && message.trim()) {
      onSubmit(selectedIds, subject, message);
      setSelectedIds([]);
      setSubject('');
      setMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('messages.newConversation')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('messages.selectRecipients')}</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('messages.searchContacts')}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-48 border rounded-md">
            <div className="p-2 space-y-1">
              {filteredContacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md transition-colors',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {contact.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {'unit' in contact ? contact.unit : contact.department || contact.role}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', roleColors[contact.role as keyof typeof roleColors])}
                    >
                      {contact.role}
                    </Badge>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedIds.map((id) => {
                const contact = mockContacts.find((c) => c.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {contact?.name}
                    <button
                      onClick={() => toggleContact(id)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          <div>
            <Label>{t('messages.subject')}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('messages.subjectPlaceholder')}
              className="mt-2"
            />
          </div>

          <div>
            <Label>{t('messages.message')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messages.messagePlaceholder')}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0 || !message.trim()}
            >
              {t('messages.send')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
