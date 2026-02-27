import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface LocationPhoto {
  name: string;
  url: string;
  createdAt: string;
}

export function useLocationPhotos(locationId: string | undefined) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!locationId || !user) return;
    setIsLoading(true);
    try {
      const folder = `${user.id}/${locationId}`;
      const { data, error } = await supabase.storage
        .from("location-photos")
        .list(folder, { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const mapped = (data || [])
        .filter(f => !f.name.startsWith("."))
        .map(f => {
          const { data: urlData } = supabase.storage
            .from("location-photos")
            .getPublicUrl(`${folder}/${f.name}`);
          return {
            name: f.name,
            url: urlData.publicUrl,
            createdAt: f.created_at || "",
          };
        });
      setPhotos(mapped);
    } catch (e) {
      console.error("Error fetching photos:", e);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, user]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!locationId || !user) return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `${user.id}/${locationId}/${fileName}`;
      const { error } = await supabase.storage
        .from("location-photos")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      toast({ title: "Photo Uploaded", description: "Photo has been saved." });
      await fetchPhotos();
    } catch (e: any) {
      console.error("Error uploading photo:", e);
      toast({ title: "Upload Failed", description: e.message || "Failed to upload photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [locationId, user, fetchPhotos]);

  const deletePhoto = useCallback(async (fileName: string) => {
    if (!locationId || !user) return;
    try {
      const path = `${user.id}/${locationId}/${fileName}`;
      const { error } = await supabase.storage
        .from("location-photos")
        .remove([path]);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.name !== fileName));
      toast({ title: "Photo Deleted" });
    } catch (e) {
      console.error("Error deleting photo:", e);
    }
  }, [locationId, user]);

  return { photos, isLoading, isUploading, fetchPhotos, uploadPhoto, deletePhoto };
}
