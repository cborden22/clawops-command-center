import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRevenueEntries } from "@/hooks/useRevenueEntriesDB";
import { useLocations } from "@/hooks/useLocationsDB";
import { toast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

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

  const activeLocations = locations.filter((loc) => loc.isActive);

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
        // addIncome(locationId, amount, notes, date, machineType?)
        await addIncome(locationId || "", parsedAmount, notes || "", date);
        toast({ title: "Income added!", description: `$${amount} recorded.` });
      } else {
        // addExpense(locationId, amount, category, notes, date, receiptUrl?)
        // Convert sentinel value back to empty string for API
        const finalLocationId = locationId === "business-expense" ? "" : locationId;
        await addExpense(finalLocationId, parsedAmount, category || "Other", notes || "", date);
        toast({ title: "Expense added!", description: `$${amount} recorded.` });
      }
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add entry.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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
