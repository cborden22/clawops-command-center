import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Eye, Download, Loader2, Receipt, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { useRevenueEntries, RevenueEntry } from "@/hooks/useRevenueEntriesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useReceiptViewer } from "@/hooks/useReceiptViewer";
import { ReceiptModal } from "@/components/shared/ReceiptModal";
import { useNavigate } from "react-router-dom";

export function MobileReceiptList() {
  const navigate = useNavigate();
  const { entries, isLoaded } = useRevenueEntries();
  const { getLocationById } = useLocations();
  const { viewReceipt, downloadReceipt, loadingReceiptId } = useReceiptViewer();
  
  const [selectedReceipt, setSelectedReceipt] = useState<{
    path: string;
    entryId: string;
    details: {
      date: string;
      amount: number;
      category?: string;
      location?: string;
    };
  } | null>(null);

  // Filter entries that have receipts
  const entriesWithReceipts = entries.filter(e => e.receiptUrl);

  const getLocationName = (locationId: string) => {
    if (!locationId) return "Business Expense";
    return getLocationById(locationId)?.name || "Unknown";
  };

  const handleViewReceipt = (entry: RevenueEntry) => {
    if (!entry.receiptUrl) return;
    
    setSelectedReceipt({
      path: entry.receiptUrl,
      entryId: entry.id,
      details: {
        date: format(entry.date, "MMM d, yyyy"),
        amount: entry.amount,
        category: entry.category,
        location: getLocationName(entry.locationId),
      },
    });
  };

  const handleDownload = (entry: RevenueEntry) => {
    if (!entry.receiptUrl) return;
    
    const filename = `receipt-${format(entry.date, "yyyy-MM-dd")}-${entry.amount.toFixed(2)}.jpg`;
    downloadReceipt(entry.id, entry.receiptUrl, filename);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Your Receipts
            </h1>
            <p className="text-xs text-muted-foreground">
              {entriesWithReceipts.length} receipt{entriesWithReceipts.length !== 1 ? 's' : ''} attached
            </p>
          </div>
        </div>
      </div>

      {/* Receipt List */}
      <div className="p-4 space-y-3">
        {entriesWithReceipts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Paperclip className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Receipts Yet</h3>
              <p className="text-sm text-muted-foreground">
                Attach receipts when logging expenses to see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          entriesWithReceipts.map(entry => (
            <Card key={entry.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Receipt icon/thumbnail placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          ${entry.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getLocationName(entry.locationId)}
                        </p>
                      </div>
                      {entry.category && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {entry.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(entry.date, "MMM d, yyyy")}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(entry)}
                        disabled={loadingReceiptId === entry.id}
                        className="flex-1"
                      >
                        {loadingReceiptId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(entry)}
                        disabled={loadingReceiptId === entry.id}
                        className="flex-1"
                      >
                        {loadingReceiptId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">Save</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        receiptPath={selectedReceipt?.path || null}
        entryId={selectedReceipt?.entryId || ""}
        entryDetails={selectedReceipt?.details}
      />
    </div>
  );
}
