
## Improvements to CRM, Leads Responsiveness, and Maintenance System

This plan addresses three key issues: fixing the lead-to-location conversion flow, making the leads page responsive for smaller screens, and adding manual maintenance request creation.

---

## Problems Identified

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Lead data not auto-importing | `useState` with static initialization doesn't trigger when dialog opens | Form fields are empty when "Convert to Location" is clicked |
| Dialog UI mismatch | ConvertToLocationDialog uses a simplified form layout | Inconsistent experience vs. location creation page |
| Leads page not responsive | Fixed column widths (280px) and horizontal scroll only | 35%+ of content hidden on smaller screens |
| No manual maintenance entry | Hook only has fetch/update/delete, no create | Operators can't log issues they discover themselves |

---

## Solution 1: Fix "Create Location from Lead" Data Import & UI Consistency

### Problem
The `ConvertToLocationDialog` initializes `formData` with empty values and uses `useState` incorrectly to reset the form. The `useState(() => {...})` pattern being used is actually an initializer function, not an effect - so it only runs once on mount, not when the dialog opens.

### Fix
Use `useEffect` to properly populate form data when the dialog opens and the lead prop changes:

```typescript
// BEFORE (broken)
useState(() => {
  if (open && lead) {
    resetForm();
  }
});

// AFTER (correct)
useEffect(() => {
  if (open && lead) {
    setFormData({
      name: lead.business_name,
      address: lead.address || '',
      contact_person: lead.contact_name || '',
      contact_phone: lead.contact_phone || '',
      contact_email: lead.contact_email || '',
      notes: lead.notes || '',
    });
    setIsSuccess(false);
  }
}, [open, lead]);
```

### UI Consistency
Enhance the ConvertToLocationDialog to match the LocationTrackerComponent dialog:
- Add section headers with icons (Basic Info, Contact Info, Machine & Commission)
- Include machine type selection with "Add Type" functionality
- Add commission rate field
- Add restock schedule options
- Add active location toggle
- Match the same grid layouts and styling

### Files to Modify
- `src/components/leads/ConvertToLocationDialog.tsx`

---

## Solution 2: Make Leads Page Responsive for Smaller Screens

### Problem
The `LeadsPipeline` component uses fixed column widths:
```tsx
<div className="flex-shrink-0 w-[280px] md:w-[260px] lg:flex-1 lg:min-w-[240px]">
```
This creates a horizontal scroll experience that hides content on smaller screens.

### Fix Strategy
Implement responsive layouts:

1. **Mobile (< 768px)**: Single column with horizontal swipeable tabs for status filters
2. **Tablet (768px-1024px)**: 2-3 visible columns with horizontal scroll
3. **Desktop (> 1024px)**: All 5 columns visible in equal widths

### Implementation

**Option A: Tab-based mobile view (recommended)**
- Replace horizontal columns with status tabs on mobile
- Each tab shows cards for that status
- Add status indicator badges in tab headers

**Option B: Stacked mobile view**
- Show one status column at a time
- Add navigation buttons or swipe gestures

### Mobile Pipeline Layout
```text
+-------------------------------------------+
|  [New] [Contacted] [Negotiating] [Won] [Lost]  <- Horizontal scrollable tabs
+-------------------------------------------+
|  +-----------------+                      |
|  | Lead Card 1     |  <- Full width cards |
|  +-----------------+                      |
|  +-----------------+                      |
|  | Lead Card 2     |                      |
|  +-----------------+                      |
+-------------------------------------------+
```

### Files to Modify
- `src/components/leads/LeadsPipeline.tsx`
- `src/pages/Leads.tsx` (adjust container padding/margins)

---

## Solution 3: Add Manual Maintenance Request Creation

### Overview
Add a "Report Issue" button to the Maintenance page header that opens a dialog for operators to manually log maintenance issues they discover during their rounds.

### Database Considerations
The existing `maintenance_reports` table and RLS policies already support authenticated inserts via the pattern:
```sql
user_id = get_machine_owner(machine_id)
```

For authenticated users (operators), we can insert directly to the table since they own the machines.

### New Component: `AddMaintenanceReportDialog`
A form dialog with:
- Location selector (dropdown of user's locations)
- Machine selector (filtered by selected location)
- Issue type dropdown (not_working, stuck_prize, coin_jam, display_issue, other)
- Severity selector (low, medium, high)
- Description textarea
- Optional reporter name/contact (for logging if reported by someone else)

### Hook Enhancement
Add `createReport` function to `useMaintenanceReports`:

```typescript
const createReport = async (data: {
  machine_id: string;
  issue_type: string;
  description: string;
  severity: string;
  reporter_name?: string;
  reporter_contact?: string;
}) => {
  if (!user) return null;
  
  const { data: report, error } = await supabase
    .from("maintenance_reports")
    .insert({
      machine_id: data.machine_id,
      user_id: user.id,
      issue_type: data.issue_type,
      description: data.description,
      severity: data.severity,
      reporter_name: data.reporter_name || null,
      reporter_contact: data.reporter_contact || null,
      status: "open",
    })
    .select()
    .single();
    
  if (error) throw error;
  
  await fetchReports(); // Refresh the list
  return report;
};
```

### UI Integration
Add to Maintenance page header:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1>Maintenance Reports</h1>
    <p>Manage and track machine issues</p>
  </div>
  <Button onClick={() => setShowAddDialog(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Report Issue
  </Button>
</div>
```

### Files to Create
- `src/components/maintenance/AddMaintenanceReportDialog.tsx`

### Files to Modify
- `src/hooks/useMaintenanceReports.ts` (add createReport function)
- `src/pages/Maintenance.tsx` (add button and dialog)

---

## Implementation Order

1. **Fix ConvertToLocationDialog data import** (Quick fix using useEffect)
2. **Enhance ConvertToLocationDialog UI** (Match LocationTrackerComponent styling)
3. **Make LeadsPipeline responsive** (Tab-based mobile view)
4. **Add createReport to useMaintenanceReports** (Hook enhancement)
5. **Create AddMaintenanceReportDialog** (New component)
6. **Integrate manual report button** (Maintenance page update)

---

## Technical Details

### ConvertToLocationDialog Enhancements

**New imports needed:**
- `NumberInput` from ui
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from ui
- `Switch` from ui
- `Sparkles`, `Calendar` icons
- `MACHINE_TYPE_OPTIONS` from useLocationsDB

**New form fields:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  notes: '',
  // New fields to match location creation
  machines: [] as MachineType[],
  commissionRate: 0,
  isActive: true,
  collectionFrequencyDays: undefined as number | undefined,
  restockDayOfWeek: undefined as number | undefined,
});
```

### LeadsPipeline Responsive Changes

**Mobile tab implementation:**
```tsx
{isMobile ? (
  <div className="space-y-4">
    {/* Status tabs - horizontal scroll */}
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {statusColumns.map(({ status, label, icon: Icon, color }) => (
        <button
          key={status}
          onClick={() => setActiveStatus(status)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap",
            activeStatus === status ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
          <Badge>{getLeadsForStatus(status).length}</Badge>
        </button>
      ))}
    </div>
    {/* Cards for active status */}
    <div className="space-y-3">
      {getLeadsForStatus(activeStatus).map(lead => (
        <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
      ))}
    </div>
  </div>
) : (
  /* Existing desktop pipeline */
)}
```

### AddMaintenanceReportDialog Structure
```tsx
export function AddMaintenanceReportDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: Props) {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [machines, setMachines] = useState([]);
  const [formData, setFormData] = useState({
    machine_id: '',
    issue_type: 'other',
    severity: 'medium',
    description: '',
    reporter_name: '',
    reporter_contact: '',
  });

  // Fetch locations on mount
  // Fetch machines when location changes
  // Submit handler
  
  return (
    <Dialog>
      <DialogContent>
        {/* Location selector */}
        {/* Machine selector */}
        {/* Issue type dropdown */}
        {/* Severity radio group */}
        {/* Description textarea */}
        {/* Optional reporter fields */}
        {/* Submit/Cancel buttons */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `ConvertToLocationDialog.tsx` | Modify | Fix useEffect bug, enhance UI to match location creation |
| `LeadsPipeline.tsx` | Modify | Add mobile-responsive tab-based layout |
| `Leads.tsx` | Modify | Adjust container for better mobile padding |
| `useMaintenanceReports.ts` | Modify | Add createReport function |
| `AddMaintenanceReportDialog.tsx` | Create | New dialog for manual maintenance entry |
| `Maintenance.tsx` | Modify | Add "Report Issue" button and dialog integration |
