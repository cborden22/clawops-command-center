

## Mobile-Only Polish: Vertical Calendar, Bottom Nav, and Spacing

### 1. Weekly Calendar Widget — Vertical on Mobile
Currently a 7-column horizontal grid that's cramped on 390px screens. On mobile, switch to a vertical stacked list where each day is a full-width row with the date label on the left and tasks on the right.

**File: `src/components/dashboard/WeeklyCalendarWidget.tsx`**
- Import `useIsMobile` hook
- When mobile: render a vertical list of day rows instead of the 7-col grid. Each row shows the day label + date number on the left, and task pills flowing horizontally on the right
- Desktop stays unchanged (7-col grid)

### 2. Bottom Nav — Replace Revenue with Locations
**File: `src/components/layout/MobileBottomNav.tsx`**
- Change the `allMainTabs` entry from `{ path: "/revenue", icon: DollarSign, label: "Revenue" }` to `{ path: "/locations", icon: MapPin, label: "Locations" }`
- Update the permissions filter: check `canViewLocations` instead of `canViewRevenue`

### 3. Dashboard Spacing — Fix Edge-Hugging Cards
**File: `src/pages/Dashboard.tsx`**
- The dashboard root `div` has no horizontal padding on mobile. The container pages like Locations use `px-4` via their own container. Dashboard renders directly — add `px-4` to the outer wrapper so widgets don't touch screen edges.

