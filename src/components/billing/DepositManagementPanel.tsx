import { useEffect, useState } from 'react';
import { apiRequest } from '@/api/https';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmActionDialog } from '@/components/messages/ConfirmActionDialog';

interface Movement {
  type:string; amount:number; reason?:string; evidenceReference?:string;
  paymentReference?:string;createdAt:string;
}
interface Deposit {
  accountId:number;leaseId:number;tenantId:number;unitId:number;
  status:string; required:number;collected:number;deducted:number;
  refunded:number;refundable:number;history:Movement[];
}
type Action='collections'|'deductions'|'refunds';
const money=(v:number)=>new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES'}).format(Number(v||0));

export function DepositManagementPanel() {
  const { user }=useAuth();
  const canManage=user?.role==='landlord'||user?.role==='super_admin';
  const [accounts,setAccounts]=useState<Deposit[]>([]);
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [action,setAction]=useState<Action>('collections');
  const [amount,setAmount]=useState('');
  const [reason,setReason]=useState('');
  const [evidence,setEvidence]=useState('');
  const [reference,setReference]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [showInitializeConfirm,setShowInitializeConfirm]=useState(false);
  const load=async()=>{
    try{
      const data=await apiRequest<null,Deposit[]>({path:'/api/deposits',method:'GET'});
      setAccounts(data);
      if(selectedId!==null&&!data.some(d=>d.leaseId===selectedId))setSelectedId(null);
    }catch(e){setNotice(e instanceof Error?e.message:'Unable to load deposit accounts');}
  };
  useEffect(()=>{void load();},[user?.id]);
  const selected=accounts.find(a=>a.leaseId===selectedId);
  const submit=async()=>{
    if(!selected||busy)return;
    if(!Number.isFinite(Number(amount))||Number(amount)<=0){setNotice('Enter a positive amount');return;}
    if(action==='deductions'&&(!reason.trim()||!evidence.trim())){
      setNotice('Deductions require a reason and inspection evidence reference');return;
    }
    if(action!=='deductions'&&!reference.trim()){
      setNotice('Provide a confirmed payment or refund transaction reference');return;
    }
    setBusy(true);setNotice('');
    try{
      await apiRequest<object,Deposit>({
        path:`/api/deposits/leases/${selected.leaseId}/${action}`,method:'POST',
        body:{amount:Number(amount),description:reason,
          evidenceReference:evidence,paymentReference:reference}
      });
      setAmount('');setReason('');setEvidence('');setReference('');
      await load();
      setNotice('Deposit ledger updated. The system records confirmed payouts; it does not transfer money.');
    }catch(e){setNotice(e instanceof Error?e.message:'Deposit update failed');}
    finally{setBusy(false);}
  };
  return <Card className="min-w-0">
    <CardHeader>
      <CardTitle>Refundable Tenant Deposits</CardTitle>
      <p className="text-sm text-muted-foreground">
        Deposit money is held once per lease, outside rent invoices.
        Deductions require vacating and evidence. Refund entries require an actual payout reference.
      </p>
    </CardHeader>
    <CardContent className="space-y-4">
      {canManage && <Button variant="outline" disabled={busy} onClick={()=>setShowInitializeConfirm(true)}>Initialize Existing Lease Deposits (unpaid until verified)</Button>}
      <ConfirmActionDialog
        open={showInitializeConfirm}
        onOpenChange={setShowInitializeConfirm}
        title="Initialize missing deposit accounts?"
        description="Create deposit accounts for existing active leases. Existing deposits will NOT be marked as paid. Verify historical receipts separately."
        confirmLabel="Initialize accounts"
        destructive={false}
        onConfirm={async()=>{
        setBusy(true);setNotice('');
        try{
          const result=await apiRequest<null,{created:number}>({
            path:'/api/deposits/initialize-existing',method:'POST'
          });
          await load();
          setNotice(`Initialized ${result.created} lease deposit account(s). Verify historical receipts separately.`);
        }catch(e){setNotice(e instanceof Error?e.message:'Unable to initialize leases');throw e;}
        finally{setBusy(false);}
      }}
      />
      {accounts.length===0 && <p className="text-sm text-muted-foreground">
        No deposit accounts yet. New approved leases receive an account automatically.
        Existing leases can be initialized without assuming their deposits were paid.
      </p>}
      {accounts.length>0 && <select className="h-10 w-full rounded-md border bg-background px-3"
        value={selectedId??''} onChange={e=>setSelectedId(e.target.value?Number(e.target.value):null)}>
        <option value="">Select tenant lease</option>
        {accounts.map(a=><option key={a.accountId} value={a.leaseId}>
          Lease #{a.leaseId} · Tenant #{a.tenantId} · Unit #{a.unitId} · {a.status}
        </option>)}
      </select>}
      {selected && <>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[
            ['Required',selected.required],['Collected',selected.collected],
            ['Deductions',selected.deducted],['Refundable held',selected.refundable]
          ].map(([label,value])=><div key={String(label)} className="min-w-0 rounded-md bg-muted p-3">
            <p className="break-words text-xs text-muted-foreground">{label}</p>
            <p className="break-words font-semibold">{money(Number(value))}</p>
          </div>)}
        </div>
        <p className="text-xs text-muted-foreground">Status: {selected.status} · Refunded to date: {money(selected.refunded)}</p>
        {canManage && <div className="space-y-3 rounded-md border p-3">
          <label className="flex flex-col gap-1 text-sm">Action
            <select className="h-10 rounded-md border bg-background px-2" value={action}
              onChange={e=>setAction(e.target.value as Action)}>
              <option value="collections">Confirm deposit received</option>
              <option value="deductions">Record inspected damage deduction</option>
              <option value="refunds">Record confirmed deposit refund</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">Amount (KES)
              <Input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/>
            </label>
            {action!=='deductions' && <label className="flex flex-col gap-1 text-sm">Confirmed transaction reference
              <Input value={reference} onChange={e=>setReference(e.target.value)}
                placeholder="Bank or M-Pesa reference"/>
            </label>}
            {action==='deductions' && <>
              <label className="flex flex-col gap-1 text-sm">Damage and reason
                <Input value={reason} onChange={e=>setReason(e.target.value)}
                  placeholder="Itemized damage or unpaid charge"/>
              </label>
              <label className="flex flex-col gap-1 text-sm">Evidence reference
                <Input value={evidence} onChange={e=>setEvidence(e.target.value)}
                  placeholder="Inspection report/photo URL"/>
              </label>
            </>}
          </div>
          <Button disabled={busy} onClick={()=>void submit()}>
            {action==='collections'?'Record Deposit Receipt':
            action==='deductions'?'Record Deduction':'Record Completed Refund'}
          </Button>
        </div>}
        <h3 className="font-semibold">Deposit history</h3>
        {selected.history.length===0?<p className="text-sm text-muted-foreground">No transactions recorded.</p>:
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {selected.history.map((event,index)=><div key={index} className="min-w-0 rounded-md border p-3 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{event.type}</strong><strong>{money(event.amount)}</strong>
              </div>
              <p className="mt-1 break-words">{event.reason||event.paymentReference||'—'}</p>
              {event.evidenceReference&&<p className="break-all text-muted-foreground">Evidence: {event.evidenceReference}</p>}
              <p className="text-muted-foreground">{event.createdAt}</p>
            </div>)}
          </div>}
      </>}
      {notice && <p role="status" className="break-words text-sm">{notice}</p>}
    </CardContent>
  </Card>;
}
