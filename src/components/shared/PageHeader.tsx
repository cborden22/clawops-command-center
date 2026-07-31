import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent page chrome used across top-level screens.
 * Provides a title, optional description, back navigation, and action slot.
 */
export function PageHeader({
  title,
  description,
  backTo,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {backTo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -ml-2"
              onClick={() => navigate(backTo)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 sm:pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}
