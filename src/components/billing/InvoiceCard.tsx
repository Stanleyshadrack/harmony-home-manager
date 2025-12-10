import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CreditCard, FileText, Droplets, Home, Download } from 'lucide-react';
import type { Invoice } from '@/types/billing';
import { downloadInvoicePDF } from '@/utils/invoicePdf';
import { useToast } from '@/hooks/use-toast';

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

const statusColors: Record<Invoice['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  partial: 'bg-info/10 text-info border-info/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const typeIcons: Record<Invoice['type'], React.ReactNode> = {
  rent: <Home className="h-4 w-4" />,
  water: <Droplets className="h-4 w-4" />,
  utilities: <FileText className="h-4 w-4" />,
  late_fee: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

export function InvoiceCard({ invoice, onView, onRecordPayment }: InvoiceCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF({
      invoice,
      tenantName: invoice.tenantName,
      tenantEmail: 'tenant@email.com',
      unitNumber: invoice.unitNumber,
      propertyName: invoice.propertyName,
      propertyAddress: '123 Property Street, Nairobi',
      landlordName: 'Property Manager',
      landlordPhone: '+254 712 345 678',
      landlordEmail: 'manager@property.com',
    });
    toast({
      title: 'Invoice Downloaded',
      description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {typeIcons[invoice.type]}
            </div>
            <div>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">{invoice.tenantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[invoice.status]}>
              {t(`billing.${invoice.status}`)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(invoice)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <DropdownMenuItem onClick={() => onRecordPayment?.(invoice)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{invoice.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{invoice.propertyName}</span>
          <span>•</span>
          <span>Unit {invoice.unitNumber}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.totalDue')}</p>
            <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.balance')}</p>
            <p className={`font-semibold ${invoice.balance > 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(invoice.balance)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>{t('billing.dueDate')}: {formatDate(invoice.dueDate)}</span>
          {invoice.paidDate && (
            <span className="text-success">{t('billing.paidDate')}: {formatDate(invoice.paidDate)}</span>
          )}
        </div>

        {invoice.waterReading && (
          <div className="mt-3 pt-3 border-t bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Water Reading Details
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Previous:</span>
                <span className="ml-1 font-medium">{invoice.waterReading.previousReading}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current:</span>
                <span className="ml-1 font-medium">{invoice.waterReading.currentReading}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Usage:</span>
                <span className="ml-1 font-medium">{invoice.waterReading.consumption} units</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
