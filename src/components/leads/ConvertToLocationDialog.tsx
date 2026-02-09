import { useState, useEffect } from 'react';
import { Lead } from '@/hooks/useLeadsDB';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Building2, MapPin, User, Phone, Mail, CheckCircle2, Loader2, Sparkles, Calendar, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { slugify, generateUnitCode } from '@/utils/slugify';
import { MachineType } from '@/hooks/useLocationsDB';
import { useMachineTypesDB } from '@/hooks/useMachineTypesDB';

interface ConvertToLocationDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (leadId: string, locationId: string) => void;
}

const RESTOCK_FREQUENCY_OPTIONS = [
  { value: "none", label: "No Schedule", days: null },
  { value: "7", label: "Weekly", days: 7 },
  { value: "14", label: "Every 2 Weeks", days: 14 },
  { value: "21", label: "Every 3 Weeks", days: 21 },
  { value: "30", label: "Monthly", days: 30 },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const emptyFormData = {
  name: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  notes: '',
  machines: [] as MachineType[],
  commissionRate: 0,
  isActive: true,
  collectionFrequencyDays: undefined as number | undefined,
  restockDayOfWeek: undefined as number | undefined,
};

export function ConvertToLocationDialog({ lead, open, onOpenChange, onSuccess }: ConvertToLocationDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { machineTypeOptions } = useMachineTypesDB();
  const [formData, setFormData] = useState(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Properly populate form when dialog opens with lead data
  useEffect(() => {
    if (open && lead) {
      setFormData({
        name: lead.business_name || '',
        address: lead.address || '',
        contact_person: lead.contact_name || '',
        contact_phone: lead.contact_phone || '',
        contact_email: lead.contact_email || '',
        notes: lead.notes || '',
        machines: [],
        commissionRate: 0,
        isActive: true,
        collectionFrequencyDays: undefined,
        restockDayOfWeek: undefined,
      });
      setIsSuccess(false);
    }
  }, [open, lead]);

  // Machine type handlers
  const handleAddMachineType = () => {
    setFormData((prev) => ({
      ...prev,
      machines: [...prev.machines, { type: machineTypeOptions[0]?.value || "claw", label: machineTypeOptions[0]?.label || "Claw Machine", count: 1, customLabel: "", winProbability: undefined }],
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
          const option = machineTypeOptions.find((o) => o.value === value);
          const defaultLabel = option?.label || "Other";
          return { 
            ...m, 
            type: value as MachineType["type"], 
            label: m.customLabel || defaultLabel,
            customLabel: m.customLabel || ""
          };
        }
        if (field === "customLabel") {
          const option = machineTypeOptions.find((o) => o.value === m.type);
          const defaultLabel = option?.label || "Other";
          const customLabel = String(value).trim();
          return { 
            ...m, 
            customLabel,
            label: customLabel || defaultLabel
          };
        }
        if (field === "winProbability") {
          return { ...m, winProbability: value ? Number(value) : undefined };
        }
        return { ...m, [field]: value };
      }),
    }));
  };

  const totalMachinesFromTypes = formData.machines.reduce((sum, m) => sum + m.count, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !lead) return;

    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the location
      const slug = slugify(formData.name);
      const { data: newLocation, error: locationError } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          name: formData.name,
          address: formData.address || null,
          contact_person: formData.contact_person || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          notes: formData.notes || null,
          slug,
          is_active: formData.isActive,
          commission_rate: formData.commissionRate || null,
          collection_frequency_days: formData.collectionFrequencyDays || null,
          restock_day_of_week: formData.restockDayOfWeek ?? null,
        })
        .select()
        .single();

      if (locationError) throw locationError;

      // Add machines if any
      if (formData.machines.length > 0) {
        const typeCounters: Record<string, number> = {};
        
        const machinesInsert = formData.machines.map(m => {
          const defaultLabel = machineTypeOptions.find(opt => opt.value === m.type)?.label || "";
          const customLabel = m.customLabel || (m.label !== defaultLabel ? m.label : "");
          
          typeCounters[m.type] = (typeCounters[m.type] || 0) + 1;
          const unitCode = generateUnitCode(m.type, typeCounters[m.type]);
          
          return {
            location_id: newLocation.id,
            machine_type: m.type,
            count: m.count,
            custom_label: customLabel || null,
            win_probability: m.winProbability || null,
            cost_per_play: m.costPerPlay ?? 0.50,
            unit_code: unitCode,
          };
        });

        const { error: machinesError } = await supabase
          .from("location_machines")
          .insert(machinesInsert);

        if (machinesError) throw machinesError;
      }

      // Update lead status to won and link to location
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'won',
          converted_location_id: newLocation.id,
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      setIsSuccess(true);
      onSuccess(lead.id, newLocation.id);

      toast({
        title: 'Location Created!',
        description: `${formData.name} has been added to your locations.`,
      });

      // Brief delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        navigate(`/locations`);
      }, 1500);

    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Convert Lead to Location
          </DialogTitle>
          <DialogDescription>
            Create a new location from this lead. You can adjust the details before creating.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Location Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Redirecting to locations page...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main St, City, State"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    placeholder="e.g., John Smith"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="contact_phone"
                    placeholder="e.g., (555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
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
                        className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={machine.type}
                            onValueChange={(value) =>
                              handleMachineTypeChange(index, "type", value)
                            }
                          >
                            <SelectTrigger className="flex-1 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-[100]">
                              {machineTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <NumberInput
                            min={1}
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
                        <Input
                          placeholder="Custom name (optional, e.g., Mini Claw)"
                          value={machine.customLabel || ""}
                          onChange={(e) =>
                            handleMachineTypeChange(index, "customLabel", e.target.value)
                          }
                          className="bg-background text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Win Probability:</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">1 in</span>
                            <NumberInput
                              min={1}
                              placeholder="15"
                              value={machine.winProbability || ""}
                              onChange={(e) =>
                                handleMachineTypeChange(
                                  index,
                                  "winProbability",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 h-8 bg-background text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Total from types: {totalMachinesFromTypes} machines
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <NumberInput
                  id="commissionRate"
                  min={0}
                  max={100}
                  step={0.1}
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

            {/* Restock Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Restock Schedule
              </h3>
              <p className="text-xs text-muted-foreground -mt-2">
                Set a schedule if this location is NOT part of a route. Locations on routes are restocked when the route runs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collectionFrequency">Restock Frequency</Label>
                  <Select
                    value={formData.collectionFrequencyDays ? String(formData.collectionFrequencyDays) : "none"}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        collectionFrequencyDays: v === "none" ? undefined : parseInt(v),
                        restockDayOfWeek: v === "none" ? undefined : prev.restockDayOfWeek,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      {RESTOCK_FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.collectionFrequencyDays && (
                  <div className="space-y-2">
                    <Label htmlFor="restockDay">Preferred Day</Label>
                    <Select
                      value={formData.restockDayOfWeek !== undefined ? String(formData.restockDayOfWeek) : ""}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          restockDayOfWeek: v ? parseInt(v) : undefined,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Any day" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-[100]">
                        {DAY_OF_WEEK_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this location..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="font-medium">Active Location</Label>
                <p className="text-xs text-muted-foreground">
                  Active locations appear in revenue tracking and reports
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Location
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
