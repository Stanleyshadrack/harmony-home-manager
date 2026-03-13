import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Landlord, SubscriptionPlanDetails } from '@/hooks/useLandlords';
import { useSubscriptionPayments } from '@/hooks/useSubscriptionPayments';
import { SubscriptionPaymentHistory } from '@/components/landlords/SubscriptionPaymentHistory';
import {
  CreditCard,
  Check,
  Calendar,
  DollarSign,
  Loader2,
  ShieldCheck,
  Sparkles,
  History,
} from 'lucide-react';

interface SubscriptionRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlord: Landlord;
  subscriptionPlans: SubscriptionPlanDetails[];
  onRenew: (landlordId: string, plan: string, paymentData: PaymentData) => Promise<void>;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export function SubscriptionRenewalDialog({
  open,
  onOpenChange,
  landlord,
  subscriptionPlans,
  onRenew,
}: SubscriptionRenewalDialogProps) {
  const { renew, upgrade } = useSubscriptionPayments();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'renew' | 'history'>('renew');
  const [selectedPlan, setSelectedPlan] = useState(landlord.subscription);
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const currentPlan = subscriptionPlans.find(p => p.id === landlord.subscription);
  const newPlan = subscriptionPlans.find(p => p.id === selectedPlan);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleProcessPayment = async () => {
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all payment details.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

      const handleProcessPayment = async () => {
  if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
    toast({
      title: "Missing Information",
      description: "Please fill in all payment details.",
      variant: "destructive",
    });
    return;
  }

  setIsProcessing(true);

  try {
    // 🔐 Call backend
    if (selectedPlan !== landlord.subscription) {
      await upgrade(selectedPlan.toUpperCase() as any);
    } else {
      await renew();
    }

    setStep("success");

    toast({
      title: "Subscription Renewed",
      description: `Successfully renewed to ${newPlan?.name} plan.`,
    });
  } catch {
    toast({
      title: "Payment Failed",
      description: "Unable to process payment.",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};

      setStep('success');
      
      toast({
        title: 'Subscription Renewed',
        description: `Successfully renewed to ${newPlan?.name} plan.`,
      });
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Unable to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('plan');
    setActiveTab('renew');
    setPaymentData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
    onOpenChange(false);
  };

  const getDaysUntilExpiration = () => {
    const end = new Date(landlord.subscriptionEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiration();
  const isExpired = daysLeft < 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {step === 'success' ? 'Renewal Complete' : 'Subscription Management'}
          </DialogTitle>
          <DialogDescription>
            {step === 'plan' && `Manage subscription for ${landlord.firstName} ${landlord.lastName}`}
            {step === 'payment' && 'Enter your payment details to complete the renewal'}
            {step === 'success' && 'Your subscription has been successfully renewed'}
          </DialogDescription>
        </DialogHeader>

        {step === 'plan' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'renew' | 'history')} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="renew" className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Renew Subscription
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                <History className="h-4 w-4 mr-2" />
                Payment History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="renew" className="mt-4 space-y-4">
              {/* Current Status */}
              <Card className={isExpired ? 'border-destructive' : daysLeft <= 7 ? 'border-warning' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="font-semibold capitalize">{currentPlan?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <Badge variant={isExpired ? 'destructive' : daysLeft <= 7 ? 'outline' : 'secondary'}>
                        {isExpired ? 'Expired' : `${daysLeft} days left`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Selection */}
              <div className="space-y-3">
                <Label>Select Plan</Label>
                <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as any)}>
                  {subscriptionPlans.map(plan => (
                    <div
                      key={plan.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedPlan === plan.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <RadioGroupItem value={plan.id} id={plan.id} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={plan.id} className="font-semibold cursor-pointer">
                            {plan.name}
                            {plan.id === 'enterprise' && (
                              <Badge variant="secondary" className="ml-2">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </Label>
                          <span className="font-bold text-lg">${plan.price}/mo</span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <Check className="h-3 w-3 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Renewal Period</span>
                    </div>
                    <span>1 Year</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Due Today</span>
                    <span className="text-lg">${(newPlan?.price || 0) * 12}/year</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <SubscriptionPaymentHistory showTitle={false} />
            </TabsContent>
          </Tabs>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            {/* Order Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span>{newPlan?.name} - 1 Year</span>
                  <span className="font-semibold">${(newPlan?.price || 0) * 12}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={paymentData.cardholderName}
                  onChange={e => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(paymentData.cardNumber)}
                  onChange={e => setPaymentData({ ...paymentData, cardNumber: e.target.value.replace(/\s/g, '') })}
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={formatExpiry(paymentData.expiryDate)}
                    onChange={e => setPaymentData({ ...paymentData, expiryDate: e.target.value.replace(/\D/g, '') })}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    value={paymentData.cvv}
                    onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-8">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground text-center mb-4">
              {landlord.firstName}'s subscription has been renewed to {newPlan?.name} for 1 year.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm">
              <div className="flex justify-between text-sm mb-2">
                <span>Plan</span>
                <span className="font-medium">{newPlan?.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Amount Paid</span>
                <span className="font-medium">${(newPlan?.price || 0) * 12}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Expiry</span>
                <span className="font-medium">
                  {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'plan' && activeTab === 'renew' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleProceedToPayment}>
                <DollarSign className="h-4 w-4 mr-2" />
                Proceed to Payment
              </Button>
            </>
          )}
          {step === 'plan' && activeTab === 'history' && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
          {step === 'payment' && (
            <>
              <Button variant="outline" onClick={() => setStep('plan')} disabled={isProcessing}>
                Back
              </Button>
              <Button onClick={handleProcessPayment} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Pay ${(newPlan?.price || 0) * 12}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
