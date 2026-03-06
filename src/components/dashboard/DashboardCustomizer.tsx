import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, Plus, Check, Pencil, RotateCcw, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetSize } from "@/hooks/useUserPreferences";
import { triggerHaptic, hapticPatterns } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";

type WidgetId = 'primaryStats' | 'weeklyCalendar' | 'collectionDue' | 'allTimeSummary' | 'topLocations' | 'lowStockAlerts' | 'recentTransactions' | 'quickActions' | 'maintenance' | 'leads' | 'businessHealth' | 'budgetTracking';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  sm: '⅓ width',
  md: '½ width',
  lg: '⅔ width',
  full: 'Full width',
};

// Map a percentage (0-1) of grid width to the nearest size
const BREAKPOINTS: { threshold: number; size: WidgetSize }[] = [
  { threshold: 0.29, size: 'sm' },   // ~4/12
  { threshold: 0.46, size: 'md' },   // ~6/12
  { threshold: 0.62, size: 'lg' },   // ~8/12
  { threshold: 0.85, size: 'full' }, // 12/12
];

function percentToSize(pct: number): WidgetSize {
  if (pct < BREAKPOINTS[0].threshold) return 'sm';
  if (pct < BREAKPOINTS[1].threshold) return 'sm';
  if (pct < BREAKPOINTS[2].threshold) return 'md';
  if (pct < BREAKPOINTS[3].threshold) return 'lg';
  return 'full';
}

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
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef<WidgetSize>(widget.size);

  // Drag-to-resize: find the grid parent width and map cursor X to a size
  const handleResizeStart = useCallback((startX: number, startY: number) => {
    setIsResizing(true);
    lastSizeRef.current = widget.size;

    const gridEl = containerRef.current?.parentElement?.parentElement;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();

    const onMove = (clientX: number) => {
      const relativeX = clientX - gridRect.left;
      const pct = Math.max(0, Math.min(1, relativeX / gridRect.width));
      const newSize = percentToSize(pct);
      if (newSize !== lastSizeRef.current) {
        lastSizeRef.current = newSize;
        onResize(widget.id, newSize);
        triggerHaptic(hapticPatterns.light);
        setSizeToast(SIZE_LABELS[newSize]);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      onMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      onMove(e.touches[0].clientX);
    };

    const cleanup = () => {
      setIsResizing(false);
      setSizeToast(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', cleanup);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', cleanup);
      document.removeEventListener('touchcancel', cleanup);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', cleanup);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', cleanup);
    document.addEventListener('touchcancel', cleanup);
  }, [widget.id, widget.size, onResize]);

  if (!isEditMode) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      draggable={!isMobile && !isResizing}
      onDragStart={(e) => onDragStart(e, widget.id)}
      onDragOver={(e) => onDragOver(e, widget.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, widget.id)}
      className={cn(
        "relative rounded-xl transition-all group/edit",
        "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        isDragOver && "ring-primary ring-offset-4 scale-[1.01]",
        isDragging && "opacity-40 scale-[0.97]",
        isTouchDragging && "shadow-2xl scale-[1.03] z-50",
        isResizing && "z-50 ring-primary",
        !isResizing && "duration-200",
      )}
    >
      {/* Top bar: drag handle + hide button */}
      <div className={cn(
        "absolute -top-3 left-0 right-0 flex items-center justify-between z-20 px-2",
        "opacity-0 group-hover/edit:opacity-100 transition-opacity duration-150",
        isMobile && "opacity-100"
      )}>
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

      {/* Drag-to-resize handle (bottom-right) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleResizeStart(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          const touch = e.touches[0];
          handleResizeStart(touch.clientX, touch.clientY);
        }}
        className={cn(
          "absolute -bottom-2 -right-2 z-20 p-2 rounded-full shadow-md transition-all",
          "bg-accent text-accent-foreground border-2 border-background",
          "hover:bg-primary hover:text-primary-foreground",
          "cursor-ew-resize select-none touch-none",
          "opacity-0 group-hover/edit:opacity-100",
          isMobile && "opacity-100",
          isResizing && "bg-primary text-primary-foreground scale-125 opacity-100"
        )}
        title="Drag left/right to resize"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </div>

      {/* Live size indicator while dragging */}
      {sizeToast && (
        <div className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-bold shadow-lg animate-in fade-in zoom-in-95 duration-150">
          {sizeToast}
        </div>
      )}

      {/* Widget content - slightly dimmed */}
      <div className={cn(
        "pointer-events-none opacity-80 select-none",
        isResizing && "opacity-60"
      )}>
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