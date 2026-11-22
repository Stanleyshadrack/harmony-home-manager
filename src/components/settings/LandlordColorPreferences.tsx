import {useEffect,useState} from 'react';
import {apiRequest} from '@/api/https';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {applyLandlordPalette, Palette, palettes} from '@/utils/landlordPalette';

export function LandlordColorPreferences(){
  const {user}=useAuth();
  const {toast}=useToast();
  const [palette,setPalette]=useState<Palette>('teal');
  const [saved,setSaved]=useState<Palette>('teal');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(user?.role!=='landlord')return;
    let mounted=true;
    setLoading(true);
    apiRequest<null,{palette:Palette}>({path:'/api/users/me/color-preferences',method:'GET'})
      .then(response=>{if(mounted){setPalette(response.palette);setSaved(response.palette);setError('');applyLandlordPalette(response.palette);}})
      .catch(e=>{if(mounted)setError(e instanceof Error?e.message:'Unable to load color preferences');})
      .finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[user?.id,user?.role]);

  if(user?.role!=='landlord')return null;
  async function save(){
    setSaving(true);
    try{
      const result=await apiRequest<{palette:Palette},{palette:Palette}>({
        path:'/api/users/me/color-preferences',method:'PUT',body:{palette},
      });
      setPalette(result.palette);setSaved(result.palette);setError('');
      toast({title:'Colors saved',description:'Your personal color preference is saved to your account.'});
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to save colors');
      applyLandlordPalette(saved);
    }finally{setSaving(false);}
  }
  return <Card>
    <CardHeader><CardTitle>System colors</CardTitle>
      <CardDescription>Choose your personal brand accent. Your choice is saved to your landlord account and does not change other users' colors.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {palettes.map(item=><button key={item.id} type="button" disabled={loading||saving}
          aria-pressed={palette===item.id}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${palette===item.id?'ring-2 ring-primary':''}`}
          onClick={()=>{setPalette(item.id);applyLandlordPalette(item.id);}}>
          <span aria-hidden="true" className="h-5 w-5 rounded-full border" style={{backgroundColor:item.hex}}/>
          {item.label}
        </button>)}
      </div>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button disabled={loading||saving||saved===palette} onClick={()=>void save()}>{saving?'Saving…':'Save colors'}</Button>
        <Button variant="outline" disabled={loading||saving} onClick={()=>{setPalette(saved);applyLandlordPalette(saved);}}>Cancel</Button>
      </div>
    </CardContent>
  </Card>;
}
