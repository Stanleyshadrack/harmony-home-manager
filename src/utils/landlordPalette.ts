export type Palette = 'teal' | 'blue' | 'purple' | 'orange' | 'rose' | 'custom';
export type ColorPreference = { palette: Palette; customColor: string | null };

export const palettes: {id: Exclude<Palette, 'custom'>; label: string; hex: string; hsl: string; dark: string}[] = [
  {id:'teal',label:'Teal',hex:'#278f82',hsl:'173 58% 39%',dark:'173 58% 45%'},
  {id:'blue',label:'Blue',hex:'#2563eb',hsl:'221 83% 53%',dark:'217 91% 60%'},
  {id:'purple',label:'Purple',hex:'#7c3aed',hsl:'262 83% 58%',dark:'263 70% 66%'},
  {id:'orange',label:'Orange',hex:'#c2410c',hsl:'20 87% 40%',dark:'21 90% 54%'},
  {id:'rose',label:'Rose',hex:'#be185d',hsl:'333 78% 42%',dark:'330 81% 60%'},
];

// Distinct, accessible starting points in a hue-and-shade color grid.
// Users can choose any other color with the custom picker or hex field.
export const customColorGrid = [
  ['#991B1B','#B91C1C','#DC2626','#EF4444','#F87171','#FB7185','#E11D48','#BE123C'],
  ['#9A3412','#C2410C','#EA580C','#F97316','#FB923C','#D97706','#F59E0B','#FBBF24'],
  ['#3F6212','#4D7C0F','#65A30D','#84CC16','#A3E635','#15803D','#16A34A','#22C55E'],
  ['#115E59','#0F766E','#0D9488','#14B8A6','#2DD4BF','#155E75','#0891B2','#06B6D4'],
  ['#1E40AF','#1D4ED8','#2563EB','#3B82F6','#60A5FA','#4338CA','#4F46E5','#6366F1'],
  ['#581C87','#6B21A8','#7E22CE','#9333EA','#A855F7','#86198F','#C026D3','#D946EF'],
  ['#9D174D','#BE185D','#DB2777','#EC4899','#F472B6','#334155','#475569','#64748B'],
];

export function validHex(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function hexToHsl(hex: string): string {
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red,green,blue), min = Math.min(red,green,blue);
  const delta = max-min;
  let h = 0;
  let s = 0;
  let l = (max+min)/2;
  if (delta!==0) {
    s = delta/(1-Math.abs(2*l-1));
    switch(max){
      case red: h=((green-blue)/delta)%6;break;
      case green: h=(blue-red)/delta+2;break;
      default: h=(red-green)/delta+4;
    }
    h *= 60;
  }
  if(h<0)h+=360;
  return `${Math.round(h)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

const tokens = ['--primary','--ring','--sidebar-primary','--sidebar-ring'];
export function applyLandlordPalette(preference: ColorPreference | Palette | null) {
  if(typeof document==='undefined')return;
  const root=document.documentElement;
  if(preference===null){
    tokens.forEach(token=>root.style.removeProperty(token));
    root.style.removeProperty('--primary-foreground');
    root.style.removeProperty('--sidebar-primary-foreground');
    return;
  }

  const selected = typeof preference==='string' ? {palette:preference,customColor:null} : preference;
  let hsl: string;
  let foreground='0 0% 100%';
  if(selected.palette==='custom'){
    if(!validHex(selected.customColor)) return;
    const hex=selected.customColor;
    hsl=hexToHsl(hex);
    // Preserve legibility of primary buttons against very light selected colors.
    const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
    const linear=rgb.map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
    const luminance=0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
    foreground=luminance>0.179?'222 47% 11%':'0 0% 100%';
  }else{
    const preset=palettes.find(item=>item.id===selected.palette)||palettes[0];
    hsl=root.classList.contains('dark')?preset.dark:preset.hsl;
  }
  tokens.forEach(token=>root.style.setProperty(token,hsl));
  root.style.setProperty('--primary-foreground',foreground);
  root.style.setProperty('--sidebar-primary-foreground',foreground);
}
