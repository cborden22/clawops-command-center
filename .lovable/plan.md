

## Feature Improvement Ideas for ClawOps

After analyzing the full codebase, here are high-impact features that would make ClawOps significantly better:

---

### 1. Photo Documentation per Location/Machine
Add the ability to attach photos to locations, machines, and maintenance reports. Operators could snap a photo of each machine during collections to document condition, prize display quality, or issues. Photos stored in backend file storage, viewable in location detail and maintenance views.

---

### 2. Collection Streak & Performance Insights
Add a "Business Health" widget to the dashboard showing:
- Revenue per machine per week (identify underperformers)
- Collection streak tracking (days since last missed collection)
- Month-over-month growth percentage per location
- Average revenue per play calculation using coin count + cost per play data already in `machine_collections`

---

### 3. Expense Categories with Budget Tracking
The revenue tracker logs expenses but has no budgeting. Add monthly budget targets per expense category (prizes, fuel, repairs, rent) with progress bars on the dashboard. Alert when a category is approaching or exceeds budget. Uses existing `revenue_entries` data with a new `expense_budgets` table.

---

### 4. Location Map View
Add a map visualization showing all locations as pins, color-coded by performance (green = above average revenue, yellow = needs attention, red = overdue collection). Uses location addresses to geocode. Provides a spatial overview of the business territory.

---

### 5. Recurring Revenue Automation
Allow users to set up recurring revenue entries for locations with predictable income (e.g., flat-fee locations). Auto-generate entries on a schedule so operators don't need to manually log every collection for fixed-rate agreements. Ties into existing `location_agreements` data.

---

### 6. Export & Sharing Improvements
- One-tap PDF export of any report period for accountants
- Shareable read-only dashboard link for business partners/investors
- Automated weekly email summary of key metrics (revenue, maintenance alerts, low stock)

---

### 7. Prize Win Rate Analytics
The app already tracks `coins_inserted` and `prizes_won` in `machine_collections`. Build a dedicated analytics view showing:
- Win rate trends over time per machine
- Cost-per-prize analysis
- Optimal win rate recommendations based on revenue data
- Comparison across machine types

---

### 8. Dark/Light Mode Toggle
The app appears to use a dark glass-card theme. Adding an explicit dark/light mode toggle in Settings (and respecting system preference) would improve usability in different environments, especially for operators working in bright locations.

---

### Recommended Priority Order
1. **Photo Documentation** - Operators photograph machines constantly; this saves them from using a separate app
2. **Collection Streak & Performance Insights** - Turns raw data into actionable business intelligence
3. **Location Map View** - Visual spatial awareness is huge for route planning
4. **Expense Budget Tracking** - Helps profitability management
5. **Win Rate Analytics** - Leverages data already being collected

