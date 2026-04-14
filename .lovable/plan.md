

## Update Sales Page to Reflect New Trial-Based Subscription Model

### Problem
The sales page still references a "Free" tier and "Get Started Free" messaging. With the new mandatory 7-day trial model, there is no longer a permanent free tier for new users. The pricing section shows two plans (Free + Pro) when it should now show a single Pro plan with a 7-day free trial.

### Changes — `src/pages/Sales.tsx`

**1. Hero section** — Update CTAs:
- "Get Started Free" → "Start Your Free Trial"
- Subtitle updated to mention the 7-day trial

**2. How It Works steps** — Update to match the trial flow:
- Step 1: "Start Your Free Trial" / "Sign up and get 7 days of full access. No charge until your trial ends."
- Step 2: "Set Up Your Operation" / "Add locations, machines, inventory, and start tracking everything."
- Step 3: "Grow Your Business" / "Use reports, leads, and analytics to optimize revenue and scale."

**3. Pricing section** — Replace the two-card (Free/Pro) layout with a single centered Pro card:
- Remove the `freeFeatures` array and Free card entirely
- Update heading from "Start free. Upgrade when you're ready." → "Try everything free for 7 days. Cancel anytime."
- Keep the Monthly/Annual toggle
- Single Pro card with updated feature list:
  - Unlimited locations
  - Up to 5 team members
  - Revenue & expense tracking
  - Inventory with restock alerts
  - Maintenance & QR codes
  - Mileage tracking with GPS
  - Leads CRM pipeline
  - Business reports & analytics
  - Commission summaries
- CTA button: "Start 7-Day Free Trial"
- Subtext: "No charge during your trial. Cancel anytime."

**4. CTA footer** — Update wording:
- "Get Started Free" → "Start Your Free Trial"
- Subtitle mentions the trial

**5. Remove unused imports/arrays**: `freeFeatures`, `proFeatures` arrays removed and replaced with the single `allFeatures` list.

### No other files are modified. This is a content-only update to `Sales.tsx`.

