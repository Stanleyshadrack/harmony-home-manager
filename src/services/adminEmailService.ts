// Admin Email Notifications Service
// Handles email notifications for system lock/unlock and password reset actions

import { EmailLog } from './emailService';

const EMAIL_LOGS_KEY = 'email_logs';

function getEmailLogs(): EmailLog[] {
  const logs = localStorage.getItem(EMAIL_LOGS_KEY);
  return logs ? JSON.parse(logs) : [];
}

function saveEmailLog(log: EmailLog): void {
  const logs = getEmailLogs();
  logs.unshift(log);
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
}

// System Lock/Unlock Email
interface SystemLockEmailData {
  action: 'lock' | 'unlock';
  adminEmail: string;
  adminName: string;
  reason?: string;
  timestamp: string;
  affectedUsers: Array<{ name: string; email: string }>;
}

export async function sendSystemLockEmail(data: SystemLockEmailData): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const subject = data.action === 'lock' 
    ? '🔒 System Locked - Action Required'
    : '🔓 System Unlocked - Access Restored';

  // Send to all affected users
  for (const user of data.affectedUsers) {
    const emailLog: EmailLog = {
      id: `${messageId}_${user.email}`,
      type: data.action === 'lock' ? 'system_lock' : 'system_unlock',
      recipient: user,
      subject,
      status: 'sent',
      sentAt: new Date().toISOString(),
      metadata: {
        action: data.action,
        performedBy: data.adminEmail,
        reason: data.reason,
      },
    };
    
    saveEmailLog(emailLog);
    
    console.log('📧 System Lock Email Sent:', {
      to: user.email,
      subject,
      body: generateSystemLockEmailBody(data, user.name),
    });
  }
  
  return { success: true, messageId };
}

function generateSystemLockEmailBody(data: SystemLockEmailData, recipientName: string): string {
  if (data.action === 'lock') {
    return `
Dear ${recipientName},

IMPORTANT: System Access Notification

The property management system has been LOCKED by an administrator.

DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Locked By: ${data.adminName} (${data.adminEmail})
Time: ${new Date(data.timestamp).toLocaleString()}
Reason: ${data.reason || 'No reason provided'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

During the lock period, you will not be able to access the system unless you have special permissions.

If you believe this is an error, please contact your administrator.

Best regards,
Property Management System
    `.trim();
  }

  return `
Dear ${recipientName},

SYSTEM ACCESS RESTORED

The property management system has been UNLOCKED and is now accessible.

DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unlocked By: ${data.adminName} (${data.adminEmail})
Time: ${new Date(data.timestamp).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can now access the system normally.

Best regards,
Property Management System
  `.trim();
}

// Password Reset Email
interface PasswordResetEmailData {
  userEmail: string;
  userName: string;
  adminEmail: string;
  adminName: string;
  temporaryPassword: string;
  timestamp: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'password_reset',
    recipient: { name: data.userName, email: data.userEmail },
    subject: '🔐 Your Password Has Been Reset',
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      resetBy: data.adminEmail,
      timestamp: data.timestamp,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Password Reset Email Sent:', {
    to: data.userEmail,
    subject: emailLog.subject,
    body: generatePasswordResetEmailBody(data),
  });
  
  return { success: true, messageId };
}

function generatePasswordResetEmailBody(data: PasswordResetEmailData): string {
  return `
Dear ${data.userName},

Your password has been reset by an administrator.

IMPORTANT SECURITY INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reset By: ${data.adminName}
Time: ${new Date(data.timestamp).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your new temporary password is:

${data.temporaryPassword}

⚠️ IMPORTANT: Please change this password immediately after logging in for security purposes.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
Property Management System
  `.trim();
}

// Subscription Reminder Email
interface SubscriptionReminderEmailData {
  landlordName: string;
  landlordEmail: string;
  planName: string;
  expirationDate: string;
  daysUntilExpiration: number;
}

export async function sendSubscriptionReminderEmail(data: SubscriptionReminderEmailData): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'subscription_reminder',
    recipient: { name: data.landlordName, email: data.landlordEmail },
    subject: `⏰ Subscription Renewal Reminder - ${data.daysUntilExpiration} days left`,
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      planName: data.planName,
      expirationDate: data.expirationDate,
      daysUntilExpiration: data.daysUntilExpiration,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Subscription Reminder Email Sent:', {
    to: data.landlordEmail,
    subject: emailLog.subject,
  });
  
  return { success: true, messageId };
}

// Subscription Suspended Email
interface SubscriptionSuspendedEmailData {
  landlordName: string;
  landlordEmail: string;
  planName: string;
  suspensionDate: string;
}

export async function sendSubscriptionSuspendedEmail(data: SubscriptionSuspendedEmailData): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'subscription_suspended',
    recipient: { name: data.landlordName, email: data.landlordEmail },
    subject: '⚠️ Subscription Expired - Account Suspended',
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      planName: data.planName,
      suspensionDate: data.suspensionDate,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Subscription Suspended Email Sent:', {
    to: data.landlordEmail,
    subject: emailLog.subject,
  });
  
  return { success: true, messageId };
}

// Bulk Announcement Email
export interface BulkAnnouncementEmailData {
  subject: string;
  message: string;
  recipientGroups: string[];
  senderName: string;
  senderEmail: string;
  timestamp: string;
}

export async function sendBulkAnnouncementEmail(
  data: BulkAnnouncementEmailData,
  totalRecipients: number
): Promise<{ success: boolean; messageId: string; sentCount: number; failedCount: number }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const messageId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simulate sending to all recipients with some random failures
  const failedCount = Math.floor(Math.random() * Math.min(3, totalRecipients * 0.05));
  const sentCount = totalRecipients - failedCount;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'system_announcement',
    recipient: { name: 'All Recipients', email: `${totalRecipients} users` },
    subject: data.subject,
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      recipientGroups: data.recipientGroups,
      totalRecipients,
      sentCount,
      failedCount,
      message: data.message.substring(0, 100) + (data.message.length > 100 ? '...' : ''),
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Bulk Announcement Email Sent:', {
    subject: data.subject,
    recipientGroups: data.recipientGroups,
    totalRecipients,
    sentCount,
    failedCount,
  });
  
  return { success: true, messageId, sentCount, failedCount };
}

// Subscription Renewal Confirmation Email
interface SubscriptionRenewalConfirmationData {
  landlordName: string;
  landlordEmail: string;
  planName: string;
  amount: number;
  newExpirationDate: string;
  transactionId: string;
}

export async function sendSubscriptionRenewalConfirmationEmail(
  data: SubscriptionRenewalConfirmationData
): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'subscription_renewal',
    recipient: { name: data.landlordName, email: data.landlordEmail },
    subject: '✅ Subscription Renewal Confirmed',
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      planName: data.planName,
      amount: data.amount,
      newExpirationDate: data.newExpirationDate,
      transactionId: data.transactionId,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Subscription Renewal Confirmation Email Sent:', {
    to: data.landlordEmail,
    subject: emailLog.subject,
  });
  
  return { success: true, messageId };
}

// User Invitation Email
interface UserInvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  message?: string;
  invitationToken: string;
  expiresAt: string;
}

export async function sendUserInvitationEmail(
  data: UserInvitationEmailData
): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const onboardingUrl = `${window.location.origin}/onboarding?token=${data.invitationToken}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'user_invitation',
    recipient: { name: data.recipientName || 'New User', email: data.recipientEmail },
    subject: `🎉 You're Invited to Join PropManager as a ${data.role}`,
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      inviterName: data.inviterName,
      inviterEmail: data.inviterEmail,
      role: data.role,
      invitationToken: data.invitationToken,
      expiresAt: data.expiresAt,
      onboardingUrl,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 User Invitation Email Sent:', {
    to: data.recipientEmail,
    subject: emailLog.subject,
    body: generateInvitationEmailBody(data, onboardingUrl),
  });
  
  return { success: true, messageId };
}

function generateInvitationEmailBody(data: UserInvitationEmailData, onboardingUrl: string): string {
  return `
Dear ${data.recipientName || 'User'},

You have been invited to join PropManager as a ${data.role}!

INVITATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invited By: ${data.inviterName} (${data.inviterEmail})
Role: ${data.role}
Expires: ${new Date(data.expiresAt).toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.message ? `Personal Message:\n"${data.message}"\n\n` : ''}

To complete your registration, please click the link below:

${onboardingUrl}

After completing the onboarding process, your account will be reviewed and approved by an administrator.

If you did not expect this invitation, you can safely ignore this email.

Best regards,
PropManager Team
  `.trim();
}
