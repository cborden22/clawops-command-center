import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CapturedPhoto {
  path: string;
  previewUrl: string;
}

interface StopPhotoCaptureProps {
  locationId?: string | null;
  machineId?: string | null;
  routeRunId?: string | null;
  stopIndex: number;
  label: string;
  required?: boolean;
  photos: CapturedPhoto[];
  onChange: (photos: CapturedPhoto[]) => void;
}

/**
 * Collection-screen photo proof for route stops.
 * Uploads to the private location-photos bucket and logs a
 * collection_photos row so owners can audit verification later.
 */
export function StopPhotoCapture({
  locationId,
  machineId,
  routeRunId,
  stopIndex,
  label,
  required,
  photos,
  onChange,
}: StopPhotoCaptureProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const folder = `${user.id}/${locationId || "unassigned"}/collections`;
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("location-photos")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: ownerId } = await supabase.rpc("get_effective_owner_id", {
        current_user_id: user.id,
      });

      const { error: insertError } = await supabase.from("collection_photos").insert({
        user_id: (ownerId as string) || user.id,
        taken_by_user_id: user.id,
        location_id: locationId || null,
        machine_id: machineId || null,
        route_run_id: routeRunId || null,
        stop_index: stopIndex,
        storage_path: path,
      });
      if (insertError) throw insertError;

      onChange([...photos, { path, previewUrl: URL.createObjectURL(file) }]);
    } catch (error: any) {
      console.error("Photo verification upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Could not save the verification photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = async (photo: CapturedPhoto) => {
    onChange(photos.filter((p) => p.path !== photo.path));
    await supabase.storage.from("location-photos").remove([photo.path]);
    await supabase.from("collection_photos").delete().eq("storage_path", photo.path);
  };

  const satisfied = photos.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 space-y-3 ${
        required && !satisfied
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Camera className="h-4 w-4 text-primary" />
          {label}
        </div>
        {required && (
          <Badge variant={satisfied ? "secondary" : "destructive"} className="text-xs">
            {satisfied ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> Verified
              </span>
            ) : (
              "Required"
            )}
          </Badge>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <div key={photo.path} className="relative">
              <img
                src={photo.previewUrl}
                alt="Collection screen verification"
                className="h-20 w-20 rounded-md object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo)}
                aria-label="Remove photo"
                className="absolute -top-1.5 -right-1.5 rounded-full bg-background border border-border p-0.5 shadow"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full h-11 gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            {photos.length > 0 ? "Add another photo" : "Take photo"}
          </>
        )}
      </Button>
    </div>
  );
}
