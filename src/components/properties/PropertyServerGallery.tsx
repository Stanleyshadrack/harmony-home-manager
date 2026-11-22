import {useCallback,useEffect,useState} from 'react';
import {apiRequest} from '@/api/https';
import {useProtectedMedia} from '@/hooks/useProtectedMedia';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {ConfirmActionDialog} from '@/components/messages/ConfirmActionDialog';
import {Image as ImageIcon,Upload,Star,Trash2,RefreshCw} from 'lucide-react';

type Photo={id:number;cover:boolean;path:string};
function PhotoTile({photo,onCover,onDelete,busy}:{
  photo:Photo;onCover:(id:number)=>void;onDelete:(id:number)=>void;busy:boolean;
}){
  const image=useProtectedMedia(photo.path);
  return <div className="rounded-lg border overflow-hidden">
    <div className="aspect-video bg-muted">
      {image?<img src={image} alt="Property image" className="h-full w-full object-cover"/>:
        <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon/></div>}
    </div>
    <div className="flex items-center justify-between gap-2 p-2">
      {photo.cover?<span className="text-xs font-medium">Cover photo</span>:
        <Button variant="ghost" size="sm" disabled={busy} onClick={()=>onCover(photo.id)}>
          <Star className="mr-1 h-3 w-3"/>Set cover
        </Button>}
      <Button variant="ghost" size="sm" className="text-destructive" disabled={busy} onClick={()=>onDelete(photo.id)}>
        <Trash2 className="h-4 w-4"/>
      </Button>
    </div>
  </div>;
}
export function PropertyServerGallery({propertyId}:{propertyId:string}){
 const {toast}=useToast();
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [photoToDelete,setPhotoToDelete]=useState<number|null>(null);
 const load=useCallback(async()=>{
    setLoading(true);
    try{
      const result=await apiRequest<null,Photo[]>({path:`/api/properties/${propertyId}/photos`,method:'GET'});
      setPhotos(result);setError('');
    }catch(e){setError(e instanceof Error?e.message:'Cannot load property photos');}
    finally{setLoading(false);}
 },[propertyId]);
 useEffect(()=>{void load();},[load]);
 const upload=async(event:React.ChangeEvent<HTMLInputElement>)=>{
  const files=Array.from(event.target.files||[]);event.target.value='';
  if(!files.length)return;
  setBusy(true);
  try{
   for(const file of files){
     if(!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)||file.size>3*1024*1024)
       throw new Error('Choose JPG, PNG, GIF or WEBP images up to 3 MB each.');
     const body=new FormData();body.append('file',file);
     await apiRequest<FormData,Photo>({path:`/api/properties/${propertyId}/photos`,method:'POST',body});
   }
   await load();toast({title:'Property photos saved',description:'Images are available across devices for authorized landlords.'});
  }catch(e){setError(e instanceof Error?e.message:'Upload failed');await load();}
  finally{setBusy(false);}
 };
 const cover=async(id:number)=>{
  setBusy(true);try{
   await apiRequest<null,Photo>({path:`/api/properties/${propertyId}/photos/${id}/cover`,method:'PUT'});
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Unable to choose cover');}
  finally{setBusy(false);}
 };
 const remove=async(id:number)=>{
  setBusy(true);try{
   await apiRequest<null,void>({path:`/api/properties/${propertyId}/photos/${id}`,method:'DELETE'});
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Unable to delete photo');throw e;}
  finally{setBusy(false);}
 };
 return <><Card><CardHeader className="flex flex-row items-center justify-between gap-2">
   <CardTitle>Property photos ({photos.length})</CardTitle>
   <div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>void load()} disabled={busy||loading}>
    <RefreshCw className="h-4 w-4"/></Button>
   <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
    <Upload className="mr-2 h-4 w-4"/>Upload
    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="sr-only"
      disabled={busy} onChange={event=>void upload(event)}/>
   </label></div>
 </CardHeader><CardContent>
   {error&&<p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
   {loading?<p className="text-sm text-muted-foreground">Loading photos…</p>:
    photos.length?<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{photos.map(photo=>
      <PhotoTile key={photo.id} photo={photo} busy={busy} onCover={id=>void cover(id)} onDelete={id=>setPhotoToDelete(id)}/>)}</div>
    :<p className="text-sm text-muted-foreground">No property photos uploaded yet.</p>}
 </CardContent></Card>
 <ConfirmActionDialog
   open={photoToDelete!==null}
   onOpenChange={open=>{if(!open)setPhotoToDelete(null);}}
   title="Delete property photo?"
   description="This photo will be permanently removed from this property. This action cannot be undone."
   confirmLabel="Delete photo"
   destructive
   onConfirm={async()=>{if(photoToDelete!==null)await remove(photoToDelete);}}
 />
 </>;
}
