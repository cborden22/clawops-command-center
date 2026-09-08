# Demo account with realistic sample data

Create a ready-to-share ClawOps demo login, fully loaded with believable data so anyone can click through the app and see how every part works.

## The login

- Email: `demo@clawops.com`
- Password: `ClawOpsDemo2026!`
- Email is pre-confirmed, so it signs in immediately with no verification step.
- The account is granted complimentary access, so there is no card prompt, no trial countdown, and every feature is unlocked.
- Everything is fully editable — visitors can add, change, and delete freely.

## What the demo will contain

A fictional operator, "Volunteer Amusements", running claw and crane machines around Knoxville / Lenoir City, TN.

- **8 locations** — realistic venue names (bowling alley, family pizza place, laundromat, movie theater, grocery, truck stop, arcade, hotel lobby) with real-looking Tennessee street addresses, contact names, phones, emails, commission rates, map coordinates, and restock schedules. One has its owner portal switched on so the public portal page can be demonstrated.
- **~22 machines** across those locations — claw machines, a boxing machine, a crane, prize vendors — each with unit codes, install dates, play cost, win probability, and per-machine commission rates (mixed 20/25/40% so the split-rate commission generator has something to show).
- **6 months of revenue and expenses** — collections per location, plus fuel, prizes, repairs, and commission payouts, with sensible seasonal variation.
- **Machine collections** — coin counts, prize counts, and meter readings tied to those revenue entries.
- **Commission statements** — several months of generated statements, some marked paid, some outstanding.
- **Location agreements** — signed revenue-share agreements with dates and terms.
- **Leads pipeline** — around 12 prospects spread across every stage, with contacts, follow-up dates, estimated machines/revenue, and an activity history of calls, emails, and visits.
- **Inventory** — a warehouse with zones, ~30 prize and supply items with SKUs, costs, stock levels, reorder points, plus stock-run history.
- **Vehicles, routes, and mileage** — a work van, two multi-stop service routes, and several months of odometer-based mileage entries.
- **Maintenance reports** — a mix of open and resolved machine issues.
- **Calendar tasks, budgets, and recurring revenue** — upcoming restocks and installs, monthly expense budgets, and recurring income lines.
- **Dashboard** will populate naturally from all of the above; the onboarding checklist will be complete and hidden.

## How it will be built

A one-time backend function, `seed-demo-account`, creates the auth user with the admin API (email pre-confirmed), then inserts all the records above with the service role so ownership and permissions are correct. It is idempotent: running it again wipes the demo user's rows and re-seeds them, which gives an easy way to reset the demo later if it gets messy.

Technical notes:
- Auth user created via `auth.admin.createUser` with `email_confirm: true`; the existing signup trigger creates the profile.
- A row is inserted into `complimentary_access` for that user with no expiry, so `check-subscription` reports `is_complimentary` and `useFeatureAccess` treats it as Pro.
- All dates are generated relative to the seeding date so the demo always looks current.
- No schema changes are required — every table already exists.
- The function is invoked once after deploy; afterwards it stays available for resets.
