import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscriptionPayments } from '@/hooks/useSubscriptionPayments';
import { SubscriptionPayment } from '@/types/subscription';
import { downloadSubscriptionReceiptPDF } from '@/utils/subscriptionReceiptPdf';
import {
  Receipt,
  Download,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';


interface SubscriptionPaymentHistoryProps {
  showTitle?: boolean;
}

export function SubscriptionPaymentHistory({  showTitle = true }: SubscriptionPaymentHistoryProps) {
  const { payments, isLoading } = useSubscriptionPayments();
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: SubscriptionPayment['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Refunded
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string, cardLast4?: string) => {
    switch (method) {
      case 'card':
        return cardLast4 ? `Card •••• ${cardLast4}` : 'Credit Card';
      case 'mpesa':
        return 'M-PESA';
      case 'bank':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  const handleDownloadReceipt = (payment: SubscriptionPayment) => {
    downloadSubscriptionReceiptPDF(payment);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading payment history...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              View and download receipts for subscription payments
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={showTitle ? '' : 'pt-6'}>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary">{payment.planName}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.paymentMethod, payment.cardLast4)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={payment.status !== 'completed'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payment History</h3>
              <p className="text-muted-foreground">
                Subscription payment records will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedPayment.status === 'completed' 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-muted'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPayment.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    <span className="font-medium">
                      {selectedPayment.status === 'completed' ? 'Payment Successful' : 'Payment Status'}
                    </span>
                  </div>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{selectedPayment.transactionRef}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(selectedPayment.paymentDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{selectedPayment.planName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p>{selectedPayment.renewalPeriod}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Previous Expiry</p>
                    <p>{formatDate(selectedPayment.previousExpiryDate)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">New Expiry</p>
                    <p className="text-success font-medium">{formatDate(selectedPayment.newExpiryDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {getPaymentMethodLabel(selectedPayment.paymentMethod, selectedPayment.cardLast4)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="flex items-center gap-1 text-lg font-bold text-primary">
                      <DollarSign className="h-4 w-4" />
                      {selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              {selectedPayment.status === 'completed' && (
                <Button 
                  className="w-full" 
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt (PDF)
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
