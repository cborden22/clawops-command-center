

## Share Owner's Subscription with Team Members

### What This Does

Currently, when a team member logs in, the system checks **their own** Stripe account for a subscription -- which they won't have. This change makes team members automatically inherit their owner's subscription status, so only the account owner needs to pay.

### How It Works

The `check-subscription` edge function will be updated with one additional step:

1. Authenticate the user (existing)
2. Check the user's own complimentary access (existing)
3. **NEW: If no personal subscription found, check if the user is a team member and look up the owner's subscription instead**
4. Check the user's own Stripe subscription (existing)

### Changes

**File Modified: `supabase/functions/check-subscription/index.ts`**

After the complimentary access check and before checking Stripe for the current user, add logic to:

1. Query `team_members` table for an active membership where `member_user_id = user.id`
2. If found, get the `owner_user_id`
3. Check complimentary access for the owner
4. Look up the owner's email from the `profiles` table
5. Check Stripe subscription using the **owner's email** instead of the team member's email
6. Return the subscription status with an `is_team_member: true` flag so the frontend knows

This means:
- Owner subscribes to Pro --> all their team members automatically get Pro access
- Owner cancels --> team members lose Pro access too
- No frontend changes needed -- `useSubscription` already consumes the `subscribed` boolean from this function

**No other files need to change.** The `useSubscription` hook, `useFeatureAccess` hook, and all UI components already work off the `subscribed` response from this function.

### Technical Detail

```text
check-subscription flow:

User logs in
    |
    v
Check own complimentary_access --> found & valid? --> return subscribed=true
    |
    v (not found)
Query team_members for active membership
    |
    +--> IS team member --> get owner_user_id
    |       |
    |       v
    |    Check owner's complimentary_access --> found? --> return subscribed=true
    |       |
    |       v (not found)
    |    Get owner email from profiles table
    |       |
    |       v
    |    Check Stripe for owner's email --> active sub? --> return subscribed=true
    |       |
    |       v
    |    return subscribed=false
    |
    +--> NOT team member --> Check own Stripe (existing logic)
```

