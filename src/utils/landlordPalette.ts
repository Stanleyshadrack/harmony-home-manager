export type Palette = 'teal'|'blue'|'purple'|'orange'|'rose';
export const palettes:{id:Palette;label:string;hex:string;hsl:string;dark:string}[] = [
  {id:'teal',label:'Teal',hex:'#278f82',hsl:'173 58% 39%',dark:'173 58% 45%'},
  {id:'blue',label:'Blue',hex:'#2563eb',hsl:'221 83% 53%',dark:'217 91% 60%'},
  {id:'purple',label:'Purple',hex:'#7c3aed',hsl:'262 83% 58%',dark:'263 70% 66%'},
  {id:'orange',label:'Orange',hex:'#c2410c',hsl:'20 87% 40%',dark:'21 90% 54%'},
  {id:'rose',label:'Rose',hex:'#be185d',hsl:'333 78% 42%',dark:'330 81% 60%'},
];
export function applyLandlordPalette(palette:Palette|null){
  if(typeof document==='undefined')return;
  const root=document.documentElement;
  if(palette===null){['--primary','--ring','--sidebar-primary','--sidebar-ring'].forEach(k=>root.style.removeProperty(k));return;}
  const selected=palettes.find(item=>item.id===palette)||palettes[0];
  const value=root.classList.contains('dark')?selected.dark:selected.hsl;
  for(const key of ['--primary','--ring','--sidebar-primary','--sidebar-ring'])
    root.style.setProperty(key,value);
}
