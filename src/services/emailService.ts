// Email Service Simulation
// This simulates email delivery for frontend development
// Replace with actual Resend/Twilio integration when backend is enabled

import { Payment, Invoice } from '@/types/billing';

interface EmailRecipient {
  name: string;
  email: string;
}

interface PaymentReceiptEmailData {
  payment: Payment;
  invoice: Invoice;
  recipient: EmailRecipient;
  propertyName: string;
  landlordName: string;
}

export type EmailType = 'payment_receipt' | 'rent_reminder' | 'maintenance_update' | 'water_reading_pending' | 'water_reading_approved' | 'water_reading_rejected' | 'system_lock' | 'system_unlock' | 'password_reset' | 'subscription_reminder' | 'subscription_suspended' | 'general';

export interface EmailLog {
  id: string;
  type: EmailType;
  recipient: EmailRecipient;
  subject: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
  metadata?: Record<string, any>;
}

// Store email logs in localStorage for simulation
const EMAIL_LOGS_KEY = 'email_logs';

function getEmailLogs(): EmailLog[] {
  const logs = localStorage.getItem(EMAIL_LOGS_KEY);
  return logs ? JSON.parse(logs) : [];
}

function saveEmailLog(log: EmailLog): void {
  const logs = getEmailLogs();
  logs.unshift(log);
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs.slice(0, 100))); // Keep last 100
}

export async function sendPaymentReceiptEmail(data: PaymentReceiptEmailData): Promise<{ success: boolean; messageId: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emailLog: EmailLog = {
    id: messageId,
    type: 'payment_receipt',
    recipient: data.recipient,
    subject: `Payment Receipt - ${data.invoice.invoiceNumber}`,
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      invoiceNumber: data.invoice.invoiceNumber,
      paymentAmount: data.payment.amount,
      paymentMethod: data.payment.paymentMethod,
      transactionRef: data.payment.transactionRef,
      propertyName: data.propertyName,
    },
  };
  
  saveEmailLog(emailLog);
  
  // Log simulated email for debugging
  console.log('📧 Simulated Email Sent:', {
    to: data.recipient.email,
    subject: emailLog.subject,
    body: generatePaymentReceiptEmailBody(data),
  });
  
  return { success: true, messageId };
}

function generatePaymentReceiptEmailBody(data: PaymentReceiptEmailData): string {
  const paymentMethodLabels: Record<string, string> = {
    mpesa: 'M-PESA',
    card: 'Credit/Debit Card',
    bank: 'Bank Transfer',
    cash: 'Cash',
  };
  
  return `
Dear ${data.recipient.name},

Thank you for your payment! This email confirms that we have received your payment.

PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: ${data.invoice.invoiceNumber}
Description: ${data.invoice.description}
Amount Paid: KES ${data.payment.amount.toLocaleString()}
Payment Method: ${paymentMethodLabels[data.payment.paymentMethod] || data.payment.paymentMethod}
Transaction Reference: ${data.payment.transactionRef}
Payment Date: ${new Date(data.payment.paymentDate).toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.invoice.balance - data.payment.amount <= 0 
  ? '✓ This invoice has been PAID IN FULL.' 
  : `Remaining Balance: KES ${Math.max(0, data.invoice.balance - data.payment.amount).toLocaleString()}`}

Property: ${data.propertyName}
Unit: ${data.invoice.unitNumber}

If you have any questions about this payment, please contact us.

Best regards,
${data.landlordName}
${data.propertyName}
  `.trim();
}

export function getEmailHistory(): EmailLog[] {
  return getEmailLogs();
}

export function clearEmailHistory(): void {
  localStorage.removeItem(EMAIL_LOGS_KEY);
}

// Water Reading Email Notifications
interface WaterReadingEmailData {
  recipientName: string;
  recipientEmail: string;
  unitNumber: string;
  propertyName: string;
  consumption: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export async function sendWaterReadingEmail(data: WaterReadingEmailData): Promise<{ success: boolean; messageId: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const subjects: Record<string, string> = {
    pending: `Water Reading Pending Approval - ${data.unitNumber}`,
    approved: `Water Reading Approved - ${data.unitNumber}`,
    rejected: `Water Reading Rejected - ${data.unitNumber}`,
  };

  const emailLog: EmailLog = {
    id: messageId,
    type: `water_reading_${data.status}` as EmailType,
    recipient: { name: data.recipientName, email: data.recipientEmail },
    subject: subjects[data.status],
    status: 'sent',
    sentAt: new Date().toISOString(),
    metadata: {
      unitNumber: data.unitNumber,
      propertyName: data.propertyName,
      consumption: data.consumption,
      totalAmount: data.totalAmount,
    },
  };
  
  saveEmailLog(emailLog);
  
  console.log('📧 Simulated Water Reading Email Sent:', {
    to: data.recipientEmail,
    subject: emailLog.subject,
    body: generateWaterReadingEmailBody(data),
  });
  
  return { success: true, messageId };
}

function generateWaterReadingEmailBody(data: WaterReadingEmailData): string {
  if (data.status === 'pending') {
    return `
Dear ${data.recipientName},

A new water reading has been submitted and requires your approval.

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: ${data.unitNumber}
Property: ${data.propertyName}
Consumption: ${data.consumption} units
Total Amount: KES ${data.totalAmount.toLocaleString()}
Submitted By: ${data.submittedBy || 'Employee'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please log in to review and approve this reading.

Best regards,
Property Management System
    `.trim();
  }

  if (data.status === 'approved') {
    return `
Dear ${data.recipientName},

Your water reading has been approved!

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: ${data.unitNumber}
Property: ${data.propertyName}
Consumption: ${data.consumption} units
Total Amount: KES ${data.totalAmount.toLocaleString()}
Approved By: ${data.approvedBy || 'Manager'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This reading has been added to the tenant's billing.

Best regards,
Property Management System
    `.trim();
  }

  return `
Dear ${data.recipientName},

Your water reading has been rejected.

READING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit: ${data.unitNumber}
Property: ${data.propertyName}
Consumption: ${data.consumption} units
Reason: ${data.rejectionReason || 'No reason provided'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review and submit a corrected reading.

Best regards,
Property Management System
  `.trim();
}
