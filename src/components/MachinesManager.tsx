import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Sparkles,
  MapPin,
  QrCode,
} from "lucide-react";
import { QRCodeGenerator } from "@/components/maintenance/QRCodeGenerator";
import { toast } from "@/hooks/use-toast";
import { useLocations, Location, MachineType, MACHINE_TYPE_OPTIONS } from "@/hooks/useLocationsDB";

interface MachineWithLocation {
  machineType: MachineType;
  location: Location;
  index: number;
}

export function MachinesManager() {
  const { locations, updateLocation, isLoaded } = useLocations();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineWithLocation | null>(null);
  const [qrMachine, setQrMachine] = useState<{ id: string; name: string; location: string } | null>(null);
  const [formData, setFormData] = useState({
    locationId: "",
    type: "claw" as MachineType["type"],
    count: 1,
    customLabel: "",
    winProbability: undefined as number | undefined,
    costPerPlay: 0.50,
  });

  // Flatten all machines from all locations
  const allMachines: MachineWithLocation[] = locations.flatMap((location) =>
    (location.machines || []).map((machine, index) => ({
      machineType: machine,
      location,
      index,
    }))
  );

  const filteredMachines = allMachines.filter(
    (m) =>
      m.machineType.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalMachines = allMachines.reduce((sum, m) => sum + m.machineType.count, 0);
  const machinesByType = MACHINE_TYPE_OPTIONS.map((opt) => ({
    ...opt,
    count: allMachines
      .filter((m) => m.machineType.type === opt.value)
      .reduce((sum, m) => sum + m.machineType.count, 0),
  }));

  const handleSubmit = async () => {
    if (!formData.locationId) {
      toast({
        title: "Missing Information",
        description: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    const location = locations.find((l) => l.id === formData.locationId);
    if (!location) return;

    const option = MACHINE_TYPE_OPTIONS.find((o) => o.value === formData.type);
    const label = formData.customLabel.trim() || option?.label || "Other";

    if (editingMachine) {
      // Update existing machine
      const updatedMachines = [...(location.machines || [])];
      updatedMachines[editingMachine.index] = {
        type: formData.type,
        label,
        count: formData.count,
        winProbability: formData.winProbability,
        costPerPlay: formData.costPerPlay,
      };

      await updateLocation(location.id, { machines: updatedMachines });
      toast({
        title: "Machine Updated",
        description: `${label} has been updated at ${location.name}.`,
      });
    } else {
      // Add new machine
      const updatedMachines = [
        ...(location.machines || []),
        { type: formData.type, label, count: formData.count, winProbability: formData.winProbability, costPerPlay: formData.costPerPlay },
      ];

      await updateLocation(location.id, { machines: updatedMachines });
      toast({
        title: "Machine Added",
        description: `${label} has been added to ${location.name}.`,
      });
    }

    handleDialogClose();
  };

  const handleEdit = (machine: MachineWithLocation) => {
    setEditingMachine(machine);
    setFormData({
      locationId: machine.location.id,
      type: machine.machineType.type,
      count: machine.machineType.count,
      customLabel:
        MACHINE_TYPE_OPTIONS.find((o) => o.value === machine.machineType.type)?.label ===
        machine.machineType.label
          ? ""
          : machine.machineType.label,
      winProbability: machine.machineType.winProbability,
      costPerPlay: machine.machineType.costPerPlay ?? 0.50,
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (machine: MachineWithLocation) => {
    const updatedMachines = machine.location.machines.filter((_, i) => i !== machine.index);
    await updateLocation(machine.location.id, { machines: updatedMachines });
    toast({
      title: "Machine Removed",
      description: `${machine.machineType.label} has been removed from ${machine.location.name}.`,
    });
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingMachine(null);
    setFormData({
      locationId: "",
      type: "claw",
      count: 1,
      customLabel: "",
      winProbability: undefined,
      costPerPlay: 0.50,
    });
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden col-span-2">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Machines</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {totalMachines}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {machinesByType.map((type) => (
          <Card
            key={type.value}
            className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden"
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground truncate">{type.label}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{type.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Machines Table */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 gap-4 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            All Machines
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger asChild>
              <Button className="premium-button" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {editingMachine ? "Edit Machine" : "Add New Machine"}
                </DialogTitle>
                <DialogDescription>
                  {editingMachine
                    ? "Update the machine details below."
                    : "Add a new machine to a location."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, locationId: value }))
                    }
                    disabled={!!editingMachine}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Machine Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: value as MachineType["type"],
                      }))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {MACHINE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Label (optional)</Label>
                  <Input
                    placeholder="e.g., Mini Claw, Giant Claw"
                    value={formData.customLabel}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customLabel: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Override the default type name if needed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Count</Label>
                  <NumberInput
                    min="1"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        count: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Win Probability (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">1 in</span>
                    <NumberInput
                      min="1"
                      placeholder="15"
                      value={formData.winProbability || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          winProbability: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set the expected win rate (e.g., 15 = 1 in 15 plays wins)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cost Per Play</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <NumberInput
                      min="0.01"
                      step="0.25"
                      placeholder="0.50"
                      value={formData.costPerPlay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          costPerPlay: parseFloat(e.target.value) || 0.50,
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[0.25, 0.50, 1.00, 2.00].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={formData.costPerPlay === preset ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setFormData((prev) => ({ ...prev, costPerPlay: preset }))}
                      >
                        ${preset.toFixed(2)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1 premium-button">
                    {editingMachine ? "Update Machine" : "Add Machine"}
                  </Button>
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search */}
          {allMachines.length > 0 && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/50"
                />
              </div>
            </div>
          )}

          {/* Table or Empty State */}
          {allMachines.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No machines yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add machines to your locations to get started
              </p>
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No machines match your search</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Machine</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="text-center font-semibold">Count</TableHead>
                    <TableHead className="text-right font-semibold w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMachines.map((machine, idx) => (
                    <TableRow key={`${machine.location.id}-${machine.index}-${idx}`} className="group transition-colors">
                      <TableCell>
                        <p className="font-medium">{machine.machineType.label}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {MACHINE_TYPE_OPTIONS.find((o) => o.value === machine.machineType.type)
                            ?.label || machine.machineType.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{machine.location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {machine.machineType.count}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {machine.machineType.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setQrMachine({
                                id: machine.machineType.id!,
                                name: machine.machineType.label,
                                location: machine.location.name,
                              })}
                              title="Generate QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(machine)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(machine)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      {qrMachine && (
        <QRCodeGenerator
          open={!!qrMachine}
          onOpenChange={(open) => !open && setQrMachine(null)}
          machineId={qrMachine.id}
          machineName={qrMachine.name}
          locationName={qrMachine.location}
        />
      )}
    </div>
  );
}
