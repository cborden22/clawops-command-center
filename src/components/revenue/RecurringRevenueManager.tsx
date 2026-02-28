import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Zap, RefreshCw, Calendar } from "lucide-react";
import { useRecurringRevenue } from "@/hooks/useRecurringRevenue";
import { useLocations } from "@/hooks/useLocationsDB";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function RecurringRevenueManager() {
  const { items, addItem, deleteItem, toggleActive, generateDueEntries, dueCount } = useRecurringRevenue();
  const { activeLocations } = useLocations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("Flat Fee");
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    await addItem({
      locationId: locationId || null,
      amount: parseFloat(amount),
      frequency,
      category,
      nextDueDate,
      isActive: true,
      notes,
    });
    setDialogOpen(false);
    setAmount("");
    setNotes("");
    setLocationId("");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const count = await generateDueEntries();
    setIsGenerating(false);
    if (count > 0) {
      toast({ title: "Entries Generated", description: `${count} revenue entries created.` });
    } else {
      toast({ title: "No Due Entries", description: "All recurring entries are up to date." });
    }
  };

  const getLocationName = (id: string | null) => {
    if (!id) return "General";
    return activeLocations.find(l => l.id === id)?.name || "Unknown";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Recurring Revenue
        </CardTitle>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <Zap className="h-4 w-4 mr-1" />
              Generate {dueCount} Due
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Recurring Revenue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Location (optional)</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / No Location</SelectItem>
                      {activeLocations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount ($)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Flat Fee" />
                  </div>
                  <div>
                    <Label>Next Due Date</Label>
                    <Input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={!amount || parseFloat(amount) <= 0}>Add Recurring Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No recurring entries yet. Add one to auto-generate revenue entries on a schedule.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{getLocationName(item.locationId)}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{item.frequency}</Badge>
                    </TableCell>
                    <TableCell>{item.nextDueDate}</TableCell>
                    <TableCell>
                      <Switch checked={item.isActive} onCheckedChange={v => toggleActive(item.id, v)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
  );
}
