# Reminders for Lead Follow-ups & Installation Deadlines

Nothing slips: a single reminders system that watches lead follow-up dates and installation deadlines, surfaces them in-app, and sends one daily email digest.

## What gets tracked

1. **Lead follow-ups** — the existing follow-up date on each lead (open leads only; won/lost are ignored).
2. **Target install date on leads** — a new date field on a lead, meant for the install you promised after closing. Shown in the lead form and lead detail.
3. **Machines never marked installed** — machines on a location that still have no install date recorded get flagged as an open installation task.

## In-app experience

- **Bell icon** in the desktop header and mobile header with an unread-style count badge of everything currently due, upcoming, or overdue.
- **Notification panel** listing each item with type icon, title (business or location/machine), date, and an "Overdue / Due today / In N days" label. Clicking an item jumps to the lead or location.
- Each item can be **snoozed** (push the reminder out) or **dismissed** so it stops appearing without changing the underlying date.
- **Dashboard widget** "Upcoming & Overdue" showing the next few items, matching existing widget styling and included in the dashboard customizer.

## Configuration (Settings → Notifications)

- **Lead time in days before due** — separate values for lead follow-ups and installation deadlines (e.g. remind me 3 days before). Defaults to 3.
- **Per-type toggles** — turn lead follow-up reminders and installation reminders on/off independently.
- **Email digest toggle** — reuses the existing email notification preference; digest only goes to users who have it on.

## Daily email digest

One email per user per day, only when there is something due, upcoming, or overdue. Grouped into "Overdue" and "Coming up", each line linking back into the app. Sent by a scheduled job that runs once a day; nothing is sent when there's nothing to report.

## Technical notes

- **Migration**
  - `leads.target_install_date` (date, nullable).
  - `reminder_preferences` table: `user_id`, per-type enabled flags, `lead_followup_days_before`, `install_days_before`, timestamps. RLS scoped to `auth.uid()`, with GRANTs for `authenticated` and `service_role`.
  - `reminder_dismissals` table: `user_id`, `source_type` (`lead_followup` | `lead_install` | `machine_install`), `source_id`, `snoozed_until` (nullable), `dismissed_at`. Unique on (`user_id`, `source_type`, `source_id`). Same RLS/GRANT pattern.
- **`src/hooks/useReminders.ts`** — derives reminder items client-side from `useLeadsDB` and `useLocationsDB` (memoized per the project's performance pattern), applies preferences, filters dismissals/snoozes, and returns grouped `overdue` / `today` / `upcoming` lists plus a count.
- **`src/hooks/useReminderPreferences.ts`** — read/write of the preferences row with sane defaults when absent.
- **UI**: `src/components/notifications/NotificationBell.tsx` (popover on desktop, sheet on mobile), `NotificationList.tsx`, `src/components/dashboard/RemindersWidget.tsx`; wired into `AppLayout`/`MobileHeader`, `Dashboard.tsx`, `DashboardCustomizer`, and a Notifications section in `Settings.tsx`.
- **Lead form**: add the target install date input to `LeadForm.tsx` / `LeadDetailDialog.tsx` with a help tooltip.
- **Email**: new `send-reminder-digest` edge function using the service role to compute per-owner due items and send via the existing Resend setup and ClawOps branding, scheduled daily with pg_cron + pg_net. Respects `profiles.email_notifications_enabled`, per-type toggles, and dismissals.
- No GPS/native APIs; all dates handled with the existing timezone-safe date-only parsing.
