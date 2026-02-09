import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Crown, CreditCard, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { TIERS } from "@/config/subscriptionTiers";
import { toast } from "@/hooks/use-toast";

export function SubscriptionManager() {
  const {
    isPro,
    isComplimentary,
    subscriptionEnd,
    isLoading,
    refreshSubscription,
  } = useFeatureAccess();
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const priceId = billingAnnual
        ? TIERS.PRO.annual.price_id
        : TIERS.PRO.monthly.price_id;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
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

  const handleManage = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open billing portal.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your ClawOps plan and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div>
            <p className="font-medium">Current Plan</p>
            <p className="text-sm text-muted-foreground">
              {isComplimentary
                ? "Pro features granted — no billing required"
                : isPro
                ? `Pro plan active${subscriptionEnd ? ` · Renews ${new Date(subscriptionEnd).toLocaleDateString()}` : ""}`
                : `Free · ${TIERS.FREE.maxLocations} locations, ${TIERS.FREE.maxTeamMembers} team member`}
            </p>
          </div>
          {isComplimentary ? (
            <Badge variant="secondary" className="gap-1">
              <Gift className="h-3 w-3" /> Complimentary
            </Badge>
          ) : isPro ? (
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Crown className="h-3 w-3" /> Pro
            </Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>

        {/* Upgrade section for Free users */}
        {!isPro && !isComplimentary && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
              <Switch
                id="billing-toggle"
                checked={billingAnnual}
                onCheckedChange={setBillingAnnual}
              />
              <Label htmlFor="billing-toggle" className="text-sm">Annual</Label>
              {billingAnnual && (
                <Badge variant="secondary" className="text-xs">
                  Save $38/yr
                </Badge>
              )}
            </div>

            <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 text-center space-y-2">
              <p className="text-2xl font-bold">
                {billingAnnual
                  ? `$${TIERS.PRO.annual.amount}/year`
                  : `$${TIERS.PRO.monthly.amount}/month`}
              </p>
              {billingAnnual && (
                <p className="text-sm text-muted-foreground">
                  ~$15.83/mo — 2 months free
                </p>
              )}
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited locations</li>
                <li>✓ Up to 5 team members</li>
                <li>✓ All features included</li>
              </ul>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={isCheckingOut}
              className="w-full gap-2"
            >
              {isCheckingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* Manage section for Pro users */}
        {isPro && !isComplimentary && (
          <Button
            variant="outline"
            onClick={handleManage}
            disabled={isOpeningPortal}
            className="w-full gap-2"
          >
            {isOpeningPortal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage Subscription
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSubscription}
          className="w-full text-xs text-muted-foreground"
        >
          Refresh subscription status
        </Button>
      </CardContent>
    </Card>
  );
}
