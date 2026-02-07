import { useUserDisplay } from "@/hooks/useUserDisplay";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User } from "lucide-react";

interface AttributionBadgeProps {
  userId: string | null | undefined;
  prefix?: string;
  showFullName?: boolean;
  className?: string;
}

/**
 * Displays attribution information (initials or full name) for who created/modified data.
 * Shows a tooltip with full name on hover.
 */
export function AttributionBadge({
  userId,
  prefix = "By",
  showFullName = false,
  className = "",
}: AttributionBadgeProps) {
  const { displayInfo, isLoading } = useUserDisplay(userId);

  if (!userId || isLoading) {
    return null;
  }

  if (!displayInfo) {
    return null;
  }

  const displayText = showFullName
    ? displayInfo.fullName || displayInfo.email || "Unknown"
    : displayInfo.initials;

  const tooltipText = displayInfo.fullName || displayInfo.email || "Unknown user";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs font-normal gap-1 ${className}`}
          >
            <User className="h-3 w-3" />
            <span>
              {prefix} {displayText}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version showing just initials without prefix
 */
export function AttributionInitials({
  userId,
  className = "",
}: {
  userId: string | null | undefined;
  className?: string;
}) {
  const { displayInfo, isLoading } = useUserDisplay(userId);

  if (!userId || isLoading || !displayInfo) {
    return null;
  }

  const tooltipText = displayInfo.fullName || displayInfo.email || "Unknown user";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-medium ${className}`}
          >
            {displayInfo.initials}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
