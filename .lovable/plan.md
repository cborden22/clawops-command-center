

## Optional Nayax Integration for Card Payment Tracking

This plan implements a fully optional Nayax integration that allows you to:
1. Enter a Nayax Telemetry ID on each machine for API mapping
2. Mark machines as "Credit Card Enabled" (online) or "Offline" (cash only)
3. Connect your Nayax account in Settings to sync card payment data
4. View card payments alongside cash collections in revenue reports

The integration is **completely optional** - users without Nayax can ignore it entirely.

---

## Part 1: Database Schema Updates

### New Columns on `location_machines` Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `nayax_machine_id` | TEXT | null | Nayax Machine ID (Telemetry ID) |
| `is_card_enabled` | BOOLEAN | false | Whether machine accepts credit cards |
| `last_nayax_sync` | TIMESTAMPTZ | null | Last sync timestamp |

### New Table: `nayax_settings` (Per-User API Configuration)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference (unique) |
| `is_connected` | BOOLEAN | Whether integration is active |
| `last_sync` | TIMESTAMPTZ | Last successful sync |
| `created_at` | TIMESTAMPTZ | When connected |
| `updated_at` | TIMESTAMPTZ | Last update |

### New Table: `nayax_transactions` (Synced Transactions)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference |
| `machine_id` | UUID | FK to location_machines |
| `nayax_transaction_id` | TEXT | Unique Nayax transaction ID |
| `transaction_date` | TIMESTAMPTZ | When transaction occurred |
| `amount` | NUMERIC | Transaction amount |
| `payment_method` | TEXT | Visa, Mastercard, etc. |
| `nayax_machine_id` | TEXT | Nayax machine identifier |
| `raw_data` | JSONB | Full API response |
| `synced_at` | TIMESTAMPTZ | When imported |
| `revenue_entry_id` | UUID | If converted to revenue entry |

RLS policies will ensure users can only access their own data.

---

## Part 2: Machine Management UI Updates

### Updated Machine Add/Edit Dialog

Add a new "Payment Options" section below the existing fields:

```
┌─────────────────────────────────────────────────────────┐
│ Payment Options                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Credit Card Enabled                                  │
│   This machine accepts card payments via Nayax          │
│                                                         │
│ Nayax Machine ID (Telemetry ID)                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 942488501                                           │ │
│ └─────────────────────────────────────────────────────┘ │
│ Find this in Nayax Core > Machines > Overview          │
│                                                         │
│ ⚠️ Connect Nayax in Settings to sync sales data        │
│    (only shows if not connected)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Updated Machines Table

Add a "Status" column showing online/offline:

| Machine | Type | Location | Status | Count | Actions |
|---------|------|----------|--------|-------|---------|
| Big Claw | Claw | Joe's Bar | 🟢 Card Enabled | 1 | ... |
| Mini Claw | Mini Claw | Joe's Bar | ⚪ Cash Only | 2 | ... |

- Green dot + "Card Enabled" for `is_card_enabled: true`
- Gray dot + "Cash Only" for `is_card_enabled: false`
- Show Nayax ID as tooltip on hover if set

---

## Part 3: Settings - Integrations Tab

### New "Integrations" Tab in Settings

Add a 4th tab alongside App, Profile, and Security:

```
┌────────┬─────────┬──────────┬──────────────┐
│  App   │ Profile │ Security │ Integrations │
└────────┴─────────┴──────────┴──────────────┘
```

### Nayax Integration Card (Not Connected State)

```
┌─────────────────────────────────────────────────────┐
│ 💳 Nayax Integration                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Connect your Nayax account to automatically sync    │
│ credit card transactions from your machines.        │
│                                                     │
│ Status: ○ Not Connected                             │
│                                                     │
│ API Token                                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Paste your Nayax API token here                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Connect to Nayax]                                  │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ How to get your API Token:                          │
│ 1. Log in to Nayax Core                             │
│ 2. Click on your name → Settings                    │
│ 3. Go to Security and Login tab                     │
│ 4. Under User Tokens, click "Show Token"            │
│ 5. Copy and paste it here                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Nayax Integration Card (Connected State)

```
┌─────────────────────────────────────────────────────┐
│ 💳 Nayax Integration                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Status: ● Connected                                 │
│ Last sync: Today at 3:45 PM                         │
│ Machines linked: 5                                  │
│                                                     │
│ [Sync Now]  [Disconnect]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Part 4: Backend Edge Function

### Create `sync-nayax-transactions` Edge Function

**File:** `supabase/functions/sync-nayax-transactions/index.ts`

**Endpoints:**
- `POST /validate-token` - Validate Nayax API token
- `POST /sync` - Sync transactions for all connected machines
- `GET /status` - Get connection status

**Sync Flow:**
1. Authenticate the user via Supabase auth header
2. Retrieve user's Nayax API token from encrypted secrets
3. Get all machines with `nayax_machine_id` set
4. For each machine, call Nayax Lynx API
5. Parse transactions and check for duplicates
6. Insert new transactions to `nayax_transactions` table
7. Optionally create `revenue_entries` for new transactions
8. Update `last_nayax_sync` on machines
9. Return summary

**Nayax Lynx API:**
- Base URL: `https://lynx.nayax.com/operational/api/v1`
- Auth: Bearer token
- Endpoint: `GET /machines/{MachineID}/lastSales`

---

## Part 5: Revenue Integration

### Add Card/Cash Breakdown to Revenue Tracker

Show payment method breakdown in the revenue summary:

```
┌─────────────────────────────────────────────────────┐
│ Revenue Breakdown                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 💵 Cash Collections        $1,245.00  (62%)        │
│ 💳 Card Payments           $  760.00  (38%)        │
│ ──────────────────────────────────────────────────  │
│    Total Revenue           $2,005.00               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

This only appears if the user has Nayax connected and has card transactions.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| **Database Migration** | Create | Add columns to `location_machines`, create `nayax_settings` and `nayax_transactions` tables with RLS |
| `src/hooks/useLocationsDB.ts` | Modify | Add `nayaxMachineId`, `isCardEnabled`, `lastNayaxSync` to `MachineType` |
| `src/components/MachinesManager.tsx` | Modify | Add checkbox for card enabled, input for Nayax ID, status column |
| `src/hooks/useNayaxIntegration.ts` | Create | Hook for managing Nayax settings and triggering syncs |
| `src/components/settings/NayaxIntegration.tsx` | Create | Settings UI component for Nayax connection |
| `src/pages/Settings.tsx` | Modify | Add "Integrations" tab with Nayax component |
| `supabase/functions/sync-nayax-transactions/index.ts` | Create | Edge function for Nayax API communication |

---

## Implementation Order

1. **Database Migration** - Add new columns and tables
2. **Update `useLocationsDB`** - Add new fields to MachineType interface and database mapping
3. **Update `MachinesManager`** - Add form fields and table column
4. **Create `useNayaxIntegration` hook** - API token storage and sync triggering
5. **Create `NayaxIntegration` component** - Settings UI
6. **Update Settings page** - Add Integrations tab
7. **Create edge function** - Nayax API integration
8. **Update revenue components** - Show card/cash split (if time permits)

---

## Security Considerations

### API Token Storage
- Nayax API token stored as a Supabase secret per user
- Never exposed to frontend code
- Only accessed within edge functions using service role

### RLS Policies
- `nayax_settings`: Users can only view/edit their own settings
- `nayax_transactions`: Users can only access their own transactions

### Rate Limiting
- Edge function includes rate limiting to prevent API abuse
- Respects Nayax API rate limits

---

## User Experience Notes

### Optional by Design
- All Nayax fields are optional - non-users are unaffected
- "Cash Only" is the default state for all machines
- Integration tab only shows a simple "Connect" flow

### Clear Guidance
- Instructions for finding API token in Nayax Core
- Instructions for finding Machine ID in Nayax
- Warning indicators if connected but machines not mapped

### Graceful Degradation
- If Nayax API is down, show last sync time
- Failed syncs don't break existing functionality
- Clear error messages for common issues

