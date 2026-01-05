export interface SubscriptionPayment {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: 'card' | 'mpesa' | 'bank';
  transactionRef: string;
  cardLast4?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  renewalPeriod: string; // e.g., "1 Year"
  previousExpiryDate: string;
  newExpiryDate: string;
  paymentDate: string;
  createdAt: string;
}

export interface SubscriptionPaymentFormData {
  landlordId: string;
  planId: string;
  paymentMethod: 'card' | 'mpesa' | 'bank';
  cardNumber?: string;
  cardholderName?: string;
}
