

## Sales/Landing Page for ClawOps

### What This Does

Creates a standalone, public-facing landing page at `/sales` that you can share with potential customers. It lives outside the authenticated app -- no login required to view it. It showcases ClawOps features, pricing, and includes calls-to-action to sign up.

### Page Sections

1. **Hero** -- Bold headline ("Run Your Claw Machine Empire from One Dashboard"), subheadline, CTA buttons ("Get Started Free" and "See Pricing"), and a screenshot/mockup of the dashboard
2. **Feature Showcase** -- Grid of 8 feature cards highlighting the core modules:
   - Location Management (track all your locations)
   - Revenue Tracking (income/expense logging, charts)
   - Inventory Management (stock levels, restock alerts)
   - Maintenance & QR Codes (issue reporting, QR scanning)
   - Mileage Tracker (GPS, tax deductions)
   - Leads CRM (pipeline, convert to locations)
   - Business Reports (6 report categories, analytics)
   - Team Management (roles, permissions)
3. **How It Works** -- 3-step visual flow (Sign Up, Add Locations, Grow Your Business)
4. **Pricing** -- Free vs Pro comparison table with monthly/annual toggle, matching the existing tier config ($19/mo or $190/yr)
5. **Testimonials/Social Proof** -- Placeholder section for future testimonials
6. **CTA Footer** -- Final call-to-action with sign-up button

### Routing

The page is added as a public route in `App.tsx` at the top level (alongside `/report/` and `/reset-password`), outside the `AuthProvider`. This means:
- No authentication required
- URL: `https://clawops-command-center.lovable.app/sales`
- Shareable link for marketing

### Technical Details

**Files Created:**
- `src/pages/Sales.tsx` -- The full landing page component with all sections, responsive design, and dark/light mode support

**Files Modified:**
- `src/App.tsx` -- Add a `<Route path="/sales" element={<Sales />} />` in the public routes section (lines 269-274), outside the AuthProvider

**Design Approach:**
- Uses existing UI components (Button, Card, Badge) and Tailwind classes
- Matches the app's blue primary color scheme
- Fully responsive (mobile, tablet, desktop)
- "Get Started Free" and "Sign Up" buttons link to `/auth`
- Pricing section pulls tier data from `src/config/subscriptionTiers.ts` for consistency
- No external dependencies needed -- built entirely with existing components and Tailwind

