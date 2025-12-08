import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  MapPin,
  Plus,
  Trash2,
  Edit,
  Building2,
  Phone,
  User,
  Sparkles,
  Search,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocations, Location, MachineType, MACHINE_TYPE_OPTIONS } from "@/hooks/useLocationsDB";
import { LocationDetailDialog } from "./LocationDetailDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyFormData = {
  name: "",
  address: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  machineCount: 1,
  machines: [] as MachineType[],
  commissionRate: 0,
  notes: "",
  isActive: true,
};

export function LocationTrackerComponent() {
  const {
    locations,
    activeLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [viewLocation, setViewLocation] = useState<Location | null>(null);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }

    if (editingLocation) {
      updateLocation(editingLocation.id, formData);
      toast({
        title: "Location Updated",
        description: `${formData.name} has been updated.`,
      });
      setEditingLocation(null);
    } else {
      addLocation(formData);
      toast({
        title: "Location Added",
        description: `${formData.name} has been added.`,
      });
    }

    setFormData(emptyFormData);
    setShowAddDialog(false);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      contactPerson: location.contactPerson,
      contactPhone: location.contactPhone,
      contactEmail: location.contactEmail,
      machineCount: location.machineCount,
      machines: location.machines || [],
      commissionRate: location.commissionRate,
      notes: location.notes,
      isActive: location.isActive,
    });
    setShowAddDialog(true);
  };

  const handleAddMachineType = () => {
    setFormData((prev) => ({
      ...prev,
      machines: [...prev.machines, { type: "claw", label: "Claw Machine", count: 1 }],
    }));
  };

  const handleRemoveMachineType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      machines: prev.machines.filter((_, i) => i !== index),
    }));
  };

  const handleMachineTypeChange = (index: number, field: keyof MachineType, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      machines: prev.machines.map((m, i) => {
        if (i !== index) return m;
        if (field === "type") {
          const option = MACHINE_TYPE_OPTIONS.find((o) => o.value === value);
          return { ...m, type: value as MachineType["type"], label: option?.label || "Other" };
        }
        return { ...m, [field]: value };
      }),
    }));
  };

  // Calculate total machine count from machine types
  const totalMachinesFromTypes = formData.machines.reduce((sum, m) => sum + m.count, 0);

  const handleDelete = (location: Location) => {
    deleteLocation(location.id);
    toast({
      title: "Location Removed",
      description: `${location.name} has been removed.`,
    });
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingLocation(null);
    setFormData(emptyFormData);
  };

  const totalMachines = locations.reduce((sum, loc) => sum + loc.machineCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Locations
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {locations.length}
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
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Locations
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {activeLocations.length}
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
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Machines
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {totalMachines}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table Card */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 gap-4 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            All Locations
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger asChild>
              <Button className="premium-button" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {editingLocation ? "Edit Location" : "Add New Location"}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation
                    ? "Update the location details below."
                    : "Fill in the details for your new claw machine location."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Location Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Joe's Pizza"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="e.g., 123 Main St, City, State"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        placeholder="e.g., John Smith"
                        value={formData.contactPerson}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactPerson: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        placeholder="e.g., (555) 123-4567"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="e.g., john@example.com"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Machine & Commission Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Machine & Commission Details
                  </h3>
                  
                  {/* Machine Types */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Machine Types</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddMachineType}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Type
                      </Button>
                    </div>
                    
                    {formData.machines.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">
                        No machine types added. Click "Add Type" to specify machines.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formData.machines.map((machine, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <Select
                              value={machine.type}
                              onValueChange={(value) =>
                                handleMachineTypeChange(index, "type", value)
                              }
                            >
                              <SelectTrigger className="flex-1 bg-background">
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
                            <Input
                              type="number"
                              min="1"
                              value={machine.count}
                              onChange={(e) =>
                                handleMachineTypeChange(
                                  index,
                                  "count",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 bg-background"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMachineType(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Total from types: {totalMachinesFromTypes} machines
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="machineCount">Total Machine Count</Label>
                      <Input
                        id="machineCount"
                        type="number"
                        min="1"
                        value={formData.machineCount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            machineCount: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Override if different from types total
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 25"
                        value={formData.commissionRate || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            commissionRate: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this location..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div>
                      <Label htmlFor="isActive" className="font-medium">
                        Active Location
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Inactive locations won't appear in other tools
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, isActive: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1 premium-button">
                    {editingLocation ? "Update Location" : "Add Location"}
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
          {locations.length > 0 && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/50"
                />
              </div>
            </div>
          )}

          {/* Table or Empty State */}
          {locations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No locations yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click "Add Location" to get started
              </p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No locations match your search</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="text-center font-semibold">Machines</TableHead>
                    <TableHead className="text-center font-semibold">Commission</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id} className="group transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{location.name}</p>
                          {location.address && (
                            <p className="text-sm text-muted-foreground">
                              {location.address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {location.contactPerson && (
                            <p className="text-sm flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {location.contactPerson}
                            </p>
                          )}
                          {location.contactPhone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {location.contactPhone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {location.machineCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {location.commissionRate > 0 ? (
                          <Badge variant="secondary">{location.commissionRate}%</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={location.isActive ? "default" : "secondary"}
                          className={cn(
                            location.isActive
                              ? "bg-primary/20 text-primary hover:bg-primary/30"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {location.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setViewLocation(location)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(location)}
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

      {/* View Location Dialog with Tabs */}
      <LocationDetailDialog
        location={viewLocation}
        open={!!viewLocation}
        onOpenChange={(open) => !open && setViewLocation(null)}
      />
    </div>
  );
}
