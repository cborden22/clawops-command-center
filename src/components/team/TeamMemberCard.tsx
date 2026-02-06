import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Mail,
  Shield,
  UserCog,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { format } from "date-fns";
import { MemberPermissionsDialog } from "./MemberPermissionsDialog";

interface TeamMemberCardProps {
  member: TeamMember;
  onUpdatePermissions: (memberId: string, permissions: any) => Promise<boolean>;
  onUpdateRole: (memberId: string, role: "manager" | "technician") => Promise<boolean>;
  onRemove: (memberId: string) => Promise<boolean>;
  onResendInvite: (memberId: string, email: string) => Promise<boolean>;
}

export function TeamMemberCard({
  member,
  onUpdatePermissions,
  onUpdateRole,
  onRemove,
  onResendInvite,
}: TeamMemberCardProps) {
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const initials = member.invited_email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(member.id);
    setIsRemoving(false);
    setShowRemoveDialog(false);
  };

  const statusConfig = {
    pending: {
      label: "Pending",
      variant: "outline" as const,
      icon: Clock,
    },
    active: {
      label: "Active",
      variant: "default" as const,
      icon: CheckCircle2,
    },
    deactivated: {
      label: "Deactivated",
      variant: "secondary" as const,
      icon: Clock,
    },
  };

  const status = statusConfig[member.status];
  const StatusIcon = status.icon;

  const roleColors = {
    owner: "bg-primary text-primary-foreground",
    manager: "bg-blue-500/20 text-blue-600",
    technician: "bg-green-500/20 text-green-600",
  };

  return (
    <>
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{member.invited_email}</p>
                <Badge className={roleColors[member.role]} variant="secondary">
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                Invited {format(new Date(member.invited_at), "MMM d, yyyy")}
                {member.accepted_at && (
                  <> • Joined {format(new Date(member.accepted_at), "MMM d, yyyy")}</>
                )}
              </p>

              {member.permissions && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.permissions.can_view_locations && (
                    <Badge variant="outline" className="text-xs">Locations</Badge>
                  )}
                  {member.permissions.can_view_maintenance && (
                    <Badge variant="outline" className="text-xs">Maintenance</Badge>
                  )}
                  {member.permissions.can_view_inventory && (
                    <Badge variant="outline" className="text-xs">Inventory</Badge>
                  )}
                  {member.permissions.can_view_revenue && (
                    <Badge variant="outline" className="text-xs">Revenue</Badge>
                  )}
                  {member.permissions.can_view_leads && (
                    <Badge variant="outline" className="text-xs">Leads</Badge>
                  )}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPermissionsDialog(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Edit Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateRole(
                      member.id,
                      member.role === "manager" ? "technician" : "manager"
                    )
                  }
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Change to {member.role === "manager" ? "Technician" : "Manager"}
                </DropdownMenuItem>
                {member.status === "pending" && (
                  <DropdownMenuItem
                    onClick={() => onResendInvite(member.id, member.invited_email)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Invitation
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowRemoveDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {member.permissions && (
        <MemberPermissionsDialog
          open={showPermissionsDialog}
          onOpenChange={setShowPermissionsDialog}
          member={member}
          onSave={(permissions) => onUpdatePermissions(member.id, permissions)}
        />
      )}

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.invited_email} from your team?
              They will lose access to all shared data immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
