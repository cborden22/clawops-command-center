import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useReceiptViewer() {
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  // Extract file path from URL if needed (backwards compatibility)
  const extractFilePath = (receiptPath: string): string => {
    if (receiptPath.includes('/receipts/')) {
      return receiptPath.split('/receipts/').pop() || receiptPath;
    }
    return receiptPath;
  };

  // Generate signed URL for a receipt
  const getReceiptUrl = async (receiptPath: string): Promise<string | null> => {
    try {
      const filePath = extractFilePath(receiptPath);
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) {
        console.error("Error creating signed URL:", error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting receipt URL:", error);
      return null;
    }
  };

  // View receipt - opens in new tab
  const viewReceipt = async (entryId: string, receiptPath: string) => {
    setLoadingReceiptId(entryId);
    try {
      const signedUrl = await getReceiptUrl(receiptPath);
      
      if (!signedUrl) {
        toast({
          title: "Error",
          description: "Failed to load receipt. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      window.open(signedUrl, '_blank');
    } finally {
      setLoadingReceiptId(null);
    }
  };

  // Download receipt
  const downloadReceipt = async (entryId: string, receiptPath: string, filename?: string) => {
    setLoadingReceiptId(entryId);
    try {
      const signedUrl = await getReceiptUrl(receiptPath);
      
      if (!signedUrl) {
        toast({
          title: "Error",
          description: "Failed to download receipt. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch the file and trigger download
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Receipt saved to your device.",
      });
    } finally {
      setLoadingReceiptId(null);
    }
  };

  return { 
    viewReceipt, 
    downloadReceipt, 
    getReceiptUrl, 
    loadingReceiptId,
    isLoading: (id: string) => loadingReceiptId === id
  };
}
