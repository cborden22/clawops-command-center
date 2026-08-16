import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  children?: ReactNode;
  className?: string;
}

export function BulkActionBar({
  count,
  onClear,
  onSelectAll,
  allSelected,
  children,
  className,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40 bottom-20 sm:bottom-6",
        "w-[calc(100%-2rem)] max-w-2xl",
        "rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg",
        "px-3 py-2 flex items-center gap-2 animate-fade-in",
        className
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium tabular-nums shrink-0">
        {count} selected
      </span>

      {onSelectAll && !allSelected && (
        <Button variant="ghost" size="sm" className="h-8" onClick={onSelectAll}>
          Select all
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {children}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onClear}
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
