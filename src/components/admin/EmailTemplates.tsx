import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Eye,
  Lock,
  Unlock,
  Key,
  CreditCard,
  Bell,
  UserPlus,
  Megaphone,
  Droplets,
  Receipt,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'billing' | 'user' | 'notification';
  icon: React.ReactNode;
  subject: string;
  variables: string[];
  previewBody: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'system_lock',
    name: 'System Lock Notification',
    description: 'Sent when an admin locks the system',
    category: 'system',
    icon: <Lock className="h-5 w-5" />,
    subject: '🔒 System Locked - Action Required',
    variables: ['recipientName', 'adminName', 'adminEmail', 'timestamp', 'reason'],
    previewBody: `Dear {{recipientName}},

IMPORTANT: System Access Notification

The property management system has been LOCKED by an administrator.

DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Locked By: {{adminName}} ({{adminEmail}})
Time: {{timestamp}}
Reason: {{reason}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

During the lock period, you will not be able to access the system unless you have special permissions.

If you believe this is an error, please contact your administrator.

Best regards,
Property Management System`,
  },
  {
    id: 'system_unlock',
    name: 'System Unlock Notification',
    description: 'Sent when an admin unlocks the system',
    category: 'system',
    icon: <Unlock className="h-5 w-5" />,
    subject: '🔓 System Unlocked - Access Restored',
    variables: ['recipientName', 'adminName', 'adminEmail', 'timestamp'],
    previewBody: `Dear {{recipientName}},

SYSTEM ACCESS RESTORED

The property management system has been UNLOCKED and is now accessible.

DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unlocked By: {{adminName}} ({{adminEmail}})
Time: {{timestamp}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can now access the system normally.

Best regards,
Property Management System`,
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    description: 'Sent when an admin resets a user password',
    category: 'user',
    icon: <Key className="h-5 w-5" />,
    subject: '🔐 Your Password Has Been Reset',
    variables: ['userName', 'adminName', 'timestamp', 'temporaryPassword'],
    previewBody: `Dear {{userName}},

Your password has been reset by an administrator.

IMPORTANT SECURITY INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reset By: {{adminName}}
Time: {{timestamp}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your new temporary password is:

{{temporaryPassword}}

⚠️ IMPORTANT: Please change this password immediately after logging in for security purposes.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
Property Management System`,
  },
  {
    id: 'user_invitation',
    name: 'User Invitation',
    description: 'Sent when inviting a new user to the platform',
    category: 'user',
    icon: <UserPlus className="h-5 w-5" />,
    subject: "🎉 You're Invited to Join PropManager as a {{role}}",
    variables: ['inviterName', 'inviterEmail', 'role', 'onboardingUrl', 'expiresAt'],
    previewBody: `Dear User,

You have been invited to join PropManager as a {{role}}!

INVITATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invited By: {{inviterName}} ({{inviterEmail}})
Role: {{role}}
Expires: {{expiresAt}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To complete your registration, please click the link below:

{{onboardingUrl}}

After completing the onboarding process, your account will be reviewed and approved by an administrator.

If you did not expect this invitation, you can safely ignore this email.

Best regards,
PropManager Team`,
  },
  {
    id: 'email_otp',
    name: 'Email OTP Verification',
    description: 'Sent for two-factor authentication during login',
    category: 'user',
    icon: <Mail className="h-5 w-5" />,
    subject: '🔑 Your Login Verification Code',
    variables: ['userName', 'otpCode', 'expiresIn'],
    previewBody: `Dear {{userName}},

Your verification code for login is:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{otpCode}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This code will expire in {{expiresIn}} minutes.

If you did not request this code, please ignore this email and secure your account.

Best regards,
Property Management System`,
  },
  {
    id: 'payment_receipt',
    name: 'Payment Receipt',
    description: 'Sent after a successful payment',
    category: 'billing',
    icon: <Receipt className="h-5 w-5" />,
    subject: 'Payment Receipt - {{invoiceNumber}}',
    variables: ['recipientName', 'invoiceNumber', 'description', 'amountPaid', 'paymentMethod', 'transactionRef', 'paymentDate', 'propertyName', 'unitNumber'],
    previewBody: `Dear {{recipientName}},

Thank you for your payment! This email confirms that we have received your payment.

PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: {{invoiceNumber}}
Description: {{description}}
Amount Paid: KES {{amountPaid}}
Payment Method: {{paymentMethod}}
Transaction Reference: {{transactionRef}}
Payment Date: {{paymentDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Property: {{propertyName}}
Unit: {{unitNumber}}

If you have any questions about this payment, please contact us.

Best regards,
Property Management Team`,
  },
  {
    id: 'subscription_reminder',
    name: 'Subscription Reminder',
    description: 'Sent to remind landlords about expiring subscriptions',
    category: 'billing',
    icon: <Clock className="h-5 w-5" />,
    subject: '⏰ Subscription Renewal Reminder - {{daysUntilExpiration}} days left',
    variables: ['landlordName', 'planName', 'expirationDate', 'daysUntilExpiration'],
    previewBody: `Dear {{landlordName}},

This is a reminder that your subscription is expiring soon.

SUBSCRIPTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {{planName}}
Expiration Date: {{expirationDate}}
Days Remaining: {{daysUntilExpiration}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please renew your subscription to continue using all features without interruption.

Best regards,
PropManager Team`,
  },
  {
    id: 'subscription_suspended',
    name: 'Subscription Suspended',
    description: 'Sent when a subscription expires and account is suspended',
    category: 'billing',
    icon: <AlertTriangle className="h-5 w-5" />,
    subject: '⚠️ Subscription Expired - Account Suspended',
    variables: ['landlordName', 'planName', 'suspensionDate'],
    previewBody: `Dear {{landlordName}},

Your subscription has expired and your account has been suspended.

SUSPENSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {{planName}}
Suspension Date: {{suspensionDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your data is safe, but you will not be able to access most features until you renew your subscription.

Please contact support or renew your subscription to restore access.

Best regards,
PropManager Team`,
  },
  {
    id: 'subscription_renewal',
    name: 'Subscription Renewal Confirmation',
    description: 'Sent after a successful subscription renewal',
    category: 'billing',
    icon: <CheckCircle className="h-5 w-5" />,
    subject: '✅ Subscription Renewal Confirmed',
    variables: ['landlordName', 'planName', 'amount', 'newExpirationDate', 'transactionId'],
    previewBody: `Dear {{landlordName}},

Your subscription has been successfully renewed!

RENEWAL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {{planName}}
Amount Paid: KES {{amount}}
New Expiration Date: {{newExpirationDate}}
Transaction ID: {{transactionId}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for continuing to use PropManager!

Best regards,
PropManager Team`,
  },
  {
    id: 'bulk_announcement',
    name: 'Bulk Announcement',
    description: 'Used for sending announcements to multiple users',
    category: 'notification',
    icon: <Megaphone className="h-5 w-5" />,
    subject: '{{customSubject}}',
    variables: ['recipientGroups', 'customSubject', 'customMessage', 'senderName'],
    previewBody: `Dear Users,

{{customMessage}}

Best regards,
{{senderName}}
PropManager Team`,
  },
  {
    id: 'water_reading_pending',
    name: 'Water Reading Pending',
    description: 'Sent when a water reading is submitted for approval',
    category: 'notification',
    icon: <Droplets className="h-5 w-5" />,
    subject: 'Water Reading Pending Approval - {{unitNumber}}',
    variables: ['recipientName', 'unitNumber', 'propertyName', 'consumption', 'totalAmount', 'submittedBy'],
    previewBody: `Dear {{recipientName}},

A new water reading has been submitted and requires your approval.

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: {{unitNumber}}
Property: {{propertyName}}
Consumption: {{consumption}} units
Total Amount: KES {{totalAmount}}
Submitted By: {{submittedBy}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please log in to review and approve this reading.

Best regards,
Property Management System`,
  },
  {
    id: 'water_reading_approved',
    name: 'Water Reading Approved',
    description: 'Sent when a water reading is approved',
    category: 'notification',
    icon: <CheckCircle className="h-5 w-5" />,
    subject: 'Water Reading Approved - {{unitNumber}}',
    variables: ['recipientName', 'unitNumber', 'propertyName', 'consumption', 'totalAmount', 'approvedBy'],
    previewBody: `Dear {{recipientName}},

Your water reading has been approved!

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: {{unitNumber}}
Property: {{propertyName}}
Consumption: {{consumption}} units
Total Amount: KES {{totalAmount}}
Approved By: {{approvedBy}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This reading has been added to the tenant's billing.

Best regards,
Property Management System`,
  },
  {
    id: 'water_reading_rejected',
    name: 'Water Reading Rejected',
    description: 'Sent when a water reading is rejected',
    category: 'notification',
    icon: <XCircle className="h-5 w-5" />,
    subject: 'Water Reading Rejected - {{unitNumber}}',
    variables: ['recipientName', 'unitNumber', 'propertyName', 'consumption', 'rejectionReason'],
    previewBody: `Dear {{recipientName}},

Your water reading has been rejected.

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: {{unitNumber}}
Property: {{propertyName}}
Consumption: {{consumption}} units
Reason: {{rejectionReason}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review and submit a corrected reading.

Best regards,
Property Management System`,
  },
];

const categoryLabels = {
  system: { label: 'System', color: 'bg-destructive/10 text-destructive' },
  billing: { label: 'Billing', color: 'bg-success/10 text-success' },
  user: { label: 'User', color: 'bg-primary/10 text-primary' },
  notification: { label: 'Notification', color: 'bg-warning/10 text-warning' },
};

export function EmailTemplates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const filteredTemplates = emailTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {
    all: emailTemplates.length,
    system: emailTemplates.filter((t) => t.category === 'system').length,
    billing: emailTemplates.filter((t) => t.category === 'billing').length,
    user: emailTemplates.filter((t) => t.category === 'user').length,
    notification: emailTemplates.filter((t) => t.category === 'notification').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Email Templates</h2>
          <p className="text-sm text-muted-foreground">
            View and preview all system email templates
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Mail className="h-4 w-4" />
            All ({categoryCounts.all})
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Lock className="h-4 w-4" />
            System ({categoryCounts.system})
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing ({categoryCounts.billing})
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-2">
            <UserPlus className="h-4 w-4" />
            User ({categoryCounts.user})
          </TabsTrigger>
          <TabsTrigger value="notification" className="gap-2">
            <Bell className="h-4 w-4" />
            Notification ({categoryCounts.notification})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryLabels[template.category].color}`}>
                        {template.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${categoryLabels[template.category].color}`}
                        >
                          {categoryLabels[template.category].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Subject:</span>{' '}
                    <span className="font-mono">{template.subject}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs font-mono">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found matching your search.</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.icon}
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* Subject */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{previewTemplate.subject}</p>
              </div>

              {/* Variables */}
              <div>
                <p className="text-sm font-medium mb-2">Template Variables</p>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="font-mono text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Body Preview */}
              <div>
                <p className="text-sm font-medium mb-2">Email Body</p>
                <ScrollArea className="h-[300px]">
                  <div className="p-4 bg-card border rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                      {previewTemplate.previewBody}
                    </pre>
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={categoryLabels[previewTemplate.category].color}>
                  {categoryLabels[previewTemplate.category].label}
                </Badge>
                <span>•</span>
                <span>{previewTemplate.variables.length} variables</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
