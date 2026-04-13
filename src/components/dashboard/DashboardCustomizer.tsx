import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pencil, RotateCcw, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetSize } from "@/hooks/useUserPreferences";
import { triggerHaptic, hapticPatterns } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type WidgetId = 'primaryStats' | 'weeklyCalendar' | 'collectionDue' | 'allTimeSummary' | 'topLocations' | 'lowStockAlerts' | 'recentTransactions' | 'quickActions' | 'maintenance' | 'leads' | 'businessHealth' | 'budgetTracking';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
}

const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: 'sm', label: '⅓ width' },
  { value: 'md', label: '½ width' },
  { value: 'lg', label: '⅔ width' },
  { value: 'full', label: 'Full width' },
];

const SIZE_TO_COLS: Record<WidgetSize, number> = { sm: 4, md: 6, lg: 8, full: 12 };

// --- Layout Preview ---
interface LayoutPreviewProps {
  widgets: WidgetConfig[];
  highlightedWidgetId: WidgetId | null;
  onHighlight: (id: WidgetId | null) => void;
}

function LayoutPreview({ widgets, highlightedWidgetId, onHighlight }: LayoutPreviewProps) {
  const visible = widgets.filter(w => w.visible);
  
  const rows: WidgetConfig[][] = [];
  let currentRow: WidgetConfig[] = [];
  let currentCols = 0;
  
  for (const w of visible) {
    const cols = SIZE_TO_COLS[w.size];
    if (currentCols + cols > 12 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [w];
      currentCols = cols;
    } else {
      currentRow.push(w);
      currentCols += cols;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  if (rows.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Layout Preview</p>
      <div className="space-y-1">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((w) => {
              const cols = SIZE_TO_COLS[w.size];
              const isHl = highlightedWidgetId === w.id;
              return (
                <div
                  key={w.id}
                  className={cn(
                    "rounded border px-1.5 py-1 truncate text-[10px] leading-tight transition-all cursor-pointer",
                    isHl
                      ? "bg-primary/20 border-primary ring-1 ring-primary text-primary font-semibold"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                  style={{ width: `${(cols / 12) * 100}%` }}
                  onPointerEnter={() => onHighlight(w.id)}
                  onPointerLeave={() => onHighlight(null)}
                >
                  {w.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- FAB to open customizer ---
interface CustomizerFABProps {
  onOpen: () => void;
}

export function CustomizerFAB({ onOpen }: CustomizerFABProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50",
      isMobile ? "bottom-24 right-4" : "bottom-6 right-6"
    )}>
      <Button
        size="icon"
        className={cn(
          "rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground",
          isMobile ? "h-14 w-14" : "h-12 w-12"
        )}
        onClick={() => {
          triggerHaptic(hapticPatterns.medium);
          onOpen();
        }}
        title="Customize dashboard"
      >
        <Pencil className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
      </Button>
    </div>
  );
}

// --- Widget Row in the customizer ---
interface WidgetRowProps {
  widget: WidgetConfig;
  index: number;
  total: number;
  visibleIndex: number | null;
  onToggle: (id: WidgetId) => void;
  onResize: (id: WidgetId, size: WidgetSize) => void;
  onMoveUp: (id: WidgetId) => void;
  onMoveDown: (id: WidgetId) => void;
  onHighlight: (id: WidgetId | null) => void;
  isHighlighted: boolean;
}

function WidgetRow({ widget, index, total, visibleIndex, onToggle, onResize, onMoveUp, onMoveDown, onHighlight, isHighlighted }: WidgetRowProps) {
  return (
    <div
      className={cn(
        "py-3 px-1 space-y-2 transition-all rounded-lg",
        !widget.visible && "opacity-50",
        isHighlighted && "bg-primary/10"
      )}
      onPointerEnter={() => widget.visible && onHighlight(widget.id)}
      onPointerLeave={() => onHighlight(null)}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        {visibleIndex !== null && (
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
            {visibleIndex}
          </span>
        )}
        <span className="text-sm font-medium flex-1 truncate">{widget.label}</span>
        <Switch
          checked={widget.visible}
          onCheckedChange={() => {
            triggerHaptic(hapticPatterns.light);
            onToggle(widget.id);
          }}
        />
      </div>
      {widget.visible && (
        <div className="flex items-center gap-2 pl-7">
          <Select
            value={widget.size}
            onValueChange={(val) => onResize(widget.id, val as WidgetSize)}
          >
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              onClick={() => {
                triggerHaptic(hapticPatterns.light);
                onMoveUp(widget.id);
              }}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === total - 1}
              onClick={() => {
                triggerHaptic(hapticPatterns.light);
                onMoveDown(widget.id);
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Drawer/Sheet Customizer ---
interface DashboardCustomizerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onResize: (id: WidgetId, size: WidgetSize) => void;
  onMoveUp: (id: WidgetId) => void;
  onMoveDown: (id: WidgetId) => void;
  onReset: () => void;
  highlightedWidgetId: WidgetId | null;
  onHighlight: (id: WidgetId | null) => void;
}

export function DashboardCustomizerDrawer({
  open,
  onOpenChange,
  widgets,
  onToggle,
  onResize,
  onMoveUp,
  onMoveDown,
  onReset,
  highlightedWidgetId,
  onHighlight,
}: DashboardCustomizerDrawerProps) {
  const isMobile = useIsMobile();

  // Compute visible indices
  let visibleCounter = 0;
  const visibleIndexMap = new Map<WidgetId, number>();
  widgets.forEach(w => {
    if (w.visible) {
      visibleCounter++;
      visibleIndexMap.set(w.id, visibleCounter);
    }
  });

  const content = (
    <div className="flex flex-col h-full">
      <LayoutPreview widgets={widgets} highlightedWidgetId={highlightedWidgetId} onHighlight={onHighlight} />
      <Separator />
      <ScrollArea className="flex-1 px-4">
        <div className="divide-y divide-border">
          {widgets.map((widget, index) => (
            <WidgetRow
              key={widget.id}
              widget={widget}
              index={index}
              total={widgets.length}
              visibleIndex={visibleIndexMap.get(widget.id) ?? null}
              onToggle={onToggle}
              onResize={onResize}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onHighlight={onHighlight}
              isHighlighted={highlightedWidgetId === widget.id}
            />
          ))}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            triggerHaptic(hapticPatterns.medium);
            onReset();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Customize Dashboard</DrawerTitle>
            <DrawerDescription>Toggle, resize, and reorder your widgets.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>Toggle, resize, and reorder your widgets.</SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
