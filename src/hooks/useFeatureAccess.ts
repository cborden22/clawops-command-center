import { useSubscription } from "./useSubscription";
import { TIERS, TRIAL_CUTOFF_DATE } from "@/config/subscriptionTiers";

export function useFeatureAccess() {
  const subscription = useSubscription();

  const isPro = subscription.isSubscribed || subscription.isComplimentary;
  const tier = isPro ? TIERS.PRO : TIERS.FREE;

  // Determine if this user was created after the cutoff and has no subscription
  const isNewUser =
    subscription.userCreatedAt &&
    new Date(subscription.userCreatedAt) >= new Date(TRIAL_CUTOFF_DATE);

  const requiresTrialCheckout =
    !subscription.isLoading &&
    !!isNewUser &&
    !subscription.isSubscribed &&
    !subscription.isComplimentary;

  const canAddLocation = (currentCount: number) => currentCount < tier.maxLocations;
  const canAddTeamMember = (currentCount: number) => currentCount < tier.maxTeamMembers;

  return {
    isPro,
    isTrial: subscription.isTrial,
    trialEnd: subscription.trialEnd,
    isComplimentary: subscription.isComplimentary,
    maxLocations: tier.maxLocations,
    maxTeamMembers: tier.maxTeamMembers,
    canAddLocation,
    canAddTeamMember,
    isLoading: subscription.isLoading,
    subscriptionEnd: subscription.subscriptionEnd,
    refreshSubscription: subscription.refreshSubscription,
    requiresTrialCheckout,
  };
}
