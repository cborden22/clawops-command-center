import { cn } from "@/lib/utils";
import { BULK_TYPES, LOW_FILL, money, type BulkMachine } from "@/lib/bulkVending";

interface Props { machine: BulkMachine; selected?: boolean; compact?: boolean; onClick?: () => void }

/** Mini vending head: glass globe with product + fill bar, red base with price. */
export function BulkMachineHead({ machine, selected, compact, onClick }: Props) {
  const t = BULK_TYPES[machine.machine_type];
  const low = machine.fill_percent < LOW_FILL;
  const globeH = compact ? (t.tall ? 64 : 48) : t.tall ? 96 : 68;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg p-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "w-16" : "w-20",
        selected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted/60",
      )}
      aria-label={`${machine.product_name || "Unlabeled"}, ${machine.fill_percent}% full`}
    >
      <div
        className="relative w-full overflow-hidden rounded-t-[999px] rounded-b-md border border-border bg-muted/40"
        style={{ height: globeH }}
      >
        <div
          className={cn("absolute inset-x-0 bottom-0 transition-all", low ? "bg-destructive/40" : "")}
          style={{ height: `${machine.fill_percent}%`, background: low ? undefined : `color-mix(in srgb, ${t.swatch} 45%, transparent)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-1">
          <span className={cn("text-center text-[10px] font-medium leading-tight line-clamp-3 break-words", !machine.product_name && "italic text-muted-foreground")}>
            {machine.product_name || "Unlabeled"}
          </span>
        </div>
        <span className={cn("absolute right-1 top-1 text-[9px] tabular-nums", low ? "text-destructive font-semibold" : "text-muted-foreground")}>
          {machine.fill_percent}%
        </span>
      </div>
      <div className="w-full rounded-b-md bg-destructive py-0.5 text-center text-[11px] font-semibold tabular-nums text-destructive-foreground">
        {money(machine.vend_price)}
      </div>
    </button>
  );
}
