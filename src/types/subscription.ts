export interface SubscriptionPayment {
  id: string;
  
  // 🔥 Shifted to Company
  companyId: string;
  companyName: string;
  companyEmail: string;
  
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: 'card' | 'mpesa' | 'bank';
  transactionRef: string;
  cardLast4?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  renewalPeriod: string; // e.g., "1 Year"
  previousExpiryDate: string; // Made these optional in your previous file, up to you if they should be strictly required here!
  newExpiryDate: string;
  paymentDate: string;
  createdAt: string;
}

export interface SubscriptionPaymentFormData {
  // 🔥 Shifted to Company
  companyId: string;
  
  planId: string;
  paymentMethod: 'card' | 'mpesa' | 'bank';
  cardNumber?: string;
  cardholderName?: string;
}