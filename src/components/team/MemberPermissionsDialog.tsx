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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { TeamMember, TeamMemberPermissions } from "@/hooks/useTeamMembers";

interface MemberPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  onSave: (permissions: Partial<TeamMemberPermissions>) => Promise<boolean>;
}

export function MemberPermissionsDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: MemberPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Partial<TeamMemberPermissions>>(
    member.permissions || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when dialog opens or member changes
  useEffect(() => {
    if (open && member.permissions) {
      setPermissions({ ...member.permissions });
    }
  }, [open, member.permissions]);

  const togglePermission = (key: keyof TeamMemberPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(permissions);
    setIsSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Edit Permissions
          </DialogTitle>
          <DialogDescription>
            Configure what {member.invited_email} can access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Locations</Label>
              <p className="text-xs text-muted-foreground">View location details and machines</p>
            </div>
            <Switch
              checked={permissions.can_view_locations}
              onCheckedChange={() => togglePermission("can_view_locations")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Maintenance</Label>
              <p className="text-xs text-muted-foreground">View maintenance reports</p>
            </div>
            <Switch
              checked={permissions.can_view_maintenance}
              onCheckedChange={() => togglePermission("can_view_maintenance")}
            />
          </div>

          <div className="flex items-center justify-between pl-4 border-l-2 border-muted">
            <div>
              <Label className="text-sm font-medium">Manage Maintenance</Label>
              <p className="text-xs text-muted-foreground">Update status, add notes</p>
            </div>
            <Switch
              checked={permissions.can_manage_maintenance}
              onCheckedChange={() => togglePermission("can_manage_maintenance")}
              disabled={!permissions.can_view_maintenance}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Inventory</Label>
              <p className="text-xs text-muted-foreground">View and manage inventory</p>
            </div>
            <Switch
              checked={permissions.can_view_inventory}
              onCheckedChange={() => togglePermission("can_view_inventory")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Revenue</Label>
              <p className="text-xs text-muted-foreground">View financial data</p>
            </div>
            <Switch
              checked={permissions.can_view_revenue}
              onCheckedChange={() => togglePermission("can_view_revenue")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Leads</Label>
              <p className="text-xs text-muted-foreground">View sales pipeline</p>
            </div>
            <Switch
              checked={permissions.can_view_leads}
              onCheckedChange={() => togglePermission("can_view_leads")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Reports</Label>
              <p className="text-xs text-muted-foreground">View analytics and reports</p>
            </div>
            <Switch
              checked={permissions.can_view_reports}
              onCheckedChange={() => togglePermission("can_view_reports")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Documents</Label>
              <p className="text-xs text-muted-foreground">View agreements and documents</p>
            </div>
            <Switch
              checked={permissions.can_view_documents}
              onCheckedChange={() => togglePermission("can_view_documents")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Mileage</Label>
              <p className="text-xs text-muted-foreground">View routes and mileage entries</p>
            </div>
            <Switch
              checked={permissions.can_view_mileage}
              onCheckedChange={() => togglePermission("can_view_mileage")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Task Assignment</Label>
              <p className="text-xs text-muted-foreground">Assign tasks to other team members</p>
            </div>
            <Switch
              checked={permissions.can_assign_tasks}
              onCheckedChange={() => togglePermission("can_assign_tasks")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
