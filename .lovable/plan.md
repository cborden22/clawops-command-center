

## Reorganize Sidebar Navigation with 2 Collapsible Groups

This plan keeps Dashboard as a standalone top-level item and organizes the remaining tools into 2 collapsible groups for a cleaner interface.

---

## Final Structure

| Section | Items | Purpose |
|---------|-------|---------|
| **Dashboard** (standalone) | Dashboard | Central hub - always visible at top |
| **Operations** (collapsible) | Locations, Maintenance, Routes, Inventory Tracker | Day-to-day operational tasks |
| **Financials & Reports** (collapsible) | Revenue Tracker, Reports, Commission Summary, Location Agreement Generator | Money tracking, analytics, and documentation |

### Visual Structure

```text
+----------------------------------+
|  ClawOps                         |
|  Professional Suite              |
+----------------------------------+
|                                  |
|  > Dashboard                     |
|                                  |
|  OPERATIONS              [v]     |
|    > Locations                   |
|    > Maintenance                 |
|    > Routes                      |
|    > Inventory Tracker           |
|                                  |
|  FINANCIALS & REPORTS    [v]     |
|    > Revenue Tracker             |
|    > Reports                     |
|    > Commission Summary          |
|    > Agreement Generator         |
|                                  |
+----------------------------------+
|  [User Profile]                  |
+----------------------------------+
```

---

## What You'll Get

1. **Dashboard always visible** - One-click access to the main hub
2. **2 collapsible groups** - Operations and Financials sections expand/collapse
3. **Auto-expand active section** - The group containing the current page stays open
4. **Cleaner visual hierarchy** - 9 items condensed into 3 visual sections
5. **Chevron indicators** - Show expand/collapse state for each group

---

## Implementation Details

### File Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/components/layout/AppSidebar.tsx` | Modify | Add 2 collapsible groups below Dashboard |
| `src/components/layout/MobileBottomNav.tsx` | Modify | Group items in "More" menu with section headers |

### Sidebar Implementation

**Structure:**
- Dashboard as standalone `NavLink` at the top (no group wrapper)
- Operations group using `Collapsible` component with `ChevronDown` toggle
- Financials & Reports group using `Collapsible` component with `ChevronDown` toggle

**Behavior:**
- Groups auto-expand when they contain the active route (using `useLocation`)
- Clicking group header toggles open/closed state
- Smooth animation on expand/collapse using existing `CollapsibleContent`
- Active item styling preserved within groups

**Group Items:**

Operations:
- Locations (MapPin icon)
- Maintenance (Wrench icon)
- Routes (Car icon)
- Inventory Tracker (Package icon)

Financials & Reports:
- Revenue Tracker (DollarSign icon)
- Reports (BarChart3 icon)
- Commission Summary (Receipt icon)
- Location Agreement Generator (FileText icon)

### Mobile Navigation Update

The "More" sheet will show items grouped under section headers:
- **Operations** section with its 4 items
- Divider
- **Financials & Reports** section with its 4 items
- Divider
- Settings and Sign Out at bottom

---

## Technical Approach

Uses the existing `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` components from `@radix-ui/react-collapsible` (already in the project).

State management:
- Track which groups are open with `useState`
- Auto-open logic based on `location.pathname` matching any item in the group
- Persist user's manual open/close preference during session

