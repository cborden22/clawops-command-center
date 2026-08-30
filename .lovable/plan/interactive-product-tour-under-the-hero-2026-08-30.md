# Interactive Product Tour Under the Hero

Add a self-contained, interactive tour section on the public sales page, directly below the hero video/CTAs and above the existing "Everything You Need" features grid.

## What the visitor sees

A dark, gold-accented panel with:

- A vertical list of module tabs on the left (desktop) / horizontal scrollable chips on top (mobile):
  1. **Documents** — agreements, commission statements, and receipts generated and stored per location.
  2. **Machine Estimator** — project machine earnings from cost-per-play, win rate, and plays per day before you place a unit.
  3. **Lead Tracking** — Kanban pipeline from first call to signed location, converted with one click.
- A large stage on the right showing the selected module's **3 short on-screen steps**, each a numbered row with a one-line label and a short supporting sentence, revealed with a staggered fade-in when the module changes.
- A thin gold progress bar plus **Back / Next** controls and a **Play tour** toggle that auto-advances every ~5 seconds (pauses on hover, on manual interaction, and when the section is off-screen or the user prefers reduced motion).
- A "Start Free Trial" CTA pinned at the bottom of the stage.

The stage art is CSS/иconography only — stylized mock UI (a document card, a metric readout with animated numbers, a mini 3-column pipeline) built with existing design tokens. No screenshots or new image assets.

## Copy (steps per module)

Documents: 1) Pick a location → 2) Auto-fill the agreement or commission statement → 3) Export a clean one-page PDF.
Machine Estimator: 1) Enter cost per play and win rate → 2) Set expected plays per day → 3) See projected monthly revenue and payback.
Lead Tracking: 1) Add a prospect with contact and notes → 2) Drag it through the pipeline stages → 3) Convert a win into a live location.

## Technical notes

- New component `src/components/sales/ProductTour.tsx`, rendered in `src/pages/Sales.tsx` between the hero `</section>` (line 176) and the Features section.
- Local `useState` for active module index and autoplay flag; `useEffect` interval for autoplay; `IntersectionObserver` to only autoplay while visible; respect `prefers-reduced-motion`.
- Tabs use real buttons with `aria-selected` / `role="tab"` and the panel `role="tabpanel"`, keyboard arrow-key navigation.
- Styling uses existing semantic tokens (`bg-card`, `border-border`, `text-primary`, `shadow-glow`) and the `animate-fade-in` utility — no hardcoded colors.
- Icons from lucide-react (`FileText`, `Calculator`, `Target`), consistent with the rest of the page.
- Purely presentational: no data fetching, no backend changes.

## Verification

Typecheck, then load `/sales` in the browser to confirm the tour renders under the hero, tab switching and autoplay work, and layout holds at mobile and desktop widths.
