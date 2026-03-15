import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { useMachineCollections } from "@/hooks/useMachineCollections";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Camera, ImageIcon, X, Coins, CalendarRange, RefreshCw } from "lucide-react";
import { format, differenceInDays, addDays, addMonths, addYears } from "date-fns";

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
  const { addEntry, addExpense } = useRevenueEntries();
  const { locations } = useLocations();
  const { addCollection, calculateCollectionWinRate, formatWinRate, formatOdds, formatPlays, compareToExpected, QUARTER_VALUE } = useMachineCollections();
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
  const [spreadRevenue, setSpreadRevenue] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [bagLabel, setBagLabel] = useState("");
  
  // No longer need inputMode - coins is always primary when machine selected

  const activeLocations = locations.filter((loc) => loc.isActive);

  // Get machines for selected location
  const selectedLocationData = locationId && locationId !== "business-expense"
    ? locations.find(loc => loc.id === locationId)
    : null;
  const selectedLocationLastCollection = selectedLocationData?.lastCollectionDate 
    ? new Date(selectedLocationData.lastCollectionDate) 
    : null;
  const locationMachines = selectedLocationData?.machines || [];

  // Get selected machine data (includes costPerPlay)
  const selectedMachineData = machineId
    ? locationMachines.find(m => m.id === machineId)
    : null;
  
  // Get cost per play from selected machine (defaults to $0.50)
  const costPerPlay = selectedMachineData?.costPerPlay || 0.50;

  // Calculate dollar amount from quarters (coins = quarters)
  const calculatedAmount = coinsInserted 
    ? (parseInt(coinsInserted) || 0) * QUARTER_VALUE 
    : null;
    
  // Calculate total plays based on cost per play
  const totalPlays = calculatedAmount !== null && costPerPlay > 0
    ? calculatedAmount / costPerPlay
    : 0;

  // Calculate TRUE win rate for current collection input (using costPerPlay)
  const currentStats = (coinsInserted && prizesWon && selectedMachineData)
    ? calculateCollectionWinRate(parseInt(coinsInserted) || 0, parseInt(prizesWon) || 0, costPerPlay)
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
    // When machine is selected, use calculated amount from coins; otherwise use entered amount
    const finalAmount = type === "income" && machineId && calculatedAmount !== null
      ? calculatedAmount
      : parseFloat(amount);
      
    if (!finalAmount || finalAmount <= 0) {
      toast({ title: "Enter amount", description: type === "income" && machineId ? "Please enter coins inserted." : "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const date = new Date();

      if (type === "income") {
        // Calculate service period
        let servicePeriodStart: Date | undefined;
        let servicePeriodEnd: Date | undefined;
        if (spreadRevenue && locationId) {
          servicePeriodEnd = date;
          servicePeriodStart = selectedLocationLastCollection && selectedLocationLastCollection < date
            ? selectedLocationLastCollection
            : date;
        }
        
        await addEntry({
          type: "income",
          locationId: locationId || "",
          amount: finalAmount,
          notes: notes || "",
          date,
          servicePeriodStart,
          servicePeriodEnd,
        });
        
        // Add collection metrics if machine is selected
        if (machineId && selectedMachineData && (coinsInserted || prizesWon)) {
          await addCollection({
            locationId: locationId,
            machineId: machineId,
            collectionDate: date,
            coinsInserted: parseInt(coinsInserted) || 0,
            prizesWon: parseInt(prizesWon) || 0,
            bagLabel: bagLabel.trim() || undefined,
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
      
      // Create recurring_revenue record if recurring checkbox is checked
      if (isRecurring && user) {
        const finalAmt = type === "income" && machineId && calculatedAmount !== null ? calculatedAmount : parseFloat(amount);
        const getNextDate = (d: Date, freq: string): string => {
          if (freq === "weekly") return format(addDays(d, 7), "yyyy-MM-dd");
          if (freq === "biweekly") return format(addDays(d, 14), "yyyy-MM-dd");
          if (freq === "yearly") return format(addYears(d, 1), "yyyy-MM-dd");
          return format(addMonths(d, 1), "yyyy-MM-dd");
        };
        const finalLocationId = locationId === "business-expense" ? null : (locationId || null);
        await supabase.from("recurring_revenue").insert({
          user_id: user.id,
          location_id: finalLocationId,
          amount: finalAmt,
          frequency: recurringFrequency,
          category: type === "expense" ? (category || "Other") : "Flat Fee",
          next_due_date: getNextDate(date, recurringFrequency),
          is_active: true,
          notes: notes.trim() || null,
        });
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
      setIsRecurring(false);
      setBagLabel("");
      
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

      {/* Amount Entry - Coins when machine selected, dollars otherwise */}
      {type === "income" && machineId && selectedMachineData ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Coins Inserted
            </Label>
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
                  <span className="text-sm text-muted-foreground">{coinsInserted} coins = {formatPlays(totalPlays)} plays</span>
                  <span className="text-lg font-bold text-primary">${calculatedAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${costPerPlay.toFixed(2)} per play
                </p>
              </div>
            )}
          </div>
          
          {/* Prizes Won */}
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
          </div>

          {/* Bag / Tag Label */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bag / Tag (Optional)</Label>
            <Input
              placeholder="e.g. Red #1, Bag 3"
              value={bagLabel}
              onChange={(e) => setBagLabel(e.target.value)}
              className="h-12"
            />
          </div>
          
          {/* Live TRUE Win Rate Display */}
          {currentStats && currentStats.trueWinRate > 0 && (
            <div className="text-sm bg-muted/30 p-2 rounded border">
              <span className="font-medium">
                True Win Rate: {formatWinRate(currentStats.trueWinRate)} ({formatOdds(currentStats.trueOdds)})
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatPlays(currentStats.totalPlays)} plays → {prizesWon} prizes
              </p>
              {selectedMachineData.winProbability && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: 1 in {selectedMachineData.winProbability} — {compareToExpected(currentStats.trueWinRate, selectedMachineData.winProbability).message}
                </p>
              )}
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

      {/* Collection Metrics removed - coins entry is now integrated above when machine selected */}

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

      {/* Spread Revenue Toggle - Income only */}
      {type === "income" && locationId && locationId !== "business-expense" && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Spread across service period</span>
            </div>
            <Switch
              checked={spreadRevenue}
              onCheckedChange={setSpreadRevenue}
            />
          </div>
          {spreadRevenue && (
            <p className="text-xs text-muted-foreground">
              {selectedLocationLastCollection 
                ? `Revenue spread from ${format(selectedLocationLastCollection, "MMM d")} to today (${Math.max(1, differenceInDays(new Date(), selectedLocationLastCollection))} days)`
                : "No previous collection — assigned to today only"}
            </p>
          )}
        </div>
      )}

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

      {/* Recurring Checkbox */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="recurring-mobile"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked === true)}
          />
          <label htmlFor="recurring-mobile" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            Make this recurring
          </label>
        </div>
        {isRecurring && (
          <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Biweekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (type === "income" && machineId ? !coinsInserted : !amount)}
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
