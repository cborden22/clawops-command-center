import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useLocationsDB";
import { useLeadsDB } from "@/hooks/useLeadsDB";
import { useInventory } from "@/hooks/useInventoryDB";
import { useMyTeamPermissions } from "@/hooks/useMyTeamPermissions";

const DISMISS_KEY = "clawops_onboarding_dismissed";

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  const { locations, isLoaded: locationsLoaded } = useLocations();
  const { leads, isLoading: leadsLoading } = useLeadsDB();
  const { items, isLoaded: inventoryLoaded } = useInventory();
  const permissions = useMyTeamPermissions();

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      /* ignore storage errors */
    }
    setDismissed(true);
  };

  if (dismissed) return null;
  if (permissions.isLoading || !locationsLoaded || leadsLoading || !inventoryLoaded) return null;

  const steps = [
    {
      id: "location",
      allowed: permissions.canViewLocations,
      done: locations.length > 0,
      title: "Add your first location",
      description: "Set up the venue where your machines live.",
      to: "/locations",
      cta: "Add location",
    },
    {
      id: "lead",
      allowed: permissions.canViewLeads,
      done: leads.length > 0,
      title: "Add your first lead",
      description: "Track a prospective venue in your pipeline.",
      to: "/leads",
      cta: "Add lead",
    },
    {
      id: "inventory",
      allowed: permissions.canViewInventory,
      done: items.length > 0,
      title: "Add your first inventory item",
      description: "Log the prizes and supplies you keep in stock.",
      to: "/inventory",
      cta: "Add inventory",
    },
  ].filter((step) => step.allowed);

  if (steps.length === 0) return null;

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (allDone) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Rocket className="h-4 w-4 text-primary shrink-0" />
            Get started
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {completed} of {steps.length} complete
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Dismiss onboarding checklist"
          className="h-11 w-11 shrink-0 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>

        <ul className="space-y-2">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.title}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <Button asChild size="sm" variant="outline" className="shrink-0 min-h-[44px] sm:min-h-0">
                  <Link to={step.to}>
                    <span className="hidden sm:inline">{step.cta}</span>
                    <ArrowRight className="h-4 w-4 sm:ml-1" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
