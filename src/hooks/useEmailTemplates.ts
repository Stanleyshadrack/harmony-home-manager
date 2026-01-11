import { useState, useCallback, useEffect } from 'react';
import { EmailTemplate, EmailTemplateCategory, EmailTemplateFormData } from '@/types/emailTemplate';

const TEMPLATES_KEY = 'email_templates';

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'tpl_invitation',
    name: 'User Invitation',
    category: 'invitation',
    subject: "🎉 You're Invited to Join {{appName}} as a {{role}}",
    body: `Dear User,

You have been invited to join {{appName}} as a {{role}}!

INVITATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invited By: {{inviterName}} ({{inviterEmail}})
Role: {{role}}
Expires: {{expirationDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To complete your registration, please click the link below:

{{onboardingUrl}}

If you did not expect this invitation, you can safely ignore this email.

Best regards,
{{appName}} Team`,
    variables: ['appName', 'role', 'inviterName', 'inviterEmail', 'expirationDate', 'onboardingUrl'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent when a user is invited to join the platform'
  },
  {
    id: 'tpl_otp',
    name: 'Login OTP',
    category: 'authentication',
    subject: '🔐 Your Verification Code - {{otp}}',
    body: `Dear {{userName}},

Your one-time verification code is:

{{otp}}

This code will expire in {{expiryMinutes}} minutes.

If you did not request this code, please ignore this email or contact support.

Best regards,
{{appName}} Team`,
    variables: ['userName', 'otp', 'expiryMinutes', 'appName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent for two-factor authentication during login'
  },
  {
    id: 'tpl_password_reset',
    name: 'Password Reset',
    category: 'authentication',
    subject: '🔐 Your Password Has Been Reset',
    body: `Dear {{userName}},

Your password has been reset by an administrator.

IMPORTANT SECURITY INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reset By: {{adminName}}
Time: {{timestamp}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your new temporary password is:

{{temporaryPassword}}

⚠️ IMPORTANT: Please change this password immediately after logging in.

Best regards,
{{appName}} Team`,
    variables: ['userName', 'adminName', 'timestamp', 'temporaryPassword', 'appName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent when an admin resets a user password'
  },
  {
    id: 'tpl_payment_receipt',
    name: 'Payment Receipt',
    category: 'billing',
    subject: 'Payment Receipt - {{invoiceNumber}}',
    body: `Dear {{tenantName}},

Thank you for your payment! This email confirms that we have received your payment.

PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: {{invoiceNumber}}
Description: {{description}}
Amount Paid: KES {{amount}}
Payment Method: {{paymentMethod}}
Transaction Reference: {{transactionRef}}
Payment Date: {{paymentDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{balanceMessage}}

Property: {{propertyName}}
Unit: {{unitNumber}}

Best regards,
{{landlordName}}`,
    variables: ['tenantName', 'invoiceNumber', 'description', 'amount', 'paymentMethod', 'transactionRef', 'paymentDate', 'balanceMessage', 'propertyName', 'unitNumber', 'landlordName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent after a tenant makes a payment'
  },
  {
    id: 'tpl_rent_reminder',
    name: 'Rent Reminder',
    category: 'billing',
    subject: '⏰ Rent Payment Reminder - Due {{dueDate}}',
    body: `Dear {{tenantName}},

This is a friendly reminder that your rent payment is due.

PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Amount Due: KES {{amount}}
Due Date: {{dueDate}}
Property: {{propertyName}}
Unit: {{unitNumber}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please ensure payment is made on or before the due date to avoid late fees.

Best regards,
{{landlordName}}`,
    variables: ['tenantName', 'amount', 'dueDate', 'propertyName', 'unitNumber', 'landlordName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent to remind tenants about upcoming rent payments'
  },
  {
    id: 'tpl_maintenance_update',
    name: 'Maintenance Update',
    category: 'maintenance',
    subject: '🔧 Maintenance Request Update - {{ticketNumber}}',
    body: `Dear {{tenantName}},

There is an update on your maintenance request.

REQUEST DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket: {{ticketNumber}}
Issue: {{issueTitle}}
Status: {{status}}
Updated: {{updateDate}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{statusMessage}}

If you have any questions, please contact us.

Best regards,
{{propertyName}} Management`,
    variables: ['tenantName', 'ticketNumber', 'issueTitle', 'status', 'updateDate', 'statusMessage', 'propertyName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent when a maintenance request status changes'
  },
  {
    id: 'tpl_system_lock',
    name: 'System Lock Notice',
    category: 'system',
    subject: '🔒 System Locked - Action Required',
    body: `Dear {{userName}},

IMPORTANT: System Access Notification

The property management system has been LOCKED by an administrator.

DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Locked By: {{adminName}} ({{adminEmail}})
Time: {{timestamp}}
Reason: {{reason}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

During the lock period, you will not be able to access the system.

If you believe this is an error, please contact your administrator.

Best regards,
{{appName}} Team`,
    variables: ['userName', 'adminName', 'adminEmail', 'timestamp', 'reason', 'appName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent when the system is locked by an administrator'
  },
  {
    id: 'tpl_subscription_reminder',
    name: 'Subscription Reminder',
    category: 'subscription',
    subject: '⏰ Subscription Renewal Reminder - {{daysLeft}} days left',
    body: `Dear {{landlordName}},

Your subscription is expiring soon.

SUBSCRIPTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {{planName}}
Expires: {{expirationDate}}
Days Remaining: {{daysLeft}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Renew now to continue enjoying uninterrupted access to all features.

Best regards,
{{appName}} Team`,
    variables: ['landlordName', 'planName', 'expirationDate', 'daysLeft', 'appName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent to remind landlords about expiring subscriptions'
  },
  {
    id: 'tpl_water_reading',
    name: 'Water Reading Status',
    category: 'billing',
    subject: 'Water Reading {{status}} - {{unitNumber}}',
    body: `Dear {{recipientName}},

{{statusMessage}}

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: {{unitNumber}}
Property: {{propertyName}}
Consumption: {{consumption}} units
Total Amount: KES {{totalAmount}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{additionalInfo}}

Best regards,
{{appName}} Team`,
    variables: ['recipientName', 'statusMessage', 'unitNumber', 'propertyName', 'consumption', 'totalAmount', 'additionalInfo', 'appName'],
    isActive: true,
    lastModified: new Date().toISOString(),
    description: 'Sent for water reading submissions and approvals'
  }
];

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (stored) {
      setTemplates(JSON.parse(stored));
    } else {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(defaultTemplates));
      setTemplates(defaultTemplates);
    }
    setIsLoading(false);
  }, []);

  const saveTemplates = useCallback((newTemplates: EmailTemplate[]) => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  }, []);

  const createTemplate = useCallback((data: EmailTemplateFormData) => {
    const newTemplate: EmailTemplate = {
      id: `tpl_${Date.now()}`,
      ...data,
      variables: extractVariables(data.body + data.subject),
      isActive: true,
      lastModified: new Date().toISOString(),
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((id: string, data: Partial<EmailTemplateFormData>) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        const newBody = data.body ?? t.body;
        const newSubject = data.subject ?? t.subject;
        return {
          ...t,
          ...data,
          variables: extractVariables(newBody + newSubject),
          lastModified: new Date().toISOString(),
        };
      }
      return t;
    });
    saveTemplates(updated);
  }, [templates, saveTemplates]);

  const toggleActive = useCallback((id: string) => {
    const updated = templates.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive, lastModified: new Date().toISOString() } : t
    );
    saveTemplates(updated);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  }, [templates, saveTemplates]);

  const duplicateTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      const duplicate: EmailTemplate = {
        ...template,
        id: `tpl_${Date.now()}`,
        name: `${template.name} (Copy)`,
        lastModified: new Date().toISOString(),
      };
      saveTemplates([...templates, duplicate]);
      return duplicate;
    }
    return null;
  }, [templates, saveTemplates]);

  const resetToDefaults = useCallback(() => {
    saveTemplates(defaultTemplates);
  }, [saveTemplates]);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    toggleActive,
    deleteTemplate,
    duplicateTemplate,
    resetToDefaults,
  };
};

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
  return [...new Set(vars)];
}
