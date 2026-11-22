import {useEffect} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {apiRequest} from '@/api/https';
import {applyLandlordPalette,ColorPreference,palettes,validHex} from '@/utils/landlordPalette';

export function PersonalPaletteSync(){
 const {user}=useAuth();
 const {resolvedTheme}=useTheme();
 useEffect(()=>{
   let active=true;
   applyLandlordPalette(null);
   if(user?.role!=='landlord')return;
   apiRequest<null,ColorPreference>({path:'/api/users/me/color-preferences',method:'GET'})
    .then(data=>{
      if(!active)return;
      if(data.palette==='custom'&&validHex(data.customColor))applyLandlordPalette(data);
      else if(palettes.some(p=>p.id===data.palette))applyLandlordPalette(data);
      else applyLandlordPalette('teal');
    })
    .catch(()=>{if(active)applyLandlordPalette(null);});
   return()=>{active=false;};
 },[user?.id,user?.role,resolvedTheme]);
 return null;
}
