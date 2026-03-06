import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, Plus, Check, Pencil, RotateCcw, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetSize } from "@/hooks/useUserPreferences";
import { triggerHaptic } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";

type WidgetId = 'primaryStats' | 'weeklyCalendar' | 'collectionDue' | 'allTimeSummary' | 'topLocations' | 'lowStockAlerts' | 'recentTransactions' | 'quickActions' | 'maintenance' | 'leads' | 'businessHealth' | 'budgetTracking';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
}

const SIZE_CYCLE: WidgetSize[] = ['sm', 'md', 'lg', 'full'];
const SIZE_LABELS: Record<WidgetSize, string> = {
  sm: '⅓',
  md: '½',
  lg: '⅔',
  full: 'Full',
};

// --- Edit Mode FAB ---
interface EditModeFABProps {
  isEditMode: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function EditModeFAB({ isEditMode, onToggle, onReset }: EditModeFABProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50 flex items-center gap-2",
      isMobile ? "bottom-24 right-4" : "bottom-6 right-6"
    )}>
      {isEditMode && (
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full shadow-lg bg-card border-border hover:bg-muted animate-in fade-in slide-in-from-right-2 duration-200"
          onClick={onReset}
          title="Reset to default"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
      <Button
        size="icon"
        className={cn(
          "rounded-full shadow-xl transition-all duration-300",
          isMobile ? "h-14 w-14" : "h-12 w-12",
          isEditMode
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        onClick={() => {
          triggerHaptic(hapticPatterns.medium);
          onToggle();
        }}
        title={isEditMode ? "Done editing" : "Customize dashboard"}
      >
        {isEditMode ? (
          <Check className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
        ) : (
          <Pencil className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
        )}
      </Button>
    </div>
  );
}

// --- Widget Edit Overlay ---
interface WidgetEditOverlayProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  isEditMode: boolean;
  onHide: (id: WidgetId) => void;
  onResize: (id: WidgetId, size: WidgetSize) => void;
  onDragStart: (e: React.DragEvent, id: WidgetId) => void;
  onDragOver: (e: React.DragEvent, id: WidgetId) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: WidgetId) => void;
  isDragOver: boolean;
  isDragging: boolean;
  // Touch reorder
  onTouchDragStart: (id: WidgetId) => void;
  isTouchDragging: boolean;
}

export function WidgetEditOverlay({
  widget,
  children,
  isEditMode,
  onHide,
  onResize,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  isDragging,
  onTouchDragStart,
  isTouchDragging,
}: WidgetEditOverlayProps) {
  const isMobile = useIsMobile();
  const [sizeToast, setSizeToast] = useState<string | null>(null);

  const cycleSize = () => {
    const currentIdx = SIZE_CYCLE.indexOf(widget.size);
    const nextSize = SIZE_CYCLE[(currentIdx + 1) % SIZE_CYCLE.length];
    onResize(widget.id, nextSize);
    triggerHaptic(hapticPatterns.light);
    setSizeToast(SIZE_LABELS[nextSize]);
    setTimeout(() => setSizeToast(null), 1200);
  };

  if (!isEditMode) return <>{children}</>;

  return (
    <div
      draggable={!isMobile}
      onDragStart={(e) => onDragStart(e, widget.id)}
      onDragOver={(e) => onDragOver(e, widget.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, widget.id)}
      className={cn(
        "relative rounded-xl transition-all duration-200 group/edit",
        "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        isDragOver && "ring-primary ring-offset-4 scale-[1.01]",
        isDragging && "opacity-40 scale-[0.97]",
        isTouchDragging && "shadow-2xl scale-[1.03] z-50",
      )}
    >
      {/* Top bar: drag handle + hide button */}
      <div className={cn(
        "absolute -top-3 left-0 right-0 flex items-center justify-between z-20 px-2",
        "opacity-0 group-hover/edit:opacity-100 transition-opacity duration-150",
        // Always show on mobile in edit mode
        isMobile && "opacity-100"
      )}>
        {/* Drag handle */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium",
            "cursor-grab active:cursor-grabbing shadow-md select-none"
          )}
          onTouchStart={(e) => {
            e.stopPropagation();
            onTouchDragStart(widget.id);
          }}
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{widget.label}</span>
        </div>

        {/* Hide button */}
        <button
          onClick={() => {
            triggerHaptic(hapticPatterns.light);
            onHide(widget.id);
          }}
          className="p-1.5 rounded-full bg-destructive/90 text-destructive-foreground shadow-md hover:bg-destructive transition-colors"
          title="Hide widget"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Resize handle (bottom-right) */}
      <button
        onClick={cycleSize}
        className={cn(
          "absolute -bottom-2 -right-2 z-20 p-1.5 rounded-full shadow-md transition-all",
          "bg-accent text-accent-foreground border-2 border-background",
          "hover:bg-primary hover:text-primary-foreground",
          "opacity-0 group-hover/edit:opacity-100",
          isMobile && "opacity-100"
        )}
        title={`Resize: currently ${SIZE_LABELS[widget.size]}`}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      {/* Size toast */}
      {sizeToast && (
        <div className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-bold shadow-lg animate-in fade-in zoom-in-95 duration-150">
          {sizeToast}
        </div>
      )}

      {/* Widget content - slightly dimmed */}
      <div className="pointer-events-none opacity-80 select-none">
        {children}
      </div>
    </div>
  );
}

// --- Hidden Widgets Tray ---
interface HiddenWidgetsTrayProps {
  hiddenWidgets: WidgetConfig[];
  onRestore: (id: WidgetId) => void;
  isEditMode: boolean;
}

export function HiddenWidgetsTray({ hiddenWidgets, onRestore, isEditMode }: HiddenWidgetsTrayProps) {
  if (!isEditMode || hiddenWidgets.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs font-medium text-muted-foreground mb-3">Hidden Widgets</p>
      <div className="flex flex-wrap gap-2">
        {hiddenWidgets.map((widget) => (
          <Badge
            key={widget.id}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors gap-1.5 py-1.5 px-3 text-sm"
            onClick={() => {
              triggerHaptic(hapticPatterns.light);
              onRestore(widget.id);
            }}
          >
            <Plus className="h-3 w-3" />
            {widget.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
