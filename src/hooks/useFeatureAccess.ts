import { useSubscription } from "./useSubscription";
import { TIERS } from "@/config/subscriptionTiers";

export function useFeatureAccess() {
  const subscription = useSubscription();

  const isPro = subscription.isSubscribed || subscription.isComplimentary;
  const tier = isPro ? TIERS.PRO : TIERS.FREE;

  const canAddLocation = (currentCount: number) => currentCount < tier.maxLocations;
  const canAddTeamMember = (currentCount: number) => currentCount < tier.maxTeamMembers;

  return {
    isPro,
    isComplimentary: subscription.isComplimentary,
    maxLocations: tier.maxLocations,
    maxTeamMembers: tier.maxTeamMembers,
    canAddLocation,
    canAddTeamMember,
    isLoading: subscription.isLoading,
    subscriptionEnd: subscription.subscriptionEnd,
    refreshSubscription: subscription.refreshSubscription,
  };
}
