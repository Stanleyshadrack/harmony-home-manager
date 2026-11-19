import { useEffect, useState } from 'react';
import { apiRequest } from '@/api/https';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
interface Movement {
  type:string;amount:number;reason?:string;evidenceReference?:string;
  paymentReference?:string;createdAt?:string;
}
interface Deposit {
  accountId:number;leaseId:number;unitId:number;status:string;
  required:number;collected:number;deducted:number;refunded:number;refundable:number;
  history:Movement[];
}
const kes=(n:number)=>new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES'}).format(Number(n||0));
export function TenantDepositStatement(){
  const [accounts,setAccounts]=useState<Deposit[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    void apiRequest<null,Deposit[]>({path:'/api/deposits',method:'GET'})
      .then(rows=>{if(active){setAccounts(rows);setError('');}})
      .catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load deposit statement');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);
  return <div className="min-w-0 space-y-4">
    <h2 className="text-xl font-semibold">Refundable Security Deposit</h2>
    <p className="text-sm text-muted-foreground">
      Your security deposit is held separately from monthly rent and water charges.
      Deductions require a documented move-out inspection; refunds require a confirmed payout.
    </p>
    {loading&&<p className="text-sm">Loading deposit statement...</p>}
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    {!loading&&!error&&accounts.length===0&&<p className="rounded-md border p-4 text-sm">
      No deposit record is available for your lease yet. Contact your landlord if you have already paid.
    </p>}
    {accounts.map(account=><Card key={account.accountId} className="min-w-0">
      <CardHeader><CardTitle className="text-base">Lease #{account.leaseId} · Unit #{account.unitId}</CardTitle>
        <p className="text-xs text-muted-foreground">Status: {account.status}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Required',account.required],['Collected',account.collected],
            ['Deducted',account.deducted],['Refundable held',account.refundable],
          ].map(([label,value])=><div className="rounded-md bg-muted/40 p-3" key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="break-words font-semibold">{kes(Number(value))}</p>
          </div>)}
        </div>
        <p className="text-sm">Refunded to date: {kes(account.refunded)}</p>
        <h3 className="font-medium">Collection and settlement history</h3>
        {account.history.length===0?<p className="text-xs text-muted-foreground">No payments recorded.</p>:
        <div className="space-y-2">
          {account.history.map((entry,index)=><div key={index} className="rounded-md border p-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{entry.type}</strong><strong>{kes(entry.amount)}</strong>
            </div>
            <p className="break-words">{entry.reason||entry.paymentReference||'—'}</p>
            {entry.evidenceReference&&<p className="break-all text-muted-foreground">
              Evidence reference: {entry.evidenceReference}</p>}
            <p className="text-muted-foreground">{entry.createdAt}</p>
          </div>)}
        </div>}
      </CardContent>
    </Card>)}
  </div>;
}
