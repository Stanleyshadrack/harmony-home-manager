import {useEffect} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {apiRequest} from '@/api/https';
import {applyLandlordPalette,Palette,palettes} from '@/utils/landlordPalette';

export function PersonalPaletteSync(){
 const {user}=useAuth();
 const {resolvedTheme}=useTheme();
 useEffect(()=>{
   let active=true;
   // Clear previous account's preferences immediately at sign-out/switch.
   applyLandlordPalette(null);
   if(user?.role!=='landlord')return;
   apiRequest<null,{palette:Palette}>({path:'/api/users/me/color-preferences',method:'GET'})
    .then(data=>{if(active&&palettes.some(p=>p.id===data.palette))applyLandlordPalette(data.palette);})
    .catch(()=>{if(active)applyLandlordPalette(null);});
   return()=>{active=false;};
 },[user?.id,user?.role,resolvedTheme]);
 return null;
}
