import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Shield, Info } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { toast } from "@/hooks/use-toast";
export default function Team() {
  const {
    teamMembers,
    isLoading,
    isInviting,
    inviteTeamMember,
    updateMemberPermissions,
    updateMemberRole,
    removeMember,
    resendInvite,
  } = useTeamMembers();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { canAddTeamMember } = useFeatureAccess();

  const handleInviteClick = () => {
    if (!canAddTeamMember(teamMembers.length)) {
      toast({
        title: "Team Member Limit Reached",
        description: "Upgrade to Pro to invite more team members.",
        variant: "destructive",
      });
      return;
    }
    setShowInviteDialog(true);
  };

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const pendingCount = teamMembers.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Invite and manage team members with custom permissions
          </p>
        </div>
        <Button onClick={handleInviteClick} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <UserPlus className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="glass-card border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-600">How team invitations work</p>
              <p className="text-muted-foreground mt-1">
                When you invite someone, they'll receive an email with a link to create an account or sign in.
                Once they sign up with the invited email address, they'll automatically gain access to your shared data based on the permissions you set.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage who has access to your ClawOps data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No team members yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Invite technicians or managers to help run your operations
              </p>
              <Button onClick={handleInviteClick} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onUpdatePermissions={updateMemberPermissions}
                  onUpdateRole={updateMemberRole}
                  onRemove={removeMember}
                  onResendInvite={resendInvite}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvite={inviteTeamMember}
        isInviting={isInviting}
      />
    </div>
  );
}
