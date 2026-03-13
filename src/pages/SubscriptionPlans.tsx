import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubscriptionPlan, SubscriptionPlanDetails } from '@/components/Plans';
import { useSubscriptionPayments } from '@/hooks/useSubscriptionPayments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Building2, ArrowRight, Star, ArrowLeft, CreditCard, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { useMyLandlord } from '@/hooks/useMyLandlord';
import { SUBSCRIPTION_PLANS as subscriptionPlans } from '@/components/Plans';

type UpgradeStep = 'plans' | 'payment' | 'success';



export default function SubscriptionPlans() {
     const { upgrade, renew } = useSubscriptionPayments();
  const { user } = useAuth();
  const { toast } = useToast();

  const { landlord: currentLandlord, isLoading } = useMyLandlord();
  const [step, setStep] = useState<UpgradeStep>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanDetails | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });


    if (isLoading) {
  return (
    <DashboardLayout title="Subscription Plans">
      <div className="text-center py-12 text-muted-foreground">
        Loading subscription details…
      </div>
    </DashboardLayout>
  );
}


const currentPlan: SubscriptionPlan =
  currentLandlord?.subscription ?? 'BASIC';

  const getPlanIcon = (id: SubscriptionPlan) => {
   switch (id) {
  case 'BASIC': return Building2;
  case 'PREMIUM': return Zap;
  case 'ENTERPRISE': return Crown;
}
  };

  const getPlanHighlight = (planId: SubscriptionPlan, isCurrent: boolean) => {
  if (!isCurrent) return 'border-muted';

  return 'border-primary ring-2 ring-primary shadow-lg';
};

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

 const handleSelectPlan = (plan: SubscriptionPlanDetails) => {
  if (plan.id === currentPlan) return;
  setSelectedPlan(plan);

  if (plan.price === 0) {
    handleFreeUpgrade(plan);
  } else {
    setStep('payment');
  }
};

const handleFreeUpgrade = async (plan: SubscriptionPlanDetails) => {
  try {
    await upgrade(plan.id, billingCycle);

    setSelectedPlan(plan);
    setStep('success');

    toast({
      title: 'Plan Updated!',
      description: `You are now on the ${plan.name}.`,
    });
  } catch (err) {
    toast({
      title: 'Upgrade Failed',
      description: 'Something went wrong while upgrading.',
      variant: 'destructive',
    });
  }
};

const handleProcessPayment = async () => {
  if (
    !paymentData.cardNumber ||
    !paymentData.expiryDate ||
    !paymentData.cvv ||
    !paymentData.cardholderName
  ) {
    toast({
      title: 'Missing Information',
      description: 'Please fill in all payment details.',
      variant: 'destructive',
    });
    return;
  }

  if (!selectedPlan) return;

  setIsProcessing(true);

  try {
    // 🔐 REAL BACKEND CALL
   await upgrade(selectedPlan.id, billingCycle);

    setStep('success');

    toast({
      title: 'Payment Successful',
      description: `You've been upgraded to ${selectedPlan.name}.`,
    });
  } catch {
    toast({
      title: 'Payment Failed',
      description: 'Unable to process payment. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setIsProcessing(false);
  }
};

  const handleBackToPlans = () => {
    setStep('plans');
    setSelectedPlan(null);
    setPaymentData({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' });
  };

  // ─── STEP: SUCCESS ────────────────────────────────────
  if (step === 'success' && selectedPlan) {
    return (
      <DashboardLayout
        title="Upgrade Complete"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subscription Plans', href: '/subscription-plans' },
          { label: 'Success' },
        ]}
      >
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            You've been upgraded to <strong>{selectedPlan.name}</strong>. Enjoy your new features!
          </p>

          <Card className="text-left mb-8">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                ${billingCycle === "MONTHLY"
  ? selectedPlan.price
  : Math.round(selectedPlan.price * 12 * 0.8)}
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Properties Limit</span>
                <span className="font-medium">{selectedPlan.maxProperties === 999 ? 'Unlimited' : selectedPlan.maxProperties}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Units Limit</span>
                <span className="font-medium">{selectedPlan.maxUnits === 9999 ? 'Unlimited' : selectedPlan.maxUnits}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valid Until</span>
                <span className="font-medium">
                  {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleBackToPlans} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── STEP: PAYMENT ────────────────────────────────────
  if (step === 'payment' && selectedPlan) {
    return (
      <DashboardLayout
        title="Complete Upgrade"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subscription Plans', href: '/subscription-plans' },
          { label: 'Payment' },
        ]}
      >
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={handleBackToPlans} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </Button>

          <div className="grid gap-6 md:grid-cols-5">
            {/* Payment Form */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Details
                </CardTitle>
                <CardDescription>Enter your card information to complete the upgrade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleProcessPayment} disabled={isProcessing} className="w-full gap-2">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processing...' : `Pay $${selectedPlan.price * 12}/year`}
                </Button>
              </CardFooter>
            </Card>

            {/* Order Summary */}
            <Card className="md:col-span-2 h-fit">
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">1 Year</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rate</span>
                  <span className="font-medium">${selectedPlan.price}/mo</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${selectedPlan.price * 12}</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Up to {selectedPlan.maxProperties === 999 ? '∞' : selectedPlan.maxProperties} properties</p>
                  <p>✓ Up to {selectedPlan.maxUnits === 9999 ? '∞' : selectedPlan.maxUnits} units</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── STEP: PLAN SELECTION ─────────────────────────────
  return (
    <DashboardLayout
      title="Subscription Plans"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Subscription Plans' },
      ]}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <div className="flex justify-center items-center gap-4 mt-4">
  <Button
    variant={billingCycle === "MONTHLY" ? "default" : "outline"}
    onClick={() => setBillingCycle("MONTHLY")}
  >
    Monthly
  </Button>

  <Button
    variant={billingCycle === "ANNUAL" ? "default" : "outline"}
    onClick={() => setBillingCycle("ANNUAL")}
  >
    Annual (Save 20%)
  </Button>
</div>
          <div className="text-muted-foreground mt-2">
  You're currently on the{' '}
  <Badge
    variant={currentPlan === 'BASIC' ? 'secondary' : 'default'}
    className="mx-1 inline-flex"
  >
    {subscriptionPlans.find(p => p.id === currentPlan)?.name || 'Basic'}
  </Badge>
</div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrent = plan.id === currentPlan;
        const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

const isDowngrade = PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan];
            const isPopular = plan.id === 'PREMIUM';

            return (
              <Card
 key={plan.id}
  className={`relative flex flex-col transition-all
    ${getPlanHighlight(plan.id, isCurrent)}
    ${isCurrent ? 'bg-primary/5' : 'hover:shadow-lg'}
  `}
>
  {isCurrent && (
    <div className="absolute top-3 right-3">
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Current
      </Badge>
    </div>
  )}

 {isPopular && !isCurrent && (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <Badge className="bg-primary text-primary-foreground gap-1">
      <Star className="h-3 w-3" /> Most Popular
    </Badge>
  </div>
)}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary mb-2">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price === 0
  ? "Free"
  : `$${billingCycle === "MONTHLY"
      ? plan.price
      : Math.round(plan.price * 12 * 0.8)}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">
  /{billingCycle === "MONTHLY" ? "month" : "year"}
</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-sm text-muted-foreground mb-4 text-center">
                    Up to {plan.maxProperties === 999 ? '∞' : plan.maxProperties} properties · {plan.maxUnits === 9999 ? '∞' : plan.maxUnits} units
                  </div>
                  <Separator className="mb-4" />
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="ghost" className="w-full" disabled>
                      Downgrade not available
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      Upgrade <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {currentLandlord && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Current Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{currentLandlord.currentProperties}</p>
                  <p className="text-sm text-muted-foreground">of {currentLandlord.maxProperties === 999 ? '∞' : currentLandlord.maxProperties} Properties</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{currentLandlord.currentUnits}</p>
                  <p className="text-sm text-muted-foreground">of {currentLandlord.maxUnits === 9999 ? '∞' : currentLandlord.maxUnits} Units</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                 <p className="text-2xl font-bold capitalize">
  {subscriptionPlans.find(p => p.id === currentPlan)?.name}
</p>
 <p className="text-sm text-muted-foreground">
    Billing: {currentLandlord.billingCycle}
  </p>
                 
                   <p className="text-sm text-muted-foreground">
  Expires{' '}
  {currentLandlord.subscriptionEndDate
    ? new Date(currentLandlord.subscriptionEndDate).toLocaleDateString()
    : 'Not set'}
</p>
                  
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
