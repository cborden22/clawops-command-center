

## Stripe Subscription Integration: Free + Pro Tiers with Annual Discount and Complimentary Access

### What This Does

Adds a subscription system with two tiers and two billing cycles, plus the ability to grant free Pro access:

- **Free** ($0/mo): 3 locations, 1 team member
- **Pro Monthly** ($19/mo): Unlimited locations, 5 team members
- **Pro Annual** ($190/year -- equivalent to ~$15.83/mo, 2 months free): Same Pro features
- **Complimentary Access**: You can grant free Pro access to specific users via a database flag (e.g., for friends, beta testers, contest winners)

### How It Works

1. Two Stripe prices are created for the Pro product: monthly ($19) and annual ($190)
2. Three backend functions handle checkout, subscription checking, and portal access
3. The `check-subscription` function also checks for a `complimentary_access` database flag, granting Pro without payment
4. A `useSubscription` hook provides subscription state app-wide
5. A `useFeatureAccess` hook enforces limits on locations and team members
6. A "Subscription" section in Settings shows current plan with monthly/annual toggle and upgrade/manage options
7. Gating logic blocks adding locations/team members when limits are reached

---

### Technical Details

**Step 1: Create Stripe Products and Prices**

Using Stripe tools (not code), create:
- Product: "ClawOps Pro"
- Price 1: $19/month (recurring monthly)
- Price 2: $190/year (recurring yearly -- 10 months instead of 12, saving ~$38/year)

**Step 2: Database table for complimentary access**

```sql
CREATE TABLE public.complimentary_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by text,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

With RLS so only the user can read their own record. You grant access by inserting a row directly via the backend SQL runner. If `expires_at` is null, access is permanent. This keeps it simple -- no admin UI needed, just a database entry.

**Step 3: Three Edge Functions**

| Function | Purpose |
|----------|---------|
| `create-checkout` | Creates a Stripe Checkout session. Accepts a `priceId` parameter so the frontend can pass either the monthly or annual price. Authenticates user, finds/creates Stripe customer, returns checkout URL |
| `check-subscription` | Looks up Stripe customer by email for active subscription. Also checks the `complimentary_access` table -- if a valid (non-expired) row exists, returns `subscribed: true` even without a Stripe subscription |
| `customer-portal` | Creates a Stripe Customer Portal session for cancel/update/switch between monthly and annual |

**Step 4: Tier Constants -- `src/config/subscriptionTiers.ts`**

```text
FREE:  { maxLocations: 3, maxTeamMembers: 1 }
PRO:   {
  maxLocations: Infinity,
  maxTeamMembers: 5,
  monthly: { price_id: "price_xxx", amount: 19 },
  annual:  { price_id: "price_yyy", amount: 190, savings: "2 months free" },
  product_id: "prod_xxx"
}
```

**Step 5: Frontend Hooks**

- `src/hooks/useSubscription.ts` -- Calls `check-subscription` on login, page load, and every 60 seconds. Stores `isSubscribed`, `isComplimentary`, `productId`, `subscriptionEnd`, `isLoading`.
- `src/hooks/useFeatureAccess.ts` -- Reads from `useSubscription`. Provides `maxLocations`, `maxTeamMembers`, `canAddLocation(count)`, `canAddTeamMember(count)`. Complimentary users get full Pro limits.

**Step 6: UI -- `src/components/settings/SubscriptionManager.tsx`**

- Shows current plan (Free, Pro Monthly, Pro Annual, or Complimentary)
- For Free users: monthly/annual toggle with pricing, "Upgrade" button
- Annual option highlighted with "Save $38/year -- 2 months free" badge
- For Pro users: plan details, end date, "Manage Subscription" button (opens Stripe portal)
- For complimentary users: "Pro (Complimentary)" badge, no billing controls

**Step 7: Gating Integration**

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Add SubscriptionManager card |
| `src/components/LocationTrackerComponent.tsx` | Check `canAddLocation()` before "Add Location"; show upgrade prompt if blocked |
| `src/components/team/InviteMemberDialog.tsx` | Check `canAddTeamMember()` before inviting; show upgrade prompt if blocked |
| `supabase/config.toml` | Register three new edge functions with `verify_jwt = false` |

**No changes to `App.tsx` routing** -- gating is at the action level, not page level.

### Complimentary Access Workflow

To grant free access, run this in your backend SQL runner:

```text
INSERT INTO complimentary_access (user_id, granted_by, reason)
VALUES ('<user-uuid>', 'admin', 'Beta tester');
```

To set an expiration:

```text
INSERT INTO complimentary_access (user_id, granted_by, reason, expires_at)
VALUES ('<user-uuid>', 'admin', 'Contest winner', '2026-06-01');
```

### User Flow

```text
User signs up --> Free tier (3 locations, 1 team member)
       |
       v
Hits limit --> "Upgrade to Pro" prompt (monthly/annual toggle)
       |
       +--> Monthly ($19/mo) --> Stripe Checkout --> Pro unlocked
       |
       +--> Annual ($190/yr, 2 months free) --> Stripe Checkout --> Pro unlocked
       |
       v
Settings --> "Manage Subscription" --> Stripe Portal (cancel, switch plan, update card)

--- OR ---

Admin grants complimentary_access row --> User gets Pro for free
```

### Files Created

- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useFeatureAccess.ts`
- `src/config/subscriptionTiers.ts`
- `src/components/settings/SubscriptionManager.tsx`

### Files Modified

- `src/pages/Settings.tsx` -- add SubscriptionManager component
- `src/components/LocationTrackerComponent.tsx` -- add location limit check
- `src/components/team/InviteMemberDialog.tsx` -- add team member limit check
- `supabase/config.toml` -- register new edge functions

### Database Migration

- New table: `complimentary_access` with RLS policy restricting reads to the owning user

