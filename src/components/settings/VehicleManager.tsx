import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Car, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useVehicles, Vehicle } from "@/hooks/useVehiclesDB";
import { toast } from "@/hooks/use-toast";

interface VehicleFormData {
  name: string;
  year: string;
  make: string;
  model: string;
  licensePlate: string;
}

const initialFormData: VehicleFormData = {
  name: "",
  year: "",
  make: "",
  model: "",
  licensePlate: "",
};

export function VehicleManager() {
  const { vehicles, isLoaded, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      year: vehicle.year?.toString() || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      licensePlate: vehicle.licensePlate || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the vehicle.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleData = {
        name: formData.name.trim(),
        year: formData.year ? parseInt(formData.year) : undefined,
        make: formData.make.trim() || undefined,
        model: formData.model.trim() || undefined,
        licensePlate: formData.licensePlate.trim() || undefined,
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
        toast({ title: "Vehicle Updated" });
      } else {
        await addVehicle(vehicleData);
        toast({ title: "Vehicle Added" });
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingVehicle(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Delete "${vehicle.name}"? This cannot be undone.`)) return;

    const success = await deleteVehicle(vehicle.id);
    if (success) {
      toast({ title: "Vehicle Deleted" });
    }
  };

  if (!isLoaded) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicles
              </CardTitle>
              <CardDescription>
                Manage vehicles for odometer-based mileage tracking
              </CardDescription>
            </div>
            <Button onClick={handleOpenAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No vehicles added yet</p>
              <p className="text-xs mt-1">Add a vehicle to use odometer tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{vehicle.name}</span>
                      {vehicle.year && vehicle.make && vehicle.model && (
                        <span className="text-sm text-muted-foreground">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {vehicle.licensePlate && (
                        <span>Plate: {vehicle.licensePlate}</span>
                      )}
                      {vehicle.lastRecordedOdometer !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          Last: {vehicle.lastRecordedOdometer.toLocaleString()} mi
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => handleDelete(vehicle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? "Update your vehicle details"
                : "Add a new vehicle for mileage tracking"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleName">Vehicle Name *</Label>
              <Input
                id="vehicleName"
                placeholder="e.g., Work Van, Blue Truck"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  placeholder="2024"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, year: e.target.value }))
                  }
                  min={1900}
                  max={2100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleMake">Make</Label>
                <Input
                  id="vehicleMake"
                  placeholder="Ford"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, make: e.target.value }))
                  }
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Model</Label>
                <Input
                  id="vehicleModel"
                  placeholder="F-150"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, model: e.target.value }))
                  }
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">License Plate</Label>
              <Input
                id="vehiclePlate"
                placeholder="ABC-1234"
                value={formData.licensePlate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    licensePlate: e.target.value,
                  }))
                }
                maxLength={20}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingVehicle ? (
                "Save Changes"
              ) : (
                "Add Vehicle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
