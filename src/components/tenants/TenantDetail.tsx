import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tenant } from '@/types/tenant';
import { useLeases, useTenantDocuments } from '@/hooks/useTenants';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenantDetailProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  expired: 'bg-red-500/10 text-red-500 border-red-500/20',
  terminated: 'bg-muted text-muted-foreground border-muted',
};

const documentTypeLabels: Record<string, string> = {
  id: 'ID Document',
  lease: 'Lease Agreement',
  proof_of_income: 'Proof of Income',
  reference: 'Reference Letter',
  other: 'Other',
};

export function TenantDetail({ tenant, open, onOpenChange }: TenantDetailProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { leases } = useLeases(tenant?.id);
  const { documents, uploadDocument, deleteDocument } = useTenantDocuments(tenant?.id || '');
  const [isUploading, setIsUploading] = useState(false);

  if (!tenant) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file, 'other');
      toast({
        title: 'Document uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    try {
      await deleteDocument(docId);
      toast({
        title: 'Document deleted',
        description: `${docName} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeLease = leases.find((l) => l.status === 'active');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('tenants.tenantDetails')}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={tenant.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {tenant.firstName[0]}
                {tenant.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">
                {tenant.firstName} {tenant.lastName}
              </h2>
              <p className="text-muted-foreground">
                {tenant.unitNumber} • {tenant.propertyName}
              </p>
              <Badge variant="outline" className={`mt-1 ${statusColors[tenant.status]}`}>
                {tenant.status}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">{t('tenants.profile')}</TabsTrigger>
              <TabsTrigger value="lease">{t('tenants.lease')}</TabsTrigger>
              <TabsTrigger value="documents">{t('tenants.documents')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('tenants.contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {tenant.unitNumber}, {tenant.propertyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {tenant.moveInDate && (
  <span>
    Move in: {new Date(tenant.moveInDate).toLocaleDateString()}
  </span>
)}

                  </div>
                </CardContent>
              </Card>

              {tenant.emergencyContact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('tenants.emergencyContact')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{tenant.emergencyContact}</span>
                    </div>
                    {tenant.emergencyPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.emergencyPhone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lease" className="mt-4 space-y-4">
              {activeLease ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t('tenants.currentLease')}</CardTitle>
                      <Badge variant="outline" className={statusColors[activeLease.status]}>
                        {activeLease.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('tenants.startDate')}</p>
                        <p className="font-medium">
                          {new Date(activeLease.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('tenants.endDate')}</p>
                        <p className="font-medium">
                          {new Date(activeLease.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('tenants.monthlyRent')}</p>
                        <p className="font-medium text-lg">
                          KES {activeLease.monthlyRent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('tenants.securityDeposit')}
                        </p>
                        <p className="font-medium">
                          KES {activeLease.securityDeposit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {activeLease.signedAt && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Signed on {new Date(activeLease.signedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('tenants.noActiveLease')}</p>
                    <Button className="mt-4">{t('tenants.createLease')}</Button>
                  </CardContent>
                </Card>
              )}

              {leases.filter((l) => l.status !== 'active').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('tenants.leaseHistory')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leases
                        .filter((l) => l.status !== 'active')
                        .map((lease) => (
                          <div
                            key={lease.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">
                                {new Date(lease.startDate).toLocaleDateString()} -{' '}
                                {new Date(lease.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                KES {lease.monthlyRent.toLocaleString()}/month
                              </p>
                            </div>
                            <Badge variant="outline" className={statusColors[lease.status]}>
                              {lease.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" className="gap-2" disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  <label className="cursor-pointer">
                    {isUploading ? 'Uploading...' : t('tenants.uploadDocument')}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                  </label>
                </Button>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{documentTypeLabels[doc.type]}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.size)}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('tenants.noDocuments')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
