import { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReminders } from "@/hooks/useReminders";
import { NotificationList } from "./NotificationList";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { count } = useReminders();

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "relative flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors",
        isMobile ? "p-3 min-w-[44px] min-h-[44px] touch-manipulation active:scale-95" : "h-8 w-8 border border-border bg-card hover:bg-accent/10",
        className
      )}
      aria-label={count > 0 ? `${count} reminders` : "Reminders"}
    >
      <Bell className="h-5 w-5 md:h-4 md:w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle>Reminders</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <NotificationList onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Reminders</p>
          <p className="text-xs text-muted-foreground">Follow-ups and installation deadlines</p>
        </div>
        <ScrollArea className="max-h-[420px]">
          <NotificationList onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
