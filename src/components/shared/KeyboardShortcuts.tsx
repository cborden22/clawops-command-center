import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Command, Search, ArrowRight, Question, CornerDownLeft } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Cmd", "K"], description: "Open command palette" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close dialogs / palettes" },
  { keys: ["/"], description: "Focus search on list pages" },
  { keys: ["N"], description: "Open primary add action on supported pages" },
];

export function useKeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5 text-primary" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, idx) => (
                  <kbd
                    key={key}
                    className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border bg-muted px-1.5 text-xs font-medium"
                  >
                    {key === "Cmd" ? (
                      <Command className="h-3.5 w-3.5" />
                    ) : key === "Enter" ? (
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    ) : (
                      key
                    )}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Question className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Shortcuts are disabled while typing in form fields so you can enter
            values like "?" without triggering commands.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
