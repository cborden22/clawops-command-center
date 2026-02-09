import { Navigate } from "react-router-dom";
import { useMyTeamPermissions, MyPermissions } from "@/hooks/useMyTeamPermissions";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: keyof MyPermissions;
}

/**
 * Route-level permission guard.
 * Owners always pass. Team members are checked against their specific permission.
 * Unauthorized users are redirected to the dashboard.
 */
export function PermissionGuard({ children, requiredPermission }: PermissionGuardProps) {
  const permissions = useMyTeamPermissions();

  if (permissions.isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (permissions.isOwner) return <>{children}</>;

  if (!permissions[requiredPermission]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
