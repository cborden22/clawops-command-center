import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Camera, ImageIcon, X } from "lucide-react";

interface QuickRevenueFormProps {
  onSuccess: () => void;
}

const expenseCategories = [
  "Prizes",
  "Maintenance",
  "Supplies",
  "Commission Payout",
  "Travel",
  "Rent",
  "Utilities",
  "Insurance",
  "Marketing",
  "Other",
];

export function QuickRevenueForm({ onSuccess }: QuickRevenueFormProps) {
  const { addIncome, addExpense } = useRevenueEntries();
  const { locations } = useLocations();
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [locationId, setLocationId] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const activeLocations = locations.filter((loc) => loc.isActive);

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);

      if (error) throw error;
      return filePath;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Enter amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      const date = new Date();

      if (type === "income") {
        await addIncome(locationId || "", parsedAmount, notes || "", date);
        toast({ title: "Income added!", description: `$${amount} recorded.` });
      } else {
        // Upload receipt if present
        let receiptUrl: string | undefined;
        if (receiptFile) {
          setIsUploadingReceipt(true);
          const uploadedPath = await uploadReceipt(receiptFile);
          if (uploadedPath) {
            receiptUrl = uploadedPath;
          }
          setIsUploadingReceipt(false);
        }

        // Convert sentinel value back to empty string for API
        const finalLocationId = locationId === "business-expense" ? "" : locationId;
        await addExpense(finalLocationId, parsedAmount, category || "Other", notes || "", date, receiptUrl);
        toast({ title: "Expense added!", description: `$${amount} recorded.` });
      }
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add entry.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsUploadingReceipt(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Type Toggle */}
      <Tabs value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
        <TabsList className="grid grid-cols-2 w-full h-12">
          <TabsTrigger value="income" className="h-10 text-base gap-2">
            <TrendingUp className="h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expense" className="h-10 text-base gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 h-14 text-2xl font-semibold"
            onFocus={(e) => e.target.select()}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location {type === "expense" && "(Optional)"}</Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder={type === "expense" ? "Business Expense" : "Select location"} />
          </SelectTrigger>
          <SelectContent>
            {type === "expense" && <SelectItem value="business-expense">Business Expense</SelectItem>}
            {activeLocations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category (expense only) */}
      {type === "expense" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes (Optional)</Label>
        <Textarea
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Receipt Section (Expense only) */}
      {type === "expense" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Receipt (Optional)</Label>
          
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {receiptFile ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{receiptFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => setReceiptFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !amount}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>Add {type === "income" ? "Income" : "Expense"}</>
        )}
      </Button>
    </div>
  );
}
