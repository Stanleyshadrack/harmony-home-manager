import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null | undefined;

export function TenantDocumentCorrectionPanel({
  idStatus, leaseStatus,
}: { idStatus: DocumentStatus; leaseStatus: DocumentStatus }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'ID' | 'LEASE'>('ID');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const queries = useQueryClient();
  const needsCorrection = (idStatus !== 'APPROVED' && idStatus !== 'PENDING') ||
                          (leaseStatus !== 'APPROVED' && leaseStatus !== 'PENDING');
  if (!needsCorrection) return null;

  const submit = async () => {
    if (!file || busy) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
        file.size > 10 * 1024 * 1024) {
      toast({title: 'Invalid document', description: 'Choose PDF, JPG or PNG, up to 10 MB.', variant: 'destructive'});
      return;
    }
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to open this document'));
        reader.readAsDataURL(file);
      });
      await apiRequest<{base64:string}, unknown>({
        path: `/api/tenants/me/documents/${type}/resubmit`,
        method: 'POST', body: {base64},
      });
      toast({title: 'Document submitted',
        description: 'Your corrected document is awaiting landlord review. Refresh the clearance checklist after approval.'});
      setFile(null);
      await queries.invalidateQueries({queryKey: ['tenant-portal-profile']});
    } catch (e) {
      toast({title: 'Document not submitted',
        description: e instanceof Error ? e.message : 'Please try again', variant: 'destructive'});
    } finally {
      setBusy(false);
    }
  };

  const options: Array<{key:'ID'|'LEASE'; label:string; status:DocumentStatus}> = [
    {key:'ID', label:'Identity document', status:idStatus},
    {key:'LEASE', label:'Signed lease', status:leaseStatus},
  ];
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-5 w-5" /> Correct missing or rejected documents</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <p className="text-xs text-muted-foreground">
        You may replace documents only when they are missing or rejected. Existing approved and pending documents stay locked.
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <Button key={option.key} type="button" size="sm"
            variant={type === option.key ? 'default' : 'outline'}
            disabled={option.status === 'PENDING' || option.status === 'APPROVED'}
            onClick={() => {setType(option.key); setFile(null);}}>
            {option.label} — {option.status || 'Missing'}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-correction-file">Replacement document (PDF/JPG/PNG, max 10 MB)</Label>
        <Input key={type} id="tenant-correction-file" type="file"
          accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>
      <Button onClick={submit} disabled={!file || busy ||
        (type === 'ID' ? idStatus === 'PENDING' || idStatus === 'APPROVED' :
                              leaseStatus === 'PENDING' || leaseStatus === 'APPROVED')}>
        {busy ? 'Submitting…' : 'Submit corrected document'}
      </Button>
    </CardContent>
  </Card>;
}
