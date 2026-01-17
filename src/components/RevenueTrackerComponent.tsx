import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, 
  MapPin, Sparkles, AlertCircle, ArrowUpCircle, ArrowDownCircle, Wallet,
  Download, Building2, Paperclip, FileImage, X, ExternalLink, Receipt, Eye, Loader2, Coins
} from "lucide-react";
import { 
  format, subDays, startOfMonth, endOfMonth, isWithinInterval, 
  startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters
} from "date-fns";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "@/hooks/use-toast";
import { useLocations, MACHINE_TYPE_OPTIONS } from "@/hooks/useLocationsDB";
import { useRevenueEntries, EntryType } from "@/hooks/useRevenueEntriesDB";
import { useMachineCollections } from "@/hooks/useMachineCollections";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReceiptViewer } from "@/hooks/useReceiptViewer";
import { ReceiptModal } from "@/components/shared/ReceiptModal";

type FilterPeriod = 
  | "past7days" 
  | "lastWeek" 
  | "thisWeek" 
  | "lastMonth" 
  | "thisMonth" 
  | "lastQuarter"
  | "thisQuarter"
  | "lastYear" 
  | "thisYear" 
  | "custom" 
  | "all";

// Location-specific expense categories
const LOCATION_EXPENSE_CATEGORIES = [
  "Prize Restock",
  "Maintenance",
  "Commission Payout",
  "Supplies",
  "Transportation",
  "Other",
];

// Business-wide expense categories (not tied to a location)
const BUSINESS_EXPENSE_CATEGORIES = [
  "Software/Subscriptions",
  "Insurance",
  "Vehicle Costs",
  "Office Supplies",
  "Equipment Purchase",
  "Business License/Fees",
  "Marketing",
  "Professional Services",
  "Other Business Expense",
];

export function RevenueTrackerComponent() {
  const { user } = useAuth();
  const { activeLocations, getLocationById, isLoaded } = useLocations();
  const { entries, addEntry, deleteEntry, isLoaded: entriesLoaded } = useRevenueEntries();
  const { addCollection, calculateCollectionWinRate, formatWinRate, formatOdds, compareToExpected } = useMachineCollections();
  
  // Form state
  const [entryType, setEntryType] = useState<EntryType>("income");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isBusinessExpense, setIsBusinessExpense] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptsDialogOpen, setReceiptsDialogOpen] = useState(false);
  
  // Collection metrics state (for income entries)
  const [coinsInserted, setCoinsInserted] = useState("");
  const [prizesWon, setPrizesWon] = useState("");
  const [inputMode, setInputMode] = useState<"coins" | "dollars">("dollars");
  
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<{
    path: string;
    entryId: string;
    details: { date: string; amount: number; category?: string; location?: string };
  } | null>(null);
  
  // Use shared receipt viewer hook
  const { viewReceipt, downloadReceipt, loadingReceiptId } = useReceiptViewer();
  
  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("thisMonth");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | EntryType | "business">("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Get expense categories based on whether it's a business expense or location expense
  const expenseCategories = isBusinessExpense ? BUSINESS_EXPENSE_CATEGORIES : LOCATION_EXPENSE_CATEGORIES;

  // Get machines for selected location
  const selectedLocationData = selectedLocation ? getLocationById(selectedLocation) : null;
  const locationMachines = selectedLocationData?.machines || [];
  
  // Get selected machine data for win rate comparison
  const selectedMachineData = selectedMachine !== "all" 
    ? locationMachines.find(m => m.type === selectedMachine) 
    : null;
  
  // Get cost per play from selected machine (default to 0.50)
  const costPerPlay = selectedMachineData?.costPerPlay ?? 0.50;
  
  // Calculate amount from coins when in coins mode
  const calculatedAmount = inputMode === "coins" && coinsInserted 
    ? (parseInt(coinsInserted) || 0) * costPerPlay 
    : null;
  
  // Calculate win rate for current collection input
  const currentCollectionStats = coinsInserted && prizesWon 
    ? calculateCollectionWinRate(parseInt(coinsInserted) || 0, parseInt(prizesWon) || 0)
    : null;

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error("Receipt upload error:", uploadError);
      throw uploadError;
    }
    
    // Return just the file path, not a public URL (bucket is private)
    return filePath;
  };

  // Generate a signed URL for viewing a receipt (handles both old full URLs and new paths)
  const handleViewReceipt = async (entryId: string, receiptPath: string) => {
    viewReceipt(entryId, receiptPath);
  };
  
  // Get entries with receipts for the gallery
  const entriesWithReceipts = entries.filter(e => e.receiptUrl);
  
  // Open receipt in modal with details
  const openReceiptModal = (entry: typeof entries[0]) => {
    if (!entry.receiptUrl) return;
    setSelectedReceiptModal({
      path: entry.receiptUrl,
      entryId: entry.id,
      details: {
        date: format(entry.date, "MMM d, yyyy"),
        amount: entry.amount,
        category: entry.category,
        location: entry.locationId ? getLocationById(entry.locationId)?.name : "Business Expense",
      },
    });
  };

  const handleAddEntry = async () => {
    // For coins mode, use calculated amount; for dollars mode, use entered amount
    const finalAmount = entryType === "income" && inputMode === "coins" && calculatedAmount !== null
      ? calculatedAmount
      : parseFloat(amount);
      
    // For income, require location; for expense, allow business-level (no location)
    if (entryType === "income" && !selectedLocation) return;
    if (entryType === "income" && inputMode === "coins" ? !coinsInserted : !amount) return;
    if (entryType === "expense" && !category) return;

    const locationId = isBusinessExpense ? "" : selectedLocation;
    
    let receiptUrl: string | undefined;
    
    // Upload receipt if present (only for expenses)
    if (receiptFile && entryType === "expense") {
      setIsUploadingReceipt(true);
      try {
        receiptUrl = (await uploadReceipt(receiptFile)) || undefined;
      } catch (error) {
        toast({ 
          title: "Receipt Upload Failed", 
          description: "Entry will be saved without receipt.",
          variant: "destructive" 
        });
      }
      setIsUploadingReceipt(false);
    }
    
    const newEntry = await addEntry({
      type: entryType,
      locationId,
      machineType: selectedMachine !== "all" ? selectedMachine : undefined,
      date: entryDate,
      amount: finalAmount,
      category: entryType === "expense" ? category : undefined,
      notes: notes.trim(),
      receiptUrl,
    });
    
    // Save collection metrics if income entry with machine and metrics provided
    if (entryType === "income" && selectedMachine !== "all" && selectedMachineData?.id && (coinsInserted || prizesWon)) {
      await addCollection({
        locationId: selectedLocation,
        machineId: selectedMachineData.id,
        revenueEntryId: newEntry?.id,
        collectionDate: entryDate,
        coinsInserted: parseInt(coinsInserted) || 0,
        prizesWon: parseInt(prizesWon) || 0,
      });
    }
    
    setAmount("");
    setNotes("");
    setCategory("");
    setSelectedMachine("all");
    setReceiptFile(null);
    setCoinsInserted("");
    setPrizesWon("");
    setInputMode("dollars");
    
    const loc = locationId ? getLocationById(locationId) : null;
    toast({ 
      title: entryType === "income" ? "Income Logged" : "Expense Logged",
      description: `$${parseFloat(amount).toFixed(2)} ${entryType} recorded${loc ? ` for ${loc.name}` : " as business expense"}` 
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    toast({ title: "Entry Removed" });
  };

  // Export filtered entries to CSV
  const handleExport = () => {
    const dataToExport = filteredEntries;
    if (dataToExport.length === 0) {
      toast({ title: "No Data", description: "No entries to export for the selected filters.", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Type", "Location", "Machine Type", "Amount", "Category", "Notes"];
    const csvRows = [headers.join(",")];

    dataToExport.forEach(entry => {
      const locationName = entry.locationId ? getLocationName(entry.locationId) : "Business Expense";
      const machineType = entry.machineType ? getMachineLabel(entry.machineType) : "";
      const row = [
        format(entry.date, "yyyy-MM-dd"),
        entry.type,
        `"${locationName.replace(/"/g, '""')}"`,
        `"${machineType.replace(/"/g, '""')}"`,
        entry.amount.toFixed(2),
        entry.category || "",
        `"${(entry.notes || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const range = getDateRange(filterPeriod);
    const startStr = range ? format(range.start, "yyyy-MM-dd") : "all";
    const endStr = range ? format(range.end, "yyyy-MM-dd") : "time";
    link.href = url;
    link.download = `revenue-export-${startStr}-to-${endStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: `Exported ${dataToExport.length} entries to CSV.` });
  };

  const getDateRange = (period: FilterPeriod): { start: Date; end: Date } | null => {
    const now = new Date();
    
    switch (period) {
      case "past7days":
        return { start: subDays(now, 7), end: now };
      case "lastWeek":
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
        return { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), end: lastWeekEnd };
      case "thisWeek":
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "lastQuarter":
        const lastQ = subQuarters(now, 1);
        return { start: startOfQuarter(lastQ), end: endOfQuarter(lastQ) };
      case "thisQuarter":
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case "lastYear":
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case "thisYear":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        return null;
      case "all":
      default:
        return null;
    }
  };

  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    if (filterLocation === "business") {
      // Show only business expenses (no location)
      filtered = filtered.filter(e => !e.locationId);
    } else if (filterLocation !== "all") {
      filtered = filtered.filter(e => e.locationId === filterLocation);
    }
    
    if (filterType === "business") {
      // Filter for business expenses only
      filtered = filtered.filter(e => e.type === "expense" && !e.locationId);
    } else if (filterType !== "all") {
      filtered = filtered.filter(e => e.type === filterType);
    }
    
    const range = getDateRange(filterPeriod);
    if (range) {
      filtered = filtered.filter(e => isWithinInterval(e.date, { start: range.start, end: range.end }));
    }
    
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const filteredEntries = getFilteredEntries();
  const totalIncome = filteredEntries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = filteredEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const incomeEntries = filteredEntries.filter(e => e.type === "income");
  const avgPerCollection = incomeEntries.length > 0 ? totalIncome / incomeEntries.length : 0;

  const chartData = filteredEntries
    .reduce((acc: { date: string; income: number; expenses: number }[], entry) => {
      const dateStr = format(entry.date, "MM/dd");
      const existing = acc.find(d => d.date === dateStr);
      if (existing) {
        if (entry.type === "income") existing.income += entry.amount;
        else existing.expenses += entry.amount;
      } else {
        acc.push({ 
          date: dateStr, 
          income: entry.type === "income" ? entry.amount : 0,
          expenses: entry.type === "expense" ? entry.amount : 0
        });
      }
      return acc;
    }, [])
    .reverse()
    .slice(-14);

  const locationPerformance = activeLocations.map(loc => {
    const locEntries = filteredEntries.filter(e => e.locationId === loc.id);
    const income = locEntries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
    const expenses = locEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
    // Truncate long names for chart display
    const truncatedName = loc.name.length > 15 ? loc.name.substring(0, 12) + "..." : loc.name;
    return { name: truncatedName, fullName: loc.name, income, expenses, net: income - expenses };
  }).sort((a, b) => b.net - a.net).slice(0, 8); // Limit to top 8 locations

  const getLocationName = (id: string) => getLocationById(id)?.name || "Unknown";
  const getMachineLabel = (type: string) => MACHINE_TYPE_OPTIONS.find(m => m.value === type)?.label || type;
  
  // Calculate business expenses total
  const businessExpenses = filteredEntries.filter(e => e.type === "expense" && !e.locationId);
  const totalBusinessExpenses = businessExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (!isLoaded || !entriesLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ArrowUpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">${totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ArrowDownCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className={cn(
                "p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
                netProfit >= 0 ? "bg-gradient-to-br from-primary to-primary/80" : "bg-gradient-to-br from-orange-500 to-orange-600"
              )}>
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className={cn(
                  "text-2xl font-bold tracking-tight",
                  netProfit >= 0 ? "text-foreground" : "text-orange-500"
                )}>
                  {netProfit < 0 ? "-" : ""}${Math.abs(netProfit).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Collection</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">${avgPerCollection.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entry Form */}
        <div className="space-y-6">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Log Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {activeLocations.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No locations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Add locations in the Location Tracker first</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/locations">Go to Locations</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Entry Type Toggle */}
                  <Tabs value={entryType} onValueChange={(v) => setEntryType(v as EntryType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="income" className="gap-2">
                        <ArrowUpCircle className="h-4 w-4" />
                        Income
                      </TabsTrigger>
                      <TabsTrigger value="expense" className="gap-2">
                        <ArrowDownCircle className="h-4 w-4" />
                        Expense
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Business Expense Toggle - Only for expenses */}
                  {entryType === "expense" && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Business Expense</span>
                      </div>
                      <Button
                        type="button"
                        variant={isBusinessExpense ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsBusinessExpense(!isBusinessExpense);
                          setCategory(""); // Reset category when toggling
                          if (!isBusinessExpense) {
                            setSelectedLocation("");
                            setSelectedMachine("all");
                          }
                        }}
                      >
                        {isBusinessExpense ? "Yes" : "No"}
                      </Button>
                    </div>
                  )}

                  {/* Location Select - Hide for business expenses */}
                  {(!isBusinessExpense || entryType === "income") && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Location</Label>
                      <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setSelectedMachine("all"); }}>
                        <SelectTrigger className="h-11 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>
                              <span className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {loc.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Input Mode Toggle & Amount Entry - Show coins option when machine is selected */}
                  {entryType === "income" && selectedMachine !== "all" && selectedMachineData ? (
                    <div className="space-y-3">
                      {/* Input Mode Toggle */}
                      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "coins" | "dollars")} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full h-9">
                          <TabsTrigger value="coins" className="h-7 text-sm gap-1.5">
                            <Coins className="h-3.5 w-3.5" />
                            Enter Coins
                          </TabsTrigger>
                          <TabsTrigger value="dollars" className="h-7 text-sm gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Enter Dollars
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      {inputMode === "coins" ? (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Coins Inserted</Label>
                          <NumberInput
                            min="0"
                            value={coinsInserted}
                            onChange={(e) => setCoinsInserted(e.target.value)}
                            placeholder="0"
                            className="h-11 text-lg font-semibold text-center bg-background/50"
                          />
                          {calculatedAmount !== null && calculatedAmount > 0 && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cost per play: ${costPerPlay.toFixed(2)}</span>
                                <span className="text-lg font-bold text-primary">${calculatedAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Prizes Won in coins mode */}
                          <div className="space-y-1 pt-2">
                            <Label className="text-xs text-muted-foreground">Prizes Won (optional)</Label>
                            <NumberInput
                              min="0"
                              value={prizesWon}
                              onChange={(e) => setPrizesWon(e.target.value)}
                              placeholder="0"
                              className="h-10 bg-background/50"
                            />
                          </div>
                          
                          {currentCollectionStats && currentCollectionStats.winRate > 0 && (
                            <div className="text-xs space-y-1 pt-1">
                              <p className="text-muted-foreground">
                                Win Rate: <span className="font-medium text-foreground">{formatOdds(currentCollectionStats.odds)} ({formatWinRate(currentCollectionStats.winRate)})</span>
                              </p>
                              {selectedMachineData.winProbability && (
                                <p className={cn(
                                  "font-medium",
                                  compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).status === "over" ? "text-orange-500" :
                                  compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).status === "under" ? "text-green-500" :
                                  "text-muted-foreground"
                                )}>
                                  Expected: 1 in {selectedMachineData.winProbability} • {compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Amount</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <NumberInput
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-9 h-11 bg-background/50 hover:bg-background transition-colors"
                              />
                            </div>
                          </div>
                          
                          {/* Collection Metrics in dollars mode */}
                          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Collection Metrics (Optional)
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Coins Inserted</Label>
                                <NumberInput
                                  min="0"
                                  value={coinsInserted}
                                  onChange={(e) => setCoinsInserted(e.target.value)}
                                  placeholder="0"
                                  className="h-10 bg-background/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Prizes Won</Label>
                                <NumberInput
                                  min="0"
                                  value={prizesWon}
                                  onChange={(e) => setPrizesWon(e.target.value)}
                                  placeholder="0"
                                  className="h-10 bg-background/50"
                                />
                              </div>
                            </div>
                            {currentCollectionStats && currentCollectionStats.winRate > 0 && (
                              <div className="text-xs space-y-1 pt-1">
                                <p className="text-muted-foreground">
                                  This Collection: <span className="font-medium text-foreground">{formatOdds(currentCollectionStats.odds)} ({formatWinRate(currentCollectionStats.winRate)})</span>
                                </p>
                                {selectedMachineData.winProbability && (
                                  <p className={cn(
                                    "font-medium",
                                    compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).status === "over" ? "text-orange-500" :
                                    compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).status === "under" ? "text-green-500" :
                                    "text-muted-foreground"
                                  )}>
                                    Expected: 1 in {selectedMachineData.winProbability} • {compareToExpected(currentCollectionStats.winRate, selectedMachineData.winProbability).message}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Machine Type (optional) - Hide for business expenses */}
                  {locationMachines.length > 0 && !isBusinessExpense && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Machine (optional)</Label>
                      <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="h-11 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="All machines" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Machines</SelectItem>
                          {locationMachines.map(m => (
                            <SelectItem key={m.type} value={m.type}>
                              {m.label} ({m.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-11 bg-background/50 hover:bg-background">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(entryDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={entryDate}
                          onSelect={(date) => date && setEntryDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Expense Category - Dynamic based on business expense toggle */}
                  {entryType === "expense" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-11 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {(entryType === "expense" || selectedMachine === "all" || !selectedMachineData) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <NumberInput
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-9 h-11 bg-background/50 hover:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Notes (optional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={entryType === "income" ? "e.g., Weekend collection" : "e.g., New prizes for claw"}
                      className="h-11 bg-background/50 hover:bg-background transition-colors"
                    />
                  </div>

                  {/* Receipt Upload - Only for expenses */}
                  {entryType === "expense" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Receipt (optional)</Label>
                      {receiptFile ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <FileImage className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">{receiptFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setReceiptFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed border-border hover:bg-muted/50 transition-colors cursor-pointer">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Attach receipt image or PDF</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setReceiptFile(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddEntry}
                    className={cn(
                      "w-full h-11",
                      entryType === "income" 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-red-600 hover:bg-red-700 text-white"
                    )}
                    disabled={
                      isUploadingReceipt ||
                      (entryType === "income" && inputMode === "coins" ? !coinsInserted : !amount) || 
                      (entryType === "income" && !selectedLocation) ||
                      (entryType === "expense" && !category) ||
                      (entryType === "expense" && !isBusinessExpense && !selectedLocation)
                    }
                  >
                    {isUploadingReceipt ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add {entryType === "income" ? "Income" : isBusinessExpense ? "Business Expense" : "Expense"}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card className="glass-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
              <div className="flex items-center gap-2">
                {entriesWithReceipts.length > 0 && (
                  <Dialog open={receiptsDialogOpen} onOpenChange={setReceiptsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Receipt className="h-4 w-4" />
                        Receipts ({entriesWithReceipts.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          All Receipts
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                          {entriesWithReceipts.map(entry => (
                            <div 
                              key={entry.id} 
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setReceiptsDialogOpen(false);
                                openReceiptModal(entry);
                              }}
                            >
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">${entry.amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {entry.locationId ? getLocationById(entry.locationId)?.name : "Business Expense"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(entry.date, "MMM d, yyyy")}
                                </p>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Time Period</Label>
                  <Select value={filterPeriod} onValueChange={(v: FilterPeriod) => setFilterPeriod(v)}>
                    <SelectTrigger className="h-10 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="past7days">Past 7 Days</SelectItem>
                      <SelectItem value="lastWeek">Last Week</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                      <SelectItem value="thisQuarter">This Quarter</SelectItem>
                      <SelectItem value="lastYear">Last Year</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Location</Label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="h-10 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="business">Business Expenses Only</SelectItem>
                      {activeLocations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Type</Label>
                  <Select value={filterType} onValueChange={(v: "all" | EntryType | "business") => setFilterType(v)}>
                    <SelectTrigger className="h-10 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income Only</SelectItem>
                      <SelectItem value="expense">Expenses Only</SelectItem>
                      <SelectItem value="business">Business Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Custom Date Range */}
              {filterPeriod === "custom" && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-10 bg-background/50">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {customStartDate ? format(customStartDate, "PP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-10 bg-background/50">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {customEndDate ? format(customEndDate, "PP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income vs Expenses Chart */}
          {chartData.length > 0 && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  Income vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: chartData.length > 7 ? 50 : 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        interval={0}
                        angle={chartData.length > 7 ? -45 : 0}
                        textAnchor={chartData.length > 7 ? "end" : "middle"}
                        height={chartData.length > 7 ? 60 : 30}
                      />
                      <YAxis 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                        tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
                        width={50}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'income' ? 'Income' : 'Expenses']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: chartData.length > 10 ? 2 : 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(0, 84%, 60%)', strokeWidth: 2, r: chartData.length > 10 ? 2 : 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-sm text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Performance */}
          {locationPerformance.length > 0 && locationPerformance.some(l => l.income > 0 || l.expenses > 0) && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Location Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={locationPerformance.filter(l => l.income > 0 || l.expenses > 0)} 
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        type="number" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                        tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'income' ? 'Income' : 'Expenses']}
                        labelFormatter={(label) => {
                          const loc = locationPerformance.find(l => l.name === label);
                          return loc?.fullName || label;
                        }}
                      />
                      <Bar dataKey="income" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entry History */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                Entry History
                <Badge variant="secondary" className="ml-auto">{filteredEntries.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No entries recorded yet</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Details</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.slice(0, 15).map((entry) => (
                        <TableRow key={entry.id} className="group">
                          <TableCell className="text-muted-foreground">{format(entry.date, "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === "income" ? "default" : "destructive"} className="gap-1">
                              {entry.type === "income" ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.locationId ? (
                              <>
                                {getLocationName(entry.locationId)}
                                {entry.machineType && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({getMachineLabel(entry.machineType)})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                Business
                              </span>
                            )}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-bold",
                            entry.type === "income" ? "text-green-600" : "text-red-500"
                          )}>
                            {entry.type === "expense" ? "-" : ""}${entry.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px]">
                            <div className="flex items-center gap-2">
                              {entry.category ? <Badge variant="outline">{entry.category}</Badge> : null}
                              {entry.receiptUrl && (
                                <button 
                                  onClick={() => handleViewReceipt(entry.id, entry.receiptUrl!)}
                                  disabled={loadingReceiptId === entry.id}
                                  className="text-primary hover:text-primary/80 disabled:opacity-50"
                                  title="View receipt"
                                >
                                  {loadingReceiptId === entry.id ? (
                                    <span className="animate-spin inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                  ) : (
                                    <Paperclip className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              <span className="truncate">{entry.notes || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Receipt Modal */}
      <ReceiptModal
        open={!!selectedReceiptModal}
        onOpenChange={(open) => !open && setSelectedReceiptModal(null)}
        receiptPath={selectedReceiptModal?.path || null}
        entryId={selectedReceiptModal?.entryId || ""}
        entryDetails={selectedReceiptModal?.details}
      />
    </div>
  );
}
