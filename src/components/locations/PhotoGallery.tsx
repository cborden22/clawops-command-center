import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useLocationPhotos } from "@/hooks/useLocationPhotos";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  locationId: string;
  className?: string;
}

export function PhotoGallery({ locationId, className }: PhotoGalleryProps) {
  const { photos, isLoading, isUploading, fetchPhotos, uploadPhoto, deletePhoto } = useLocationPhotos(locationId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          Photos ({photos.length})
        </h4>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
            {isUploading ? "Uploading..." : "Add Photo"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No photos yet</p>
          <p className="text-xs">Tap "Add Photo" to document this location</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div key={photo.name} className="relative group aspect-square rounded-lg overflow-hidden border border-border/50">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deletePhoto(photo.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
