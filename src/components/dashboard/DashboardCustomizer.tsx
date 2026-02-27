 import { useState, useRef, useCallback } from "react";
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { GripVertical, Eye, EyeOff, RotateCcw, X } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { WidgetSize } from "@/hooks/useUserPreferences";
 
 type WidgetId = 'primaryStats' | 'weeklyCalendar' | 'collectionDue' | 'allTimeSummary' | 'topLocations' | 'lowStockAlerts' | 'recentTransactions' | 'quickActions' | 'maintenance' | 'leads' | 'businessHealth' | 'budgetTracking';
 
 interface WidgetConfig {
   id: WidgetId;
   label: string;
   visible: boolean;
   size: WidgetSize;
 }
 
 interface DashboardCustomizerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   widgets: WidgetConfig[];
   onWidgetsChange: (widgets: WidgetConfig[]) => void;
   onReset: () => void;
 }
 
 const SIZE_OPTIONS: { value: WidgetSize; label: string; description: string }[] = [
   { value: 'sm', label: '⅓ Small', description: 'Fits 3 per row' },
   { value: 'md', label: '½ Half', description: 'Fits 2 per row' },
   { value: 'lg', label: '⅔ Large', description: 'Fits 1.5 per row' },
   { value: 'full', label: 'Full', description: 'Takes entire row' },
 ];
 
 export function DashboardCustomizer({
   open,
   onOpenChange,
   widgets,
   onWidgetsChange,
   onReset,
 }: DashboardCustomizerProps) {
   const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
   const containerRef = useRef<HTMLDivElement>(null);
 
   const toggleVisibility = (id: WidgetId) => {
     onWidgetsChange(
       widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
     );
   };
 
   const updateSize = (id: WidgetId, size: WidgetSize) => {
     onWidgetsChange(
       widgets.map(w => w.id === id ? { ...w, size } : w)
     );
   };
 
   const handleDragStart = (e: React.DragEvent, index: number) => {
     setDraggedIndex(index);
     e.dataTransfer.effectAllowed = 'move';
     // Make the drag image slightly transparent
     if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.style.opacity = '0.5';
     }
   };
 
   const handleDragEnd = (e: React.DragEvent) => {
     if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.style.opacity = '1';
     }
     setDraggedIndex(null);
     setDragOverIndex(null);
   };
 
   const handleDragOver = (e: React.DragEvent, index: number) => {
     e.preventDefault();
     if (draggedIndex !== null && draggedIndex !== index) {
       setDragOverIndex(index);
     }
   };
 
   const handleDragLeave = () => {
     setDragOverIndex(null);
   };
 
   const handleDrop = (e: React.DragEvent, targetIndex: number) => {
     e.preventDefault();
     if (draggedIndex === null || draggedIndex === targetIndex) return;
 
     const newWidgets = [...widgets];
     const [removed] = newWidgets.splice(draggedIndex, 1);
     newWidgets.splice(targetIndex, 0, removed);
     onWidgetsChange(newWidgets);
 
     setDraggedIndex(null);
     setDragOverIndex(null);
   };
 
   // Touch support
   const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
   const touchStartY = useRef<number>(0);
   const touchCurrentY = useRef<number>(0);
 
   const handleTouchStart = (e: React.TouchEvent, index: number) => {
     setTouchDragIndex(index);
     touchStartY.current = e.touches[0].clientY;
   };
 
   const handleTouchMove = useCallback((e: React.TouchEvent) => {
     if (touchDragIndex === null || !containerRef.current) return;
     
     touchCurrentY.current = e.touches[0].clientY;
     const container = containerRef.current;
     const items = container.querySelectorAll('[data-widget-item]');
     
     let newIndex = touchDragIndex;
     items.forEach((item, index) => {
       const rect = item.getBoundingClientRect();
       const centerY = rect.top + rect.height / 2;
       if (touchCurrentY.current > centerY && index > touchDragIndex) {
         newIndex = index;
       } else if (touchCurrentY.current < centerY && index < touchDragIndex) {
         newIndex = index;
       }
     });
     
     if (newIndex !== dragOverIndex) {
       setDragOverIndex(newIndex);
     }
   }, [touchDragIndex, dragOverIndex]);
 
   const handleTouchEnd = () => {
     if (touchDragIndex !== null && dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
       const newWidgets = [...widgets];
       const [removed] = newWidgets.splice(touchDragIndex, 1);
       newWidgets.splice(dragOverIndex, 0, removed);
       onWidgetsChange(newWidgets);
     }
     setTouchDragIndex(null);
     setDragOverIndex(null);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
         <SheetHeader className="mb-6">
           <SheetTitle className="flex items-center gap-2">
             <GripVertical className="h-5 w-5 text-primary" />
             Customize Dashboard
           </SheetTitle>
           <SheetDescription>
             Drag to reorder widgets, toggle visibility, and adjust sizes.
           </SheetDescription>
         </SheetHeader>
 
         <div 
           ref={containerRef}
           className="space-y-2"
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}
         >
           {widgets.map((widget, index) => (
             <div
               key={widget.id}
               data-widget-item
               draggable
               onDragStart={(e) => handleDragStart(e, index)}
               onDragEnd={handleDragEnd}
               onDragOver={(e) => handleDragOver(e, index)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => handleDrop(e, index)}
               onTouchStart={(e) => handleTouchStart(e, index)}
               className={cn(
                 "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all duration-200",
                 draggedIndex === index && "opacity-50 scale-[0.98]",
                 dragOverIndex === index && "ring-2 ring-primary border-primary",
                 touchDragIndex === index && "shadow-lg scale-[1.02]",
                 !widget.visible && "opacity-60 bg-muted/50"
               )}
             >
               {/* Drag Handle */}
               <div 
                 className="p-1 cursor-grab active:cursor-grabbing touch-none"
                 title="Drag to reorder"
               >
                 <GripVertical className="h-5 w-5 text-muted-foreground" />
               </div>
 
               {/* Widget Label */}
               <div className={cn(
                 "flex-1 font-medium text-sm",
                 !widget.visible && "line-through text-muted-foreground"
               )}>
                 {widget.label}
               </div>
 
               {/* Visibility Toggle */}
               <button
                 onClick={() => toggleVisibility(widget.id)}
                 className={cn(
                   "p-2 rounded-md transition-colors",
                   widget.visible 
                     ? "hover:bg-muted text-foreground" 
                     : "hover:bg-muted text-muted-foreground"
                 )}
                 title={widget.visible ? "Hide widget" : "Show widget"}
                 aria-label={widget.visible ? "Hide widget" : "Show widget"}
               >
                 {widget.visible ? (
                   <Eye className="h-4 w-4" />
                 ) : (
                   <EyeOff className="h-4 w-4" />
                 )}
               </button>
 
               {/* Size Dropdown */}
               <Select 
                 value={widget.size} 
                 onValueChange={(size: WidgetSize) => updateSize(widget.id, size)}
               >
                 <SelectTrigger className="w-24 h-9">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {SIZE_OPTIONS.map(option => (
                     <SelectItem key={option.value} value={option.value}>
                       <span className="font-medium">{option.label}</span>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           ))}
         </div>
 
         {/* Drop indicator helper text */}
         <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
           <p className="text-xs text-muted-foreground text-center">
             💡 Tip: Hidden widgets won't show on your dashboard but can be restored anytime.
           </p>
         </div>
 
         {/* Actions */}
         <div className="flex gap-3 mt-6">
           <Button 
             variant="outline" 
             className="flex-1 gap-2"
             onClick={onReset}
           >
             <RotateCcw className="h-4 w-4" />
             Reset to Default
           </Button>
           <Button 
             className="flex-1"
             onClick={() => onOpenChange(false)}
           >
             Done
           </Button>
         </div>
       </SheetContent>
     </Sheet>
   );
 }