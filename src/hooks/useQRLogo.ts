import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useQRLogo() {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLogoUrl(null);
      setIsLoading(false);
      return;
    }

    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("qr_logo_url")
          .eq("user_id", user.id)
          .single();

        setLogoUrl((data as any)?.qr_logo_url ?? null);
      } catch {
        // No profile row yet — that's fine
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [user]);

  const uploadLogo = async (file: File) => {
    if (!user) return;

    // Validate file
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Logo must be under 2MB.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or SVG image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${user.id}/logo.${ext}`;

      // Upload (upsert to overwrite previous)
      const { error: uploadError } = await supabase.storage
        .from("qr-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("qr-logos")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ qr_logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast({
        title: "Logo Uploaded",
        description: "Your logo will now appear on all QR codes.",
      });
    } catch (error: any) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      // List and delete all files in user's folder
      const { data: files } = await supabase.storage
        .from("qr-logos")
        .list(user.id);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("qr-logos").remove(paths);
      }

      // Clear from profile
      const { error } = await supabase
        .from("profiles")
        .update({ qr_logo_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setLogoUrl(null);
      toast({
        title: "Logo Removed",
        description: "QR codes will no longer include a logo.",
      });
    } catch (error: any) {
      console.error("Logo removal error:", error);
      toast({
        title: "Error",
        description: "Could not remove logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { logoUrl, isLoading, isUploading, uploadLogo, removeLogo };
}
