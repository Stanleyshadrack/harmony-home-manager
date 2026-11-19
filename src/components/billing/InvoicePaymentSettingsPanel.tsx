import { useEffect, useState } from 'react';
import { apiRequest } from '@/api/https';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Settings {
  propertyId?: number;
  dueDay?: number;
  autoGenerate?: boolean;
  remindersEnabled?: boolean;
  displayName?: string;
  paymentMethod?: string;
  paybillNumber?: string;
  accountReference?: string;
  supportContact?: string;
  paymentInstructions?: string;
}
export function InvoicePaymentSettingsPanel() {
  const { properties, isLoading } = useProperties();
  const [propertyId,setPropertyId] = useState('');
  const [settings,setSettings] = useState<Settings>({});
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  useEffect(()=>{
    if (!propertyId) {setSettings({});return;}
    let active=true;
    setNotice('');
    void apiRequest<null,Settings>({
      path:`/api/billing/property-settings/${encodeURIComponent(propertyId)}`,method:'GET'
    }).then(data=>{if(active)setSettings(data||{});})
      .catch(error=>{if(active)setNotice(error instanceof Error?error.message:'Unable to load payment settings');});
    return ()=>{active=false;};
  },[propertyId]);
  const update=(key:keyof Settings,value:string)=>setSettings(prev=>({...prev,[key]:value}));
  const save=async()=>{
    if(!propertyId)return;
    setBusy(true);setNotice('');
    try {
      await apiRequest<Settings,Settings>({
        path:`/api/billing/property-settings/${encodeURIComponent(propertyId)}`,
        method:'PUT',body:settings
      });
      setNotice('Invoice payment settings saved for this property.');
    } catch(e){setNotice(e instanceof Error?e.message:'Unable to save settings');}
    finally {setBusy(false);}
  };
  const fields: {key:keyof Settings;label:string;placeholder:string}[]=[
    {key:'displayName',label:'Invoice header / property name',placeholder:'e.g. H&R APARTMENT'},
    {key:'paymentMethod',label:'Payment method',placeholder:'e.g. M-Pesa Paybill'},
    {key:'paybillNumber',label:'Paybill / business number',placeholder:'Enter actual Paybill number'},
    {key:'accountReference',label:'Payment account reference',placeholder:'e.g. unit number or agreed account'},
    {key:'supportContact',label:'Billing support contact',placeholder:'Phone or email'},
    {key:'paymentInstructions',label:'Payment instructions',placeholder:'Additional instructions for tenants'}
  ];
  return <Card className="min-w-0">
    <CardHeader><CardTitle>Invoice Template & Payment Details</CardTitle>
      <p className="text-sm text-muted-foreground">
        Uses the supplied teal-and-cream invoice design. Set the actual payment details
        for each property; no bank or Paybill details are invented.
      </p>
    </CardHeader>
    <CardContent className="space-y-3">
      <label className="block text-sm font-medium">Property</label>
      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={propertyId} onChange={e=>setPropertyId(e.target.value)} disabled={isLoading}>
        <option value="">Choose property</option>
        {properties.map(property=><option key={property.id} value={property.id}>{property.name}</option>)}
      </select>
      {!!propertyId && <>
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          Monthly invoice due day (1–28)
          <Input type="number" min={1} max={28} value={settings.dueDay ?? 7}
            onChange={e=>setSettings(prev=>({...prev,dueDay:Number(e.target.value)}))}/>
        </label>
        <div className="space-y-2 rounded-md border p-3 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={Boolean(settings.autoGenerate)}
              onChange={e=>setSettings(prev=>({...prev,autoGenerate:e.target.checked}))} className="mt-1"/>
            Automatically issue this property's monthly rent + approved previous-month water invoice,
            after balances are reconciled and the deployment-level automation switch is enabled.
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={Boolean(settings.remindersEnabled)}
              onChange={e=>setSettings(prev=>({...prev,remindersEnabled:e.target.checked}))} className="mt-1"/>
            Automatically send due-date and overdue rent reminders for this property.
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(field=><label key={field.key} className="flex min-w-0 flex-col gap-1 text-sm">
            {field.label}
            <Input value={String(settings[field.key] || '')} placeholder={field.placeholder}
              onChange={e=>update(field.key,e.target.value)}/>
          </label>)}
        </div>
        <Button disabled={busy} onClick={()=>void save()}>Save property invoice settings</Button>
      </>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
    </CardContent>
  </Card>;
}
