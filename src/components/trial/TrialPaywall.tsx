import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Crown, CreditCard, Loader2, Shield, MapPin, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIERS } from "@/config/subscriptionTiers";
import { toast } from "@/hooks/use-toast";

export function TrialPaywall() {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleStartTrial = async () => {
    setIsCheckingOut(true);
    try {
      const priceId = billingAnnual
        ? TIERS.PRO.annual.price_id
        : TIERS.PRO.monthly.price_id;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, trial: true },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const features = [
    { icon: MapPin, label: "Unlimited locations" },
    { icon: Users, label: "Up to 5 team members" },
    { icon: BarChart3, label: "Full reports & analytics" },
    { icon: Shield, label: "All features included" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Start Your Free Trial</h1>
            <p className="text-muted-foreground">
              Try ClawOps Pro free for 7 days. No charge until your trial ends.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="trial-billing" className="text-sm">Monthly</Label>
            <Switch
              id="trial-billing"
              checked={billingAnnual}
              onCheckedChange={setBillingAnnual}
            />
            <Label htmlFor="trial-billing" className="text-sm">Annual</Label>
            {billingAnnual && (
              <Badge variant="secondary" className="text-xs">Save $38/yr</Badge>
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">
              {billingAnnual
                ? `$${TIERS.PRO.annual.amount}/year`
                : `$${TIERS.PRO.monthly.amount}/month`}
            </p>
            <p className="text-xs text-muted-foreground">
              after your 7-day free trial
            </p>
          </div>

          <Button
            onClick={handleStartTrial}
            disabled={isCheckingOut}
            className="w-full gap-2"
            size="lg"
          >
            {isCheckingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Start 7-Day Free Trial
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime during your trial and you won't be charged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
