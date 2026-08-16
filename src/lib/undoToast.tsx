import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface UndoDeleteOptions {
  /** Message shown in the toast, e.g. "Prize plush deleted" */
  message: string;
  /** Runs when the grace period ends without an undo. */
  onCommit: () => void | Promise<void>;
  /** Optional local rollback (e.g. restore an optimistic UI removal). */
  onUndo?: () => void;
  /** Grace period in ms before the deletion is committed. */
  delayMs?: number;
}

/**
 * Shows a "Deleted — Undo" toast and defers the destructive action so the
 * user can back out without a confirmation dialog.
 */
export function deleteWithUndo({
  message,
  onCommit,
  onUndo,
  delayMs = 6000,
}: UndoDeleteOptions) {
  let undone = false;

  const timer = setTimeout(() => {
    if (undone) return;
    void onCommit();
  }, delayMs);

  const commitUndo = () => {
    undone = true;
    clearTimeout(timer);
    onUndo?.();
  };

  const { dismiss } = toast({
    title: message,
    description: "Undo available for a few seconds.",
    duration: delayMs,
    action: (
      <ToastAction
        altText="Undo"
        onClick={() => {
          commitUndo();
          dismiss();
        }}
      >
        Undo
      </ToastAction>
    ),
  });

  return { undo: () => { commitUndo(); dismiss(); } };
}
