

## Smarter Dashboard: Lead Follow-ups & Advanced Widget Customization

This plan addresses two major improvements: integrating lead follow-ups into the weekly calendar, and creating a professional grid-based dashboard layout with improved drag-and-drop functionality.

---

## Part 1: Add Lead Follow-ups to Weekly Calendar

### Current State
- The `useSmartScheduler` hook generates tasks for restocks, routes, and maintenance
- Leads have a `next_follow_up` field (timestamptz) but are not included in the calendar
- The `LeadsWidget` already has a `getLeadsWithFollowUpDue()` helper function

### Solution
Add a new task type "followup" to the smart scheduler that includes leads with scheduled follow-up dates within the 7-day window.

### Changes Required

**File: `src/hooks/useSmartScheduler.ts`**

1. Add new task type:
```typescript
export type TaskType = "restock" | "route" | "maintenance" | "followup";
```

2. Add leads to input interface:
```typescript
interface SmartSchedulerInput {
  // ... existing fields
  leads?: Array<{ 
    id: string; 
    business_name: string; 
    next_follow_up: string | null;
    status: string;
    priority: string | null;
  }>;
}
```

3. Generate follow-up tasks in `weeklyTasks` memo:
```typescript
// Add lead follow-up tasks
leads
  .filter(l => l.next_follow_up && l.status !== 'won' && l.status !== 'lost')
  .forEach(lead => {
    const followUpDate = startOfDay(new Date(lead.next_follow_up));
    if (isBefore(followUpDate, weekEnd) || isSameDay(followUpDate, weekEnd)) {
      tasks.push({
        id: `followup-${lead.id}`,
        type: "followup",
        title: lead.business_name,
        subtitle: lead.priority === 'hot' ? 'Hot Lead' : 'Follow-up',
        dueDate: followUpDate,
        status: getTaskStatus(followUpDate),
        priority: lead.priority === 'hot' ? 'high' : 'medium',
        link: "/leads",
        metadata: { leadId: lead.id },
      });
    }
  });
```

**File: `src/components/dashboard/WeeklyCalendarWidget.tsx`**

1. Add follow-up icon and colors:
```typescript
const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  // ... existing
  followup: <Users className="h-3 w-3" />,
};

const TASK_COLORS: Record<TaskType, string> = {
  // ... existing
  followup: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};
```

2. Add legend item for follow-ups in the header

**File: `src/pages/Dashboard.tsx`**

1. Import and use leads data:
```typescript
const { leads } = useLeadsDB();
```

2. Pass leads to smart scheduler:
```typescript
const { tasksByDate, ... } = useSmartScheduler({
  // ... existing
  leads: leads.map(l => ({
    id: l.id,
    business_name: l.business_name,
    next_follow_up: l.next_follow_up,
    status: l.status,
    priority: l.priority,
  })),
});
```

---

## Part 2: Advanced Dashboard Grid Layout & Customization

### Current Problems
1. Widgets stack vertically only - no side-by-side placement
2. Dragging doesn't auto-scroll the page
3. Layout doesn't adapt well to different screen sizes

### Solution Architecture

Implement a responsive grid system where:
- Widgets have configurable sizes (small, medium, large, full-width)
- Small/medium widgets can sit side-by-side
- Drag-and-drop auto-scrolls the viewport
- Layout persists with size preferences

### New Widget Configuration

```typescript
type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;  // NEW
}

// Size to grid column span mapping
const SIZE_TO_COLS = {
  sm: 'md:col-span-4',      // 1/3 width on desktop
  md: 'md:col-span-6',      // 1/2 width on desktop  
  lg: 'md:col-span-8',      // 2/3 width on desktop
  full: 'md:col-span-12',   // Full width
};
```

### Default Widget Sizes

| Widget | Default Size | Rationale |
|--------|-------------|-----------|
| Primary Stats | full | 4 cards need full width |
| Weekly Calendar | full | 7-day calendar needs full width |
| Restock Reminders | md | Compact list, pairs well |
| Maintenance | md | Compact list, pairs well |
| Leads Pipeline | md | Summary stats, pairs well |
| All-Time Summary | sm | Small data cards |
| Top Locations | sm | Short list |
| Low Stock Alerts | sm | Alert list |
| Recent Transactions | md | Transaction list |
| Quick Actions | full | 4 action buttons |

### Layout Grid Structure

```tsx
<div className="grid grid-cols-12 gap-4">
  {widgets.map(widget => (
    <div className={cn(
      "col-span-12",           // Mobile: always full width
      SIZE_TO_COLS[widget.size] // Desktop: configurable
    )}>
      {renderWidget(widget)}
    </div>
  ))}
</div>
```

### Auto-Scroll During Drag

Implement viewport scrolling when dragging near edges:

```typescript
const handleDrag = (e: React.DragEvent) => {
  const scrollThreshold = 100; // pixels from edge
  const scrollSpeed = 10;
  
  const { clientY } = e;
  const viewportHeight = window.innerHeight;
  
  if (clientY < scrollThreshold) {
    // Near top - scroll up
    window.scrollBy(0, -scrollSpeed);
  } else if (clientY > viewportHeight - scrollThreshold) {
    // Near bottom - scroll down
    window.scrollBy(0, scrollSpeed);
  }
};
```

### Size Selector in Customize Mode

Add a size toggle button next to visibility toggle:

```tsx
{isCustomizing && (
  <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1">
    <GripVertical className="h-4 w-4" /> {/* Drag handle */}
    <button onClick={() => toggleVisibility(widget.id)}>
      {widget.visible ? <Eye /> : <EyeOff />}
    </button>
    <button onClick={() => cycleSize(widget.id)}>
      <Maximize2 className="h-4 w-4" />
    </button>
    <span className="text-xs px-2">
      {widget.label} ({widget.size})
    </span>
  </div>
)}
```

### Size Cycling Logic

```typescript
const cycleSize = (id: WidgetId) => {
  const sizeOrder: WidgetSize[] = ['sm', 'md', 'lg', 'full'];
  setWidgets(prev => prev.map(w => {
    if (w.id !== id) return w;
    const currentIndex = sizeOrder.indexOf(w.size);
    const nextIndex = (currentIndex + 1) % sizeOrder.length;
    return { ...w, size: sizeOrder[nextIndex] };
  }));
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSmartScheduler.ts` | Add followup task type and leads input |
| `src/components/dashboard/WeeklyCalendarWidget.tsx` | Add followup icon/color, update legend |
| `src/pages/Dashboard.tsx` | Grid layout, auto-scroll, size config, leads integration |
| `src/hooks/useUserPreferences.ts` | Update WidgetConfig interface with size |

---

## Implementation Order

1. **Add lead follow-ups to scheduler** - Quick integration
2. **Update WeeklyCalendarWidget** - Add new task type styling
3. **Pass leads to Dashboard scheduler** - Wire up the data
4. **Implement grid layout** - Replace vertical stack with 12-column grid
5. **Add widget size configuration** - Add size property and cycling
6. **Implement auto-scroll** - Smooth scrolling during drag
7. **Update customize UI** - Size selector and improved controls
8. **Persist size preferences** - Save to localStorage with layout

---

## Visual Preview

### Before (Vertical Stack)
```text
+------------------------------------------+
|          Primary Stats (full)            |
+------------------------------------------+
|          Weekly Calendar (full)          |
+------------------------------------------+
|          Restock Reminders               |
+------------------------------------------+
|          Maintenance                     |
+------------------------------------------+
```

### After (Grid Layout)
```text
+------------------------------------------+
|          Primary Stats (full)            |
+------------------------------------------+
|          Weekly Calendar (full)          |
+------------------------------------------+
|    Restock (md)    |    Maintenance (md) |
+--------------------+---------------------+
|  All-Time (sm)  | Top Loc (sm) | Alerts (sm)|
+-----------------+--------------+------------+
|    Recent Transactions (md)   | Leads (md) |
+-------------------------------+------------+
|          Quick Actions (full)            |
+------------------------------------------+
```

---

## Weekly Calendar with Follow-ups

### Updated Legend
```text
This Week
[●] Restock  [●] Route  [●] Maintenance  [●] Follow-up
```

### Calendar Cell Example
```text
+-------------+
|   Wed       |
|    12       |
+-------------+
| [📍] Joe's  |  <- Restock (blue)
| [🛣] Route1 |  <- Route (purple)
| [👥] Pizza  |  <- Lead Follow-up (amber)
+-------------+
```

---

## Technical Considerations

### CSS Grid Responsiveness
- Mobile: All widgets span 12 columns (full width)
- Tablet (md): Widgets respect their size setting
- Desktop (lg): Same as tablet with more breathing room

### Drag Auto-Scroll
- Uses `requestAnimationFrame` for smooth scrolling
- Scroll speed increases when closer to edge
- Stops when drag ends

### localStorage Schema Update
```typescript
interface SavedWidgetConfig {
  id: string;
  visible: boolean;
  size: 'sm' | 'md' | 'lg' | 'full';
}
```

### Migration for Existing Users
When loading saved layout, if `size` is missing, apply default sizes based on widget ID.

