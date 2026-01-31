

## Add Revenue Display Toggle to Commission Summary

### Overview
Add a toggle option that lets users choose whether to show the total revenue amount on the generated PDF. When disabled, the PDF will display only the commission payment amount without revealing the total revenue - useful when sharing with location partners who shouldn't see full revenue figures.

---

### Current State
- PDF always shows both Total Revenue and Commission Payment
- No option to hide revenue information
- Single PDF template for all cases

---

### Solution

Add a Switch toggle in the Financial Details section that controls PDF content. When "Show Total Revenue" is OFF, generate a simplified PDF that emphasizes the commission payment without revealing total revenue or percentage.

---

### UI Changes

**New Toggle in Financial Details Section:**
```
+------------------------------------------+
| Financial Details                        |
+------------------------------------------+
| [Toggle Switch] Show total revenue on PDF|
|                                          |
| When disabled, the PDF will only show    |
| the commission payment amount            |
+------------------------------------------+
| Total Revenue ($)    | Commission Rate % |
| [___________]        | [___________]     |
+------------------------------------------+
```

---

### PDF Comparison

| Element | Revenue Shown (Current) | Revenue Hidden (New) |
|---------|------------------------|---------------------|
| Header | COMMISSION SUMMARY | COMMISSION STATEMENT |
| Location Info | Same | Same |
| Total Revenue | Displayed | Not shown |
| Commission % | (Used internally only) | Not shown |
| Commission Payment | Displayed | Displayed (larger, centered) |
| Notes | Same | Same |
| Footer | Same | Same |

---

### Technical Implementation

#### File: `src/components/CommissionSummaryGenerator.tsx`

**1. Add state for toggle:**
```typescript
const [showRevenue, setShowRevenue] = useState(true)
```

**2. Add Switch import:**
```typescript
import { Switch } from "@/components/ui/switch"
```

**3. Add toggle UI in Financial Details section** (before the revenue inputs):
```tsx
<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
  <div className="space-y-0.5">
    <Label htmlFor="showRevenue">Show total revenue on PDF</Label>
    <p className="text-xs text-muted-foreground">
      When disabled, only the commission amount will appear
    </p>
  </div>
  <Switch
    id="showRevenue"
    checked={showRevenue}
    onCheckedChange={setShowRevenue}
  />
</div>
```

**4. Create alternative PDF content** when `showRevenue` is false:
```typescript
const contentWithoutRevenue = `
  <div style="...">
    <div style="text-align: center; ...">
      <h1>COMMISSION STATEMENT</h1>
      <p>Generated on ${currentDate}</p>
    </div>

    <!-- Location Information (same as current) -->
    <div>
      <h2>Location Information</h2>
      <table>
        <tr><td>Business Name:</td><td>${name}</td></tr>
        <tr><td>Contact Person:</td><td>${contact}</td></tr>
        <tr><td>Period:</td><td>${period}</td></tr>
        <tr><td>Number of Machines:</td><td>${count}</td></tr>
      </table>
    </div>

    <!-- Commission Only (no revenue shown) -->
    <div style="text-align: center; ...">
      <div style="background: #dcfce7; padding: 40px; ...">
        <p>COMMISSION PAYMENT</p>
        <p style="font-size: 48px; ...">
          $${commissionAmount}
        </p>
        <p>For the period ${period}</p>
      </div>
    </div>

    <!-- Notes (same as current) -->
    ${notes}

    <!-- Footer (same as current) -->
  </div>
`
```

**5. Update generatePDF function:**
```typescript
const generatePDF = () => {
  // ... validation ...
  
  const content = showRevenue 
    ? contentWithRevenue   // Current template
    : contentWithoutRevenue // New simplified template
  
  // ... rest of PDF generation ...
}
```

---

### PDF Layout: Revenue Hidden Version

```
+---------------------------------------+
|         COMMISSION STATEMENT          |
|         Generated on Jan 31, 2026     |
+---------------------------------------+
|                                       |
| Location Information                  |
| ------------------------------------ |
| Business Name:    Pizza Palace       |
| Contact Person:   John Smith         |
| Period:           Jan 1 - Jan 31     |
| Number of Machines: 3                |
|                                       |
+---------------------------------------+
|                                       |
|    +-----------------------------+    |
|    |                             |    |
|    |     COMMISSION PAYMENT      |    |
|    |                             |    |
|    |         $150.00             |    |
|    |                             |    |
|    |  For the period shown above |    |
|    |                             |    |
|    +-----------------------------+    |
|                                       |
+---------------------------------------+
|                                       |
| Additional Notes                      |
| Great month! Machine #2 was popular.  |
|                                       |
+---------------------------------------+
|     Generated by ClawOps Dashboard    |
+---------------------------------------+
```

---

### Summary of Changes

| File | Changes |
|------|---------|
| `src/components/CommissionSummaryGenerator.tsx` | Add `showRevenue` state, Switch import, toggle UI, and alternative PDF template |

---

### Key Behaviors

1. **Default**: Toggle is ON (show revenue) - maintains current behavior
2. **Toggle OFF**: PDF shows "COMMISSION STATEMENT" header and only displays the commission amount
3. **Internal data unchanged**: Revenue and percentage still used for calculations, just hidden from PDF output
4. **Expense logging**: Commission still logged to Revenue Tracker regardless of toggle state

