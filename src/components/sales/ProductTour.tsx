import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, Target, ArrowRight, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { label: string; detail: string };
type Module = {
  id: string;
  icon: typeof FileText;
  title: string;
  blurb: string;
  steps: Step[];
  stage: "documents" | "estimator" | "leads";
};

const MODULES: Module[] = [
  {
    id: "documents",
    icon: FileText,
    title: "Documents",
    blurb: "Agreements, commission statements, and receipts generated and stored per location.",
    stage: "documents",
    steps: [
      { label: "Pick a location", detail: "Every contact, rate, and machine is already on file." },
      { label: "Auto-fill the paperwork", detail: "Agreements and commission statements build themselves." },
      { label: "Export a clean PDF", detail: "One page, front only — ready to hand to the owner." },
    ],
  },
  {
    id: "estimator",
    icon: Calculator,
    title: "Machine Estimator",
    blurb: "Project what a machine will earn before you ever place it.",
    stage: "estimator",
    steps: [
      { label: "Enter cost per play & win rate", detail: "Dial in the settings you actually run." },
      { label: "Set expected plays per day", detail: "Use foot traffic from a comparable location." },
      { label: "See revenue and payback", detail: "Know the monthly take before the machine ships." },
    ],
  },
  {
    id: "leads",
    icon: Target,
    title: "Lead Tracking",
    blurb: "A pipeline that runs from first call to signed location.",
    stage: "leads",
    steps: [
      { label: "Add a prospect", detail: "Contact, notes, and a follow-up date in seconds." },
      { label: "Move it through stages", detail: "Drag from contacted to negotiating to won." },
      { label: "Convert a win", detail: "One click turns the lead into a live location." },
    ],
  },
];

const AUTOPLAY_MS = 5000;

export default function ProductTour() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible || reducedMotion) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % MODULES.length), AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [playing, visible, reducedMotion, active]);

  const select = useCallback((i: number) => {
    setActive((i + MODULES.length) % MODULES.length);
    setPlaying(false);
  }, []);

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const next = (active + dir + MODULES.length) % MODULES.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const mod = MODULES[active];

  return (
    <section
      ref={sectionRef}
      aria-label="ClawOps product tour"
      className="border-y border-border bg-muted/30 py-16 sm:py-24"
      onMouseEnter={() => setPlaying(false)}
    >
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Take the Tour</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Three of the modules you'll use every week — and exactly how they work.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_20px_80px_-30px_hsl(var(--primary)/0.45)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,17rem)_1fr]">
            {/* Tabs */}
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Product modules"
              onKeyDown={onTabKeyDown}
              className="flex gap-2 overflow-x-auto border-b border-border p-3 scrollbar-hide lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-4"
            >
              {MODULES.map((m, i) => {
                const selected = i === active;
                return (
                  <button
                    key={m.id}
                    ref={(el) => (tabRefs.current[i] = el)}
                    role="tab"
                    id={`tour-tab-${m.id}`}
                    aria-selected={selected}
                    aria-controls={`tour-panel-${m.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    className={cn(
                      "relative shrink-0 rounded-xl border px-4 py-3 text-left transition-colors lg:w-full",
                      selected
                        ? "border-primary/40 bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-muted/60"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <m.icon className={cn("h-4 w-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-semibold whitespace-nowrap", selected && "text-primary")}>
                        {m.title}
                      </span>
                    </span>
                    <span className="mt-1 hidden text-xs text-muted-foreground lg:block">{m.blurb}</span>
                    {selected && !reducedMotion && playing && visible && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden rounded-full bg-primary/15">
                        <span
                          key={active}
                          className="block h-full bg-primary"
                          style={{ animation: `tour-progress ${AUTOPLAY_MS}ms linear forwards` }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stage */}
            <div
              role="tabpanel"
              id={`tour-panel-${mod.id}`}
              aria-labelledby={`tour-tab-${mod.id}`}
              className="flex flex-col gap-6 p-5 sm:p-8"
            >
              <div key={mod.id} className="grid gap-6 md:grid-cols-2">
                <ol className="space-y-4">
                  {mod.steps.map((s, i) => (
                    <li
                      key={s.label}
                      className="flex gap-3 animate-fade-in"
                      style={{ animationDelay: `${i * 90}ms`, animationFillMode: "backwards" }}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{s.label}</span>
                        <span className="block text-sm text-muted-foreground">{s.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                  <StageArt kind={mod.stage} />
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label="Previous module" onClick={() => select(active - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Next module" onClick={() => select(active + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    aria-pressed={playing}
                    onClick={() => setPlaying((p) => !p)}
                  >
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {playing ? "Pause tour" : "Play tour"}
                  </Button>
                </div>
                <Button asChild>
                  <Link to="/auth?tab=signup&trial=true">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes tour-progress { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
}

function StageArt({ kind }: { kind: Module["stage"] }) {
  if (kind === "documents") {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Commission Statement</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">PDF</span>
        </div>
        <div className="space-y-2">
          {["Riverside Arcade", "March 1 – March 31", "Gross plays · $2,480", "Owner share (25%) · $620"].map((r, i) => (
            <div key={r} className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs">
              <span className={i > 1 ? "text-muted-foreground" : "font-medium"}>{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 w-2/3 rounded-full bg-primary/30" />
      </div>
    );
  }

  if (kind === "estimator") {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Cost per play", "$1.00"],
            ["Win rate", "1 in 18"],
            ["Plays / day", "42"],
            ["Payback", "3.1 mo"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
              <div className="mt-1 text-base font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-primary">Projected monthly revenue</div>
          <div className="text-2xl font-extrabold tabular-nums text-primary">$1,260</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background/60 p-4">
      {[
        ["New", 2],
        ["Negotiating", 3],
        ["Won", 1],
      ].map(([label, count], col) => (
        <div key={label as string} className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          {Array.from({ length: count as number }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-8 rounded-md border",
                col === 2 ? "border-primary/40 bg-primary/15" : "border-border bg-muted/60"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
