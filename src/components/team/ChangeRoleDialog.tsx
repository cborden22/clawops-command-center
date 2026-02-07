import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog } from "lucide-react";
import { TeamMember, TeamRole } from "@/hooks/useTeamMembers";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  onSave: (role: TeamRole, applyPreset: boolean) => Promise<boolean>;
}

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
  {
    value: "technician",
    label: "Technician",
    description: "Field work, maintenance, and inventory",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Full access to most features",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description: "Manager access plus task assignment",
  },
  {
    value: "route_driver",
    label: "Route Driver",
    description: "Mileage tracking and routes only",
  },
  {
    value: "inventory_clerk",
    label: "Inventory Clerk",
    description: "Inventory management only",
  },
  {
    value: "sales_manager",
    label: "Sales Manager",
    description: "Leads and locations focus",
  },
];

export function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<TeamRole>(member.role);
  const [applyPreset, setApplyPreset] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when dialog opens or member changes
  useEffect(() => {
    if (open) {
      setSelectedRole(member.role);
      setApplyPreset(true);
    }
  }, [open, member.role]);

  const handleSave = async () => {
    if (selectedRole === member.role && !applyPreset) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    const success = await onSave(selectedRole, applyPreset);
    setIsSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Change Role
          </DialogTitle>
          <DialogDescription>
            Select a new role for {member.invited_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <p className="text-sm text-muted-foreground">
              {formatRoleLabel(member.role)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as TeamRole)}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span>{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="apply-preset"
              checked={applyPreset}
              onCheckedChange={(checked) => setApplyPreset(checked === true)}
            />
            <Label
              htmlFor="apply-preset"
              className="text-sm font-normal cursor-pointer"
            >
              Apply role preset permissions
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            When enabled, permissions will be reset to the default for this role
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
