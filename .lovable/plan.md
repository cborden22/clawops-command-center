

## Create Dedicated Maintenance Page with Detailed Reports Management

This plan moves the maintenance functionality from being a Dashboard widget to its own full-featured page with sidebar navigation, detailed report views, and better management capabilities.

---

## What You'll Get

1. **New "Maintenance" link in the sidebar** - Easy access from the main navigation
2. **Dedicated Maintenance page** with tabs for:
   - **Open Issues** - Reports that need attention
   - **In Progress** - Reports being worked on
   - **Resolved** - Completed reports (history)
3. **Detailed report cards** showing:
   - Machine info (type, label, location)
   - Issue type and description
   - Severity level
   - Reporter info (name, contact)
   - Timestamps (reported, resolved)
   - Resolution notes
4. **Quick actions** - Update status, add resolution notes, delete reports
5. **Dashboard widget stays** (optional) - Can keep a compact summary on the Dashboard linking to the full page

---

## Implementation Steps

### 1. Create the Maintenance Page

**New file: `src/pages/Maintenance.tsx`**

A new page component with:
- Page header with title and stats summary (total open, in progress, resolved counts)
- Tabbed interface using the existing Tabs component:
  - **Open** tab - Shows all reports with status `open`
  - **In Progress** tab - Shows all reports with status `in_progress`
  - **Resolved** tab - Shows all reports with status `resolved`
- Detailed report cards with full information and actions
- Quick status change dropdowns
- Expandable description/notes sections
- Resolution notes input for closing reports
- Delete confirmation dialog

### 2. Add Sidebar Navigation Link

**Update: `src/components/layout/AppSidebar.tsx`**

Add a new navigation item:
- Icon: `Wrench` (from lucide-react)
- Title: "Maintenance"
- URL: `/maintenance`
- Position: After "Locations" (high visibility since it's operational)

### 3. Add Mobile Navigation Link

**Update: `src/components/layout/MobileBottomNav.tsx`**

Add "Maintenance" to the `moreTabs` array so it's accessible from the "More" menu on mobile devices.

### 4. Add Route to App.tsx

**Update: `src/App.tsx`**

Add protected route:
```
/maintenance → Maintenance page (wrapped in AppLayout + ProtectedRoute)
```

### 5. Update Dashboard Widget (Optional Enhancement)

**Update: `src/components/maintenance/MaintenanceWidget.tsx`**

Add a "View All" button that links to `/maintenance` for users who want to see the full list.

---

## Technical Details

### Page Layout Structure

```text
+--------------------------------------------------+
|  Maintenance Reports                              |
|  Manage and track machine issues                  |
+--------------------------------------------------+
|  [Open (3)]  [In Progress (1)]  [Resolved (5)]   |
+--------------------------------------------------+
|                                                   |
|  +--------------------------------------------+  |
|  | Machine: Mini Claw #1                      |  |
|  | Location: Pizza Palace                     |  |
|  | ------------------------------------------ |  |
|  | Issue: Coin Jam         Severity: [HIGH]   |  |
|  | Description: Coins keep getting stuck...   |  |
|  | ------------------------------------------ |  |
|  | Reporter: John D.  |  Phone: 555-1234      |  |
|  | Reported: Jan 30, 2:15 PM                  |  |
|  | ------------------------------------------ |  |
|  | Status: [Open ▼]     [Delete]              |  |
|  +--------------------------------------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  | (next report card...)                      |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Maintenance.tsx` | Create | New dedicated maintenance page |
| `src/components/layout/AppSidebar.tsx` | Modify | Add sidebar nav link |
| `src/components/layout/MobileBottomNav.tsx` | Modify | Add mobile nav link |
| `src/App.tsx` | Modify | Add protected route |
| `src/components/maintenance/MaintenanceWidget.tsx` | Modify | Add "View All" link |

### Existing Hook (No Changes Needed)

The `useMaintenanceReports` hook already provides everything we need:
- `reports` - All reports
- `openReports` - Filtered open reports
- `inProgressReports` - Filtered in-progress reports
- `resolvedReports` - Filtered resolved reports
- `updateReport()` - Update status/resolution
- `deleteReport()` - Delete a report
- `refetch()` - Refresh data

---

## Summary

This creates a proper Maintenance section in your app with:
- Dedicated sidebar navigation
- Full-page detailed view of all reports
- Tabbed interface for easy filtering by status
- Complete report details including reporter info
- Quick status updates and resolution management
- Mobile-friendly access through the More menu

