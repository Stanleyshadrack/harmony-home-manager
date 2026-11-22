import {useEffect,useState} from 'react';
import {apiRequest} from '@/api/https';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {
  applyLandlordPalette, ColorPreference, customColorGrid,
  Palette, palettes, validHex
} from '@/utils/landlordPalette';

const INITIAL: ColorPreference={palette:'teal',customColor:null};
const DEFAULT_CUSTOM='#2563EB';

export function LandlordColorPreferences(){
  const {user}=useAuth();
  const {toast}=useToast();
  const [draft,setDraft]=useState<ColorPreference>(INITIAL);
  const [saved,setSaved]=useState<ColorPreference>(INITIAL);
  const [hexInput,setHexInput]=useState(DEFAULT_CUSTOM);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(user?.role!=='landlord')return;
    let active=true;
    setLoading(true);
    apiRequest<null,ColorPreference>({path:'/api/users/me/color-preferences',method:'GET'})
      .then(response=>{
        if(!active)return;
        const next=normalizePreference(response);
        setDraft(next);setSaved(next);
        setHexInput(next.customColor||DEFAULT_CUSTOM);
        setError('');
        applyLandlordPalette(next);
      })
      .catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load color preferences');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[user?.id,user?.role]);

  if(user?.role!=='landlord')return null;

  const selectPreset=(palette:Exclude<Palette,'custom'>)=>{
    const next={palette,customColor:null};
    setDraft(next);setError('');
    applyLandlordPalette(next);
  };
  const selectCustom=(hex:string)=>{
    setHexInput(hex);
    if(!validHex(hex))return;
    const next:ColorPreference={palette:'custom',customColor:hex.toUpperCase()};
    setDraft(next);setError('');
    applyLandlordPalette(next);
  };
  const dirty=draft.palette!==saved.palette||
    (draft.palette==='custom'&&draft.customColor?.toUpperCase()!==saved.customColor?.toUpperCase());

  const reset=()=>{
    setDraft(saved);
    setHexInput(saved.customColor||DEFAULT_CUSTOM);
    applyLandlordPalette(saved);
    setError('');
  };
  const save=async()=>{
    if(saving||loading)return;
    if(draft.palette==='custom'&&!validHex(draft.customColor)){
      setError('Enter a valid six-digit hex color (for example, #2563EB).');return;
    }
    setSaving(true);
    try{
      const result=normalizePreference(await apiRequest<ColorPreference,ColorPreference>({
        path:'/api/users/me/color-preferences',method:'PUT',body:draft
      }));
      setDraft(result);setSaved(result);setError('');
      applyLandlordPalette(result);
      toast({title:'System colors saved',description:'Your custom theme is saved to your landlord account.'});
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to save system colors');
      reset();
    }finally{setSaving(false);}
  };

  return <Card>
    <CardHeader>
      <CardTitle>System colors</CardTitle>
      <CardDescription>Choose a preset or create your own brand accent. Changes are previewed instantly and saved only to your landlord account.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <section className="space-y-3" aria-label="Preset system colors">
        <h3 className="text-sm font-semibold">Preset colors</h3>
        <div className="flex flex-wrap gap-3">
          {palettes.map(item=><button key={item.id} type="button" disabled={loading||saving}
            aria-pressed={draft.palette===item.id}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${draft.palette===item.id?'ring-2 ring-primary':''}`}
            onClick={()=>selectPreset(item.id)}>
            <span aria-hidden="true" className="h-5 w-5 rounded-full border" style={{backgroundColor:item.hex}}/>
            {item.label}
          </button>)}
        </div>
      </section>

      <section className="space-y-3" aria-label="Custom color grid">
        <div>
          <h3 className="text-sm font-semibold">Custom color grid</h3>
          <p className="mt-1 text-xs text-muted-foreground">Select a shade, use the color picker, or enter your exact HEX color.</p>
        </div>
        <div className="w-full max-w-xl space-y-1 rounded-xl border bg-muted/20 p-3" role="group" aria-label="Choose a custom color">
          {customColorGrid.map((row,index)=>
            <div key={index} className="grid grid-cols-8 gap-1.5">
              {row.map(hex=><button key={hex} type="button"
                aria-label={`Choose color ${hex}`}
                aria-pressed={draft.palette==='custom'&&draft.customColor?.toUpperCase()===hex}
                title={hex}
                disabled={loading||saving}
                className={`aspect-square min-h-8 rounded-md border border-black/10 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${draft.palette==='custom'&&draft.customColor?.toUpperCase()===hex?'ring-2 ring-primary ring-offset-2 ring-offset-background':''}`}
                style={{backgroundColor:hex}}
                onClick={()=>selectCustom(hex)}
              />)}
            </div>)}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="custom-color-picker">
            Color picker
            <input id="custom-color-picker" type="color" className="h-10 w-20 cursor-pointer rounded border bg-background p-1"
              disabled={loading||saving} value={validHex(hexInput)?hexInput:DEFAULT_CUSTOM}
              onChange={e=>selectCustom(e.target.value)}/>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="custom-color-hex">
            HEX color
            <Input id="custom-color-hex" value={hexInput} maxLength={7} disabled={loading||saving}
              className="w-36 font-mono uppercase" placeholder="#2563EB"
              onChange={e=>selectCustom(e.target.value)}/>
          </label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-9 w-9 rounded-lg border shadow-sm" style={{backgroundColor:validHex(hexInput)?hexInput:DEFAULT_CUSTOM}}/>
            {draft.palette==='custom'&&validHex(draft.customColor)?draft.customColor:'Choose a custom shade'}
          </div>
        </div>
        {hexInput&&!validHex(hexInput)&&<p className="text-xs text-destructive" role="alert">Enter a complete HEX value such as #2563EB.</p>}
      </section>

      <section className="rounded-lg border p-4" aria-label="Theme preview">
        <h3 className="mb-3 text-sm font-semibold">Live preview</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" tabIndex={-1} className="pointer-events-none">Primary button</Button>
          <span className="rounded-md border px-3 py-2 text-sm text-primary">Accent text</span>
          <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">Selected accent</span>
        </div>
      </section>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button disabled={loading||saving||!dirty} onClick={()=>void save()}>{saving?'Saving…':'Save colors'}</Button>
        <Button variant="outline" disabled={loading||saving} onClick={reset}>Cancel</Button>
      </div>
    </CardContent>
  </Card>;
}

function normalizePreference(preference:ColorPreference):ColorPreference{
  const validPreset=palettes.some(item=>item.id===preference.palette);
  if(preference.palette==='custom'&&validHex(preference.customColor))
    return {palette:'custom',customColor:preference.customColor.toUpperCase()};
  return {palette:validPreset?preference.palette:'teal',customColor:null};
}
