import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMachineCollections } from "@/hooks/useMachineCollections";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Camera, ImageIcon, X, Target, Coins, DollarSign } from "lucide-react";

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
  const { addCollection, calculateCollectionWinRate, formatWinRate, formatOdds, compareToExpected } = useMachineCollections();
  const { user } = useAuth();
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

  // Collection metrics state
  const [machineId, setMachineId] = useState("");
  const [coinsInserted, setCoinsInserted] = useState("");
  const [prizesWon, setPrizesWon] = useState("");
  
  // Input mode for income: "coins" or "dollars"
  const [inputMode, setInputMode] = useState<"coins" | "dollars">("dollars");

  const activeLocations = locations.filter((loc) => loc.isActive);

  // Get machines for selected location
  const selectedLocationData = locationId && locationId !== "business-expense"
    ? locations.find(loc => loc.id === locationId)
    : null;
  const locationMachines = selectedLocationData?.machines || [];

  // Get selected machine data
  const selectedMachineData = machineId
    ? locationMachines.find(m => m.id === machineId)
    : null;

  // Get cost per play from selected machine (default to 0.50)
  const costPerPlay = selectedMachineData?.costPerPlay ?? 0.50;
  
  // Calculate amount from coins when in coins mode
  const calculatedAmount = inputMode === "coins" && coinsInserted 
    ? (parseInt(coinsInserted) || 0) * costPerPlay 
    : null;

  // Calculate current collection win rate
  const currentStats = (coinsInserted && prizesWon)
    ? calculateCollectionWinRate(parseInt(coinsInserted) || 0, parseInt(prizesWon) || 0)
    : null;

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error("User not authenticated for receipt upload");
      return null;
    }
    
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

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
    // For coins mode, use calculated amount; for dollars mode, use entered amount
    const finalAmount = type === "income" && inputMode === "coins" && calculatedAmount !== null
      ? calculatedAmount
      : parseFloat(amount);
      
    if (!finalAmount || finalAmount <= 0) {
      toast({ title: "Enter amount", description: inputMode === "coins" ? "Please enter coins inserted." : "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const date = new Date();

      if (type === "income") {
        await addIncome(locationId || "", finalAmount, notes || "", date);
        
        // Add collection metrics if machine is selected
        if (machineId && selectedMachineData && (coinsInserted || prizesWon)) {
          await addCollection({
            locationId: locationId,
            machineId: machineId,
            collectionDate: date,
            coinsInserted: parseInt(coinsInserted) || 0,
            prizesWon: parseInt(prizesWon) || 0,
          });
        }
        
        toast({ title: "Income added!", description: `$${finalAmount.toFixed(2)} recorded.` });
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
        await addExpense(finalLocationId, parseFloat(amount), category || "Other", notes || "", date, receiptUrl);
        toast({ title: "Expense added!", description: `$${parseFloat(amount).toFixed(2)} recorded.` });
      }
      
      // Reset form
      setAmount("");
      setLocationId("");
      setCategory("");
      setNotes("");
      setReceiptFile(null);
      setMachineId("");
      setCoinsInserted("");
      setPrizesWon("");
      setInputMode("dollars");
      setPrizesWon("");
      
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

      {/* Amount Entry - Different modes for income with machine selected */}
      {type === "income" && machineId && selectedMachineData ? (
        <div className="space-y-3">
          {/* Input Mode Toggle */}
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "coins" | "dollars")} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-10">
              <TabsTrigger value="coins" className="h-8 text-sm gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                Enter Coins
              </TabsTrigger>
              <TabsTrigger value="dollars" className="h-8 text-sm gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Enter Dollars
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {inputMode === "coins" ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Coins Inserted</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={coinsInserted}
                onChange={(e) => setCoinsInserted(e.target.value)}
                className="h-14 text-2xl font-semibold text-center"
                onFocus={(e) => e.target.select()}
              />
              {calculatedAmount !== null && calculatedAmount > 0 && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost per play: ${costPerPlay.toFixed(2)}</span>
                    <span className="text-lg font-bold text-primary">${calculatedAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      ) : (
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
      )}

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location {type === "expense" && "(Optional)"}</Label>
        <Select value={locationId} onValueChange={(v) => { setLocationId(v); setMachineId(""); }}>
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

      {/* Machine Selector (income only, when location has machines) */}
      {type === "income" && locationMachines.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Machine (Optional)</Label>
          <Select value={machineId} onValueChange={setMachineId}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select machine for metrics" />
            </SelectTrigger>
            <SelectContent>
              {locationMachines.map((m) => (
                <SelectItem key={m.id} value={m.id || ""}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Collection Metrics Section (when machine is selected and in dollars mode) */}
      {type === "income" && machineId && selectedMachineData && inputMode === "dollars" && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Collection Metrics (Optional)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Coins Inserted</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={coinsInserted}
                onChange={(e) => setCoinsInserted(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prizes Won</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={prizesWon}
                onChange={(e) => setPrizesWon(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-11"
              />
            </div>
          </div>
          
          {/* Live Win Rate Display */}
          {currentStats && currentStats.winRate > 0 && (
            <div className="text-sm bg-background/50 p-2 rounded">
              <span className="font-medium">
                Win Rate: {formatWinRate(currentStats.winRate)} ({formatOdds(currentStats.odds)})
              </span>
              {selectedMachineData.winProbability && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: 1 in {selectedMachineData.winProbability} — {compareToExpected(currentStats.winRate, selectedMachineData.winProbability).message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Prizes Won (only in coins mode) */}
      {type === "income" && machineId && selectedMachineData && inputMode === "coins" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Prizes Won (Optional)</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={prizesWon}
            onChange={(e) => setPrizesWon(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="h-12"
          />
          
          {/* Live Win Rate Display */}
          {currentStats && currentStats.winRate > 0 && (
            <div className="text-sm bg-muted/30 p-2 rounded border">
              <span className="font-medium">
                Win Rate: {formatWinRate(currentStats.winRate)} ({formatOdds(currentStats.odds)})
              </span>
              {selectedMachineData.winProbability && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: 1 in {selectedMachineData.winProbability} — {compareToExpected(currentStats.winRate, selectedMachineData.winProbability).message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
        disabled={isSubmitting || (type === "income" && inputMode === "coins" ? !coinsInserted : !amount)}
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
