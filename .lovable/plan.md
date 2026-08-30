# Legal & Compliance Layer for ClawOps

Add the standard legal documents, consent flows, and data-rights tooling a paid SaaS is expected to have. Entity: **Course Money LLC (DBA ClawOps)**.

## 1. Legal pages (public, no login)

New routes, linked from the sales page footer, the app footer/settings, and the signup screen:

- `/legal/terms` — Terms of Service: subscription and 7-day trial terms, card-on-file billing, auto-renewal, cancellation, acceptable use, customer data ownership, service availability (no uptime guarantee), limitation of liability, indemnity, governing law, changes to terms.
- `/legal/privacy` — Privacy Policy: what is collected (account info, business/location data, photos, GPS/odometer trip data, payment metadata held by Stripe), why, legal bases, who it is shared with (Stripe, Resend, hosting/database, map/geocoding services), retention, security measures, user rights (access, export, correction, deletion), children's data, international transfers, contact.
- `/legal/cookies` — Cookie & local storage notice: essential session/auth storage, app preferences, offline queue — no advertising trackers.
- `/legal/refunds` — Billing & Refund Policy: trial rules, monthly/annual charges, cancellation effective at period end, refund stance.
- `/legal/subprocessors` — table of third-party processors (Stripe, Resend, hosting/database provider, OpenStreetMap/OSRM) with purpose and data categories.
- `/legal/dpa` — Data Processing Addendum for business customers, referencing the subprocessor list.
- `/legal/security` — plain-language security overview: encrypted transport, row-level data isolation, private file storage with expiring links, role-based team permissions, vulnerability reporting contact.

All pages share one `LegalLayout` (title, "Last updated" date, back link, print-friendly typography) so wording stays consistent and easy to update.

## 2. Consent at signup

- Required checkbox on the signup form: "I agree to the Terms of Service and Privacy Policy" with inline links opening in a new tab. Signup button disabled until checked.
- Store consent as an audit record: policy version and timestamp saved on the user's profile at signup.
- A single `LEGAL_VERSION` constant drives both the pages and the stored consent, so future policy updates are detectable.

## 3. Cookie/consent banner

Lightweight bottom banner on public pages (sales, portal, legal, auth) with a short notice, "Got it" accept, and a link to the cookie notice. Dismissal stored locally; not shown again. Because only essential storage is used, there is no opt-out toggle to build.

## 4. User data rights in-app

In Settings, a "Privacy & Data" section:
- **Export my data** — downloads a JSON/CSV bundle of the signed-in owner's locations, machines, revenue, inventory, leads, mileage, and maintenance records.
- **Delete my account** — typed confirmation, warning that data is unrecoverable and any active subscription must be cancelled, then removes the account and its data.
- Links to all legal pages and the current accepted policy version.

## 5. Public-facing trust details

- Footer on the sales page and owner portal with Terms, Privacy, Cookies, Refunds, Contact, and the entity line "© Course Money LLC (DBA ClawOps)".
- Business contact address/email block on the legal pages (needed for card-network and app-store style compliance).
- Meta description/title per legal page and a `noindex` exception check so they remain indexable.

## Technical notes

- Pages are plain React route components under `src/pages/legal/`, registered as public routes in `App.tsx` alongside `/sales` and `/p/:token`.
- Consent columns added to `profiles` (`terms_accepted_version`, `terms_accepted_at`) via a migration; existing users are prompted with a one-time acceptance dialog on next login when the stored version is behind `LEGAL_VERSION`.
- Account deletion runs through a new edge function using the service role (auth user removal cannot happen from the browser); cascading deletes handle the owned rows.
- Data export reuses existing hooks and the current CSV helper, zipping nothing — one JSON file plus per-module CSVs.

## What I need from you

- Business mailing address and the support/privacy contact email to print on the policies.
- Governing-law state for Course Money LLC (assumed the state of formation unless you say otherwise).

The documents will be thorough and industry-standard, but they are templates — have a lawyer review before you rely on them.
