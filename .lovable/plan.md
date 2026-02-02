

## State-of-the-Art CRM & Leads Management System

Build a comprehensive lead tracking and customer relationship management module for ClawOps that allows users to capture, nurture, and convert leads into active machine locations.

---

## Feature Overview

```text
+------------------------------------------+
|              LEADS PIPELINE              |
+------------------------------------------+
|  NEW  →  CONTACTED  →  NEGOTIATING  →  WON/LOST  |
|  (5)      (3)          (2)             (1)       |
+------------------------------------------+
             ↓ Convert to Location
+------------------------------------------+
|         LOCATION CREATION                |
|   (Pre-filled from lead data)            |
+------------------------------------------+
```

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| Lead Pipeline | Visual kanban-style board with drag-and-drop status updates |
| Lead Cards | Business info, contact details, potential revenue, follow-up dates |
| Activity Timeline | Log calls, emails, site visits, notes with timestamps |
| Priority Tags | Manual priority setting (hot, warm, cold) |
| Convert to Location | One-click conversion that pre-fills location creation form |
| Dashboard Widget | Leads overview with conversion metrics on main dashboard |
| Mobile Optimized | Full functionality on iOS/Android with touch-friendly UI |

---

## Database Schema

### New Table: `leads`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (RLS) |
| business_name | text | Potential location name |
| address | text | Business address |
| contact_name | text | Primary contact |
| contact_phone | text | Phone number |
| contact_email | text | Email address |
| status | text | new, contacted, negotiating, won, lost |
| priority | text | hot, warm, cold (user-set) |
| estimated_machines | integer | Potential machine count |
| estimated_revenue | numeric | Monthly revenue estimate |
| source | text | How lead was found (referral, cold call, etc.) |
| next_follow_up | timestamptz | Scheduled follow-up date |
| notes | text | General notes |
| created_at | timestamptz | When lead was added |
| updated_at | timestamptz | Last modification |
| converted_location_id | uuid | Link to location if converted |

### New Table: `lead_activities`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lead_id | uuid | Foreign key to leads |
| user_id | uuid | Who logged the activity |
| activity_type | text | call, email, meeting, site_visit, note |
| description | text | Activity details |
| created_at | timestamptz | When activity occurred |

---

## New Files to Create

### Pages
- `src/pages/Leads.tsx` - Main CRM page with pipeline view

### Components
- `src/components/leads/LeadsPipeline.tsx` - Kanban board component
- `src/components/leads/LeadCard.tsx` - Individual lead card
- `src/components/leads/LeadDetailDialog.tsx` - Full lead details with activity timeline
- `src/components/leads/LeadForm.tsx` - Add/edit lead form
- `src/components/leads/ConvertToLocationDialog.tsx` - Conversion wizard
- `src/components/leads/LeadActivityTimeline.tsx` - Activity history
- `src/components/leads/LeadFilters.tsx` - Filter and search controls
- `src/components/dashboard/LeadsWidget.tsx` - Dashboard summary widget

### Hooks
- `src/hooks/useLeadsDB.ts` - Lead CRUD operations and state management

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/leads` route |
| `src/components/layout/AppSidebar.tsx` | Add "Leads" to Operations menu |
| `src/components/layout/MobileBottomNav.tsx` | Add Leads to More menu |
| `src/pages/Dashboard.tsx` | Add LeadsWidget to widget options |

---

## UI/UX Design

### Pipeline View (Desktop)
```text
+-------------+-------------+-------------+-------------+-------------+
|    NEW      |  CONTACTED  | NEGOTIATING |    WON      |    LOST     |
|     (5)     |     (3)     |     (2)     |     (1)     |     (0)     |
+-------------+-------------+-------------+-------------+-------------+
| +---------+ | +---------+ | +---------+ | +---------+ |             |
| |Joe's    | | |Pizza    | | |Mall     | | |Cinema   | |             |
| |Arcade   | | |Palace   | | |Food Crt | | |Lobby    | |             |
| |Hot      | | |Tom S.   | | |5 mach   | | |Converted| |             |
| |3 mach   | | |2 mach   | | |         | | |         | |             |
| +---------+ | +---------+ | +---------+ | +---------+ |             |
| +---------+ | +---------+ | +---------+ |             |             |
| |Family   | | |Bowl-o   | | |Arcade   | |             |             |
| |Fun Ctr  | | |-rama    | | |World    | |             |             |
| +---------+ | +---------+ | +---------+ |             |             |
+-------------+-------------+-------------+-------------+-------------+
```

### Lead Detail View
```text
+---------------------------------------------+
| Joe's Arcade                    [Edit] [X]  |
+---------------------------------------------+
| Address: 123 Main St, Downtown              |
| Contact: Joe Smith                          |
| Phone: 555-1234  Email: joe@arcade.com      |
+---------------------------------------------+
| Status: NEW        Priority: Hot            |
| Est. Machines: 3   Est. Revenue: $450/mo    |
| Source: Referral   Next Follow-up: Feb 5    |
+---------------------------------------------+
| ACTIVITY TIMELINE                           |
| -----------------------------------------   |
| Call - Feb 1 - Called, left voicemail       |
| Email - Jan 28 - Sent intro email           |
| Note - Jan 25 - Added lead from trade show  |
+---------------------------------------------+
| [Log Activity]  [Convert to Location]       |
+---------------------------------------------+
```

---

## Convert to Location Flow

When user clicks "Convert to Location":

1. Confirmation dialog appears with pre-filled data from lead
2. User can adjust details before creating location
3. Location is created with all lead data transferred
4. Lead status automatically updates to "won"
5. `converted_location_id` links lead to new location
6. User is prompted to add machines to the new location

---

## Dashboard Widget

New "Leads Overview" widget showing:
- Total leads by status
- Follow-ups due today
- Recently added leads
- Quick link to full Leads page

---

## Security

- RLS policies ensure users only see their own leads
- All CRUD operations require authenticated user
- Activity logs tied to user_id for audit trail

---

## Implementation Order

1. Database: Create `leads` and `lead_activities` tables with RLS
2. Hook: Build `useLeadsDB.ts` with full CRUD operations
3. Components: Create lead UI components (pipeline, cards, dialogs)
4. Page: Build main Leads page with routing
5. Navigation: Add to sidebar and mobile nav
6. Conversion: Implement lead-to-location conversion flow
7. Dashboard: Add leads widget
8. Polish: Add animations, mobile optimization, empty states

