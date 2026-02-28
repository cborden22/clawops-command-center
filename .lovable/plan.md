

## Remaining Features to Implement

Based on analysis, 3 features from the plan are not yet implemented:

### Already Complete
- Photo Documentation (PhotoGallery.tsx, useLocationPhotos.ts)
- Business Health / Performance Insights (BusinessHealthWidget, useBusinessHealth)
- Expense Budget Tracking (BudgetManager, BudgetTrackingWidget, useExpenseBudgets)
- Win Rate Analytics (WinRateReports.tsx)
- Dark/Light Mode Toggle (AppSettingsContext darkMode in Settings)

### Feature 4: Location Map View
- Create `src/pages/LocationMap.tsx` with an interactive map using **Leaflet + OpenStreetMap** (free, no API key)
- Install `leaflet` and `react-leaflet` packages
- Color-code location pins: green (above avg revenue), yellow (needs attention), red (overdue collection)
- Clicking a pin shows location name, machine count, last collection date, and revenue
- Add "Map" link to sidebar under Operations
- Add route `/map` in App.tsx

### Feature 5: Recurring Revenue Automation
- Create `recurring_revenue` database table: `id, user_id, location_id, amount, frequency (weekly/biweekly/monthly), category, next_due_date, is_active, notes, created_at`
- RLS policies matching existing user-owned table pattern
- Create `src/hooks/useRecurringRevenue.ts` for CRUD operations
- Add UI in Revenue Tracker page: a "Recurring" tab or section to manage recurring entries
- Add a "Generate Due Entries" button that creates revenue entries for all past-due recurring items
- Link to location agreements' flat_fee data when available

### Feature 6: One-Tap PDF Export for Reports
- Add a "Export PDF" button next to the existing "Export CSV" and "Print" buttons in `DateRangeFilter.tsx`
- Use existing `pdfGenerator.ts` utility (jspdf + html2canvas) to capture the current report tab content
- Capture the visible report content as a PDF with proper formatting and date range in filename

### Implementation Steps
1. Add `leaflet` and `react-leaflet` dependencies
2. Create DB migration for `recurring_revenue` table with RLS
3. Create LocationMap page component with Leaflet integration
4. Create useRecurringRevenue hook
5. Add recurring revenue UI section in Revenue Tracker
6. Add PDF export button to DateRangeFilter
7. Wire up routes and sidebar navigation

