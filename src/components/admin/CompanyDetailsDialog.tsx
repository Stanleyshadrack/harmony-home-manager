import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, CreditCard, Users, Home } from 'lucide-react';
import { CompanyResponse } from '@/api/service/CompanyServiceApi';

interface CompanyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyResponse | null;
  formatDate: (dateString: string) => string;
}

export function CompanyDetailsDialog({ open, onOpenChange, company, formatDate }: CompanyDetailsDialogProps) {
  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Company Profile</DialogTitle>
          <DialogDescription>
            Detailed view of {company.name}'s platform statistics and subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold uppercase">
              {company.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{company.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {company.createdAt ? formatDate(company.createdAt) : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Home className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Properties</p>
              </div>
              <p className="text-xl font-bold">{company.numberOfProperties}</p>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Landlords</p>
              </div>
              <p className="text-xl font-bold">{company.numberOfLandlords}</p>
            </div>
          </div>

          {/* Subscription Details Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <CreditCard className="h-4 w-4" />
              Subscription Details
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge variant="outline" className="capitalize">
                  {company.subscriptionPlan ? company.subscriptionPlan.toLowerCase() : 'N/A'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge 
                  className={company.subscriptionStatus === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
                >
                  {company.subscriptionStatus || 'UNKNOWN'}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{company.subscriptionStartDate ? formatDate(company.subscriptionStartDate) : '—'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{company.subscriptionEndDate ? formatDate(company.subscriptionEndDate) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}