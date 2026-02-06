import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, Shield, UserPlus } from "lucide-react";
import { InviteData, TeamMemberPermissions } from "@/hooks/useTeamMembers";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: InviteData) => Promise<boolean>;
  isInviting: boolean;
}

const DEFAULT_PERMISSIONS: Partial<TeamMemberPermissions> = {
  can_view_revenue: false,
  can_view_inventory: true,
  can_view_locations: true,
  can_view_maintenance: true,
  can_manage_maintenance: true,
  can_view_leads: false,
  can_view_reports: false,
  can_view_documents: false,
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  isInviting,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "technician">("technician");
  const [permissions, setPermissions] = useState<Partial<TeamMemberPermissions>>(DEFAULT_PERMISSIONS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    const success = await onInvite({
      email: email.trim(),
      role,
      permissions,
    });

    if (success) {
      setEmail("");
      setRole("technician");
      setPermissions(DEFAULT_PERMISSIONS);
      onOpenChange(false);
    }
  };

  const togglePermission = (key: keyof TeamMemberPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // When role changes, apply default permissions
  const handleRoleChange = (newRole: "manager" | "technician") => {
    setRole(newRole);
    if (newRole === "manager") {
      setPermissions({
        ...DEFAULT_PERMISSIONS,
        can_view_revenue: true,
        can_view_leads: true,
        can_view_reports: true,
        can_view_documents: true,
      });
    } else {
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They'll receive an email with instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">
                    <div className="flex flex-col items-start">
                      <span>Technician</span>
                      <span className="text-xs text-muted-foreground">
                        Field work, maintenance, inventory
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex flex-col items-start">
                      <span>Manager</span>
                      <span className="text-xs text-muted-foreground">
                        Full access to most features
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </Label>
            <p className="text-xs text-muted-foreground">
              Control what this team member can access
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Locations</p>
                  <p className="text-xs text-muted-foreground">View location details</p>
                </div>
                <Switch
                  checked={permissions.can_view_locations}
                  onCheckedChange={() => togglePermission("can_view_locations")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maintenance</p>
                  <p className="text-xs text-muted-foreground">View maintenance reports</p>
                </div>
                <Switch
                  checked={permissions.can_view_maintenance}
                  onCheckedChange={() => togglePermission("can_view_maintenance")}
                />
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-muted">
                <div>
                  <p className="text-sm font-medium">Manage Maintenance</p>
                  <p className="text-xs text-muted-foreground">Update report status</p>
                </div>
                <Switch
                  checked={permissions.can_manage_maintenance}
                  onCheckedChange={() => togglePermission("can_manage_maintenance")}
                  disabled={!permissions.can_view_maintenance}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Inventory</p>
                  <p className="text-xs text-muted-foreground">View inventory items</p>
                </div>
                <Switch
                  checked={permissions.can_view_inventory}
                  onCheckedChange={() => togglePermission("can_view_inventory")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Revenue</p>
                  <p className="text-xs text-muted-foreground">View financial data</p>
                </div>
                <Switch
                  checked={permissions.can_view_revenue}
                  onCheckedChange={() => togglePermission("can_view_revenue")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Leads</p>
                  <p className="text-xs text-muted-foreground">View sales leads</p>
                </div>
                <Switch
                  checked={permissions.can_view_leads}
                  onCheckedChange={() => togglePermission("can_view_leads")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reports</p>
                  <p className="text-xs text-muted-foreground">View analytics reports</p>
                </div>
                <Switch
                  checked={permissions.can_view_reports}
                  onCheckedChange={() => togglePermission("can_view_reports")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground">View agreements</p>
                </div>
                <Switch
                  checked={permissions.can_view_documents}
                  onCheckedChange={() => togglePermission("can_view_documents")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting || !email.trim()}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
