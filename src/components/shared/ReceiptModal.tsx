import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useReceiptViewer } from "@/hooks/useReceiptViewer";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptPath: string | null;
  entryId: string;
  entryDetails?: {
    date: string;
    amount: number;
    category?: string;
    location?: string;
  };
}

export function ReceiptModal({ 
  open, 
  onOpenChange, 
  receiptPath, 
  entryId,
  entryDetails 
}: ReceiptModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { getReceiptUrl, downloadReceipt, loadingReceiptId } = useReceiptViewer();

  useEffect(() => {
    if (open && receiptPath) {
      setIsLoading(true);
      setZoom(1);
      getReceiptUrl(receiptPath).then(url => {
        setImageUrl(url);
        setIsLoading(false);
      });
    } else {
      setImageUrl(null);
    }
  }, [open, receiptPath]);

  const handleDownload = () => {
    if (receiptPath) {
      const filename = entryDetails 
        ? `receipt-${entryDetails.date}-${entryDetails.amount.toFixed(2)}.jpg`
        : undefined;
      downloadReceipt(entryId, receiptPath, filename);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex-1">
            {entryDetails && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  ${entryDetails.amount.toFixed(2)}
                </span>
                {entryDetails.category && (
                  <span> • {entryDetails.category}</span>
                )}
                {entryDetails.location && (
                  <span> • {entryDetails.location}</span>
                )}
                <span className="block mt-0.5">{entryDetails.date}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loadingReceiptId === entryId}
            >
              {loadingReceiptId === entryId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-4 h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Loading receipt...</span>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Receipt"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="text-muted-foreground">
              Failed to load receipt image
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
