import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Wrench, User, Phone, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AddMaintenanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LocationOption {
  id: string;
  name: string;
}

interface MachineOption {
  id: string;
  label: string;
  type: string;
}

const ISSUE_TYPES = [
  { value: "not_working", label: "Not Working" },
  { value: "stuck_prize", label: "Stuck Prize" },
  { value: "coin_jam", label: "Coin Jam" },
  { value: "display_issue", label: "Display Issue" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", description: "Minor issue, machine still usable" },
  { value: "medium", label: "Medium", description: "Affects functionality, needs attention" },
  { value: "high", label: "High", description: "Machine unusable, urgent fix needed" },
];

export function AddMaintenanceReportDialog({ open, onOpenChange, onSuccess }: AddMaintenanceReportDialogProps) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [formData, setFormData] = useState({
    machine_id: "",
    issue_type: "other",
    severity: "medium",
    description: "",
    reporter_name: "",
    reporter_contact: "",
  });

  // Fetch user's locations on mount
  useEffect(() => {
    if (open && user) {
      fetchLocations();
    }
  }, [open, user]);

  // Fetch machines when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchMachines(selectedLocation);
    } else {
      setMachines([]);
      setFormData(prev => ({ ...prev, machine_id: "" }));
    }
  }, [selectedLocation]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedLocation("");
      setFormData({
        machine_id: "",
        issue_type: "other",
        severity: "medium",
        description: "",
        reporter_name: "",
        reporter_contact: "",
      });
      setMachines([]);
    }
  }, [open]);

  const fetchLocations = async () => {
    if (!user) return;
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const fetchMachines = async (locationId: string) => {
    setIsLoadingMachines(true);
    try {
      const { data, error } = await supabase
        .from("location_machines")
        .select("id, machine_type, custom_label")
        .eq("location_id", locationId);

      if (error) throw error;

      const machineOptions: MachineOption[] = (data || []).map(m => ({
        id: m.id,
        label: m.custom_label || m.machine_type,
        type: m.machine_type,
      }));
      setMachines(machineOptions);
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setIsLoadingMachines(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.machine_id || !formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a machine and provide a description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("maintenance_reports")
        .insert({
          machine_id: formData.machine_id,
          user_id: user.id,
          issue_type: formData.issue_type,
          description: formData.description,
          severity: formData.severity,
          reporter_name: formData.reporter_name || null,
          reporter_contact: formData.reporter_contact || null,
          status: "open",
        });

      if (error) throw error;

      toast({
        title: "Report Created",
        description: "Maintenance report has been logged successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast({
        title: "Error",
        description: "Failed to create maintenance report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Report Maintenance Issue
          </DialogTitle>
          <DialogDescription>
            Log a maintenance issue you've discovered during your rounds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Location & Machine Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                disabled={isLoadingLocations}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={isLoadingLocations ? "Loading..." : "Select location"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine">
                Machine <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.machine_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, machine_id: v }))}
                disabled={!selectedLocation || isLoadingMachines}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={
                    !selectedLocation 
                      ? "Select a location first" 
                      : isLoadingMachines 
                        ? "Loading..." 
                        : machines.length === 0 
                          ? "No machines found" 
                          : "Select machine"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Issue Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type</Label>
              <Select
                value={formData.issue_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, issue_type: v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Severity</Label>
              <RadioGroup
                value={formData.severity}
                onValueChange={(v) => setFormData(prev => ({ ...prev, severity: v }))}
                className="space-y-2"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      formData.severity === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, severity: opt.value }))}
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={opt.value} className="font-medium cursor-pointer">
                        {opt.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>
          </div>

          {/* Optional Reporter Info */}
          <div className="space-y-4 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Optional: If someone else reported this issue to you
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporter_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reporter Name
                </Label>
                <Input
                  id="reporter_name"
                  placeholder="e.g., Customer name"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, reporter_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporter_contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Info
                </Label>
                <Input
                  id="reporter_contact"
                  placeholder="e.g., Phone or email"
                  value={formData.reporter_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, reporter_contact: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.machine_id || !formData.description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
