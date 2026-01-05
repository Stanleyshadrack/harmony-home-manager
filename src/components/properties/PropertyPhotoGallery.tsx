import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Image,
  Upload,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Loader2,
  Star,
  GripVertical,
} from 'lucide-react';

interface PropertyPhotoGalleryProps {
  propertyId: string;
  photos: string[];
  featuredPhotoIndex?: number;
  onPhotosChange: (photos: string[], featuredIndex?: number) => void;
  editable?: boolean;
}

export function PropertyPhotoGallery({
  propertyId,
  photos,
  featuredPhotoIndex = 0,
  onPhotosChange,
  editable = true,
}: PropertyPhotoGalleryProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File',
            description: `${file.name} is not an image file.`,
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'destructive',
          });
          continue;
        }

        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        onPhotosChange(updatedPhotos, featuredPhotoIndex);
        toast({
          title: 'Photos Uploaded',
          description: `${newPhotos.length} photo(s) added successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload photos. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    let newFeaturedIndex = featuredPhotoIndex;
    if (index === featuredPhotoIndex) {
      newFeaturedIndex = 0;
    } else if (index < featuredPhotoIndex) {
      newFeaturedIndex = featuredPhotoIndex - 1;
    }
    onPhotosChange(newPhotos, Math.min(newFeaturedIndex, Math.max(0, newPhotos.length - 1)));
    toast({
      title: 'Photo Deleted',
      description: 'Photo has been removed from the gallery.',
    });
  };

  const handleSetFeatured = (index: number) => {
    onPhotosChange(photos, index);
    toast({
      title: 'Featured Photo Set',
      description: 'This photo will be shown as the cover image.',
    });
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    let newFeaturedIndex = featuredPhotoIndex;
    if (draggedIndex === featuredPhotoIndex) {
      newFeaturedIndex = dropIndex;
    } else if (draggedIndex < featuredPhotoIndex && dropIndex >= featuredPhotoIndex) {
      newFeaturedIndex = featuredPhotoIndex - 1;
    } else if (draggedIndex > featuredPhotoIndex && dropIndex <= featuredPhotoIndex) {
      newFeaturedIndex = featuredPhotoIndex + 1;
    }

    onPhotosChange(newPhotos, newFeaturedIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);

    toast({
      title: 'Photos Reordered',
      description: 'Photo order has been updated.',
    });
  }, [draggedIndex, photos, featuredPhotoIndex, onPhotosChange, toast]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Property Photos
            </CardTitle>
            {editable && photos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Drag photos to reorder • Click star to set cover
              </p>
            )}
          </div>
          {editable && (
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Photos
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  draggable={editable}
                  onDragStart={(e) => editable && handleDragStart(e, index)}
                  onDragOver={(e) => editable && handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => editable && handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group aspect-square rounded-lg overflow-hidden bg-muted transition-all ${
                    editable ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${draggedIndex === index ? 'opacity-50 scale-95' : ''} ${
                    dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  {/* Featured Badge */}
                  {index === featuredPhotoIndex && (
                    <Badge 
                      className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground"
                    >
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Cover
                    </Badge>
                  )}

                  {/* Drag Handle */}
                  {editable && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/80 backdrop-blur-sm rounded p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <img
                    src={photo}
                    alt={`Property photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setSelectedPhotoIndex(index)}
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(index);
                      }}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    {editable && (
                      <>
                        <Button
                          size="icon"
                          variant={index === featuredPhotoIndex ? 'default' : 'secondary'}
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetFeatured(index);
                          }}
                          title="Set as cover photo"
                        >
                          <Star className={`h-4 w-4 ${index === featuredPhotoIndex ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add More Tile */}
              {editable && (
                <div
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add More</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground mb-4">
                {editable
                  ? 'Upload photos to showcase this property'
                  : 'No photos have been added to this property'}
              </p>
              {editable && (
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onOpenChange={() => setSelectedPhotoIndex(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <DialogTitle className="text-white flex items-center gap-2">
              Photo {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0} of {photos.length}
              {selectedPhotoIndex === featuredPhotoIndex && (
                <Badge variant="secondary" className="ml-2">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Cover Photo
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPhotoIndex !== null && (
            <div className="relative">
              <img
                src={photos[selectedPhotoIndex]}
                alt={`Property photo ${selectedPhotoIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain bg-black"
              />

              {/* Navigation Buttons */}
              {selectedPhotoIndex > 0 && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={handlePrevPhoto}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {selectedPhotoIndex < photos.length - 1 && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={handleNextPhoto}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Close Button */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4"
                onClick={() => setSelectedPhotoIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex gap-2 justify-center overflow-x-auto">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all ${
                          index === selectedPhotoIndex
                            ? 'ring-primary'
                            : 'ring-transparent hover:ring-white/50'
                        }`}
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === featuredPhotoIndex && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Star className="h-4 w-4 text-white fill-current" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
