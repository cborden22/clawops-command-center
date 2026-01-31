

## Fix QR Code Maintenance Reporting System

### Issues Identified

1. **Login Required Bug**: QR code uses preview URL (`id-preview--*.lovable.app`) instead of the published URL (`clawops-command-center.lovable.app`)
2. **Scary URL**: The `/report/{uuid}` path looks intimidating to customers
3. **Wrong Sticker Layout**: Current print layout is centered, not business card format
4. **Missing Pre-filled Info**: Date/time not shown on the report form

---

### Solution Overview

| Issue | Fix |
|-------|-----|
| Login required | Use hardcoded published URL for QR codes |
| Scary URL | Shorten route to `/m/{machineId}` |
| Sticker layout | Redesign print to business card (3.5" x 2") with two-column layout |
| Pre-filled data | Add read-only date/time display in the form header |

---

### 1. Use Published URL for QR Codes

**File: `src/components/maintenance/QRCodeGenerator.tsx`**

Change from:
```typescript
const reportUrl = `${window.location.origin}/report/${machineId}`;
```

To:
```typescript
// Always use the published URL for customer-facing QR codes
const reportUrl = `https://clawops-command-center.lovable.app/m/${machineId}`;
```

This ensures customers always go to the public production site, never the preview/development URL.

---

### 2. Shorten the Route Path

**File: `src/App.tsx`**

Change route from `/report/:machineId` to `/m/:machineId`:

```tsx
{/* Public route - short URL for QR codes */}
<Route path="/m/:machineId" element={<ReportIssue />} />
```

The final URL customers see will be:
```
clawops-command-center.lovable.app/m/abc123...
```

This is cleaner and less intimidating than `/report/`.

---

### 3. Business Card Sticker Layout

**File: `src/components/maintenance/QRCodeGenerator.tsx`**

Redesign the `handlePrint` function to generate a business card layout:

**Dimensions**: 3.5 inches × 2 inches (standard US business card)

**Layout**:
```text
+-----------------------------------------------+
|                                               |
|  HAVING TROUBLE?          +---------------+   |
|  Scan to report an issue  |               |   |
|                           |   [QR CODE]   |   |
|  1. Open camera           |               |   |
|  2. Point at code         +---------------+   |
|  3. Tap the link                              |
|                           Machine Name        |
|  ClawOps                  Location Name       |
+-----------------------------------------------+
```

**Print CSS**:
```css
@page {
  size: 3.5in 2in;
  margin: 0;
}
body {
  width: 3.5in;
  height: 2in;
  margin: 0;
  padding: 12px;
  display: flex;
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
}
.left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 12px;
}
.right-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.qr-code svg {
  width: 1.3in;
  height: 1.3in;
}
h1 { font-size: 14px; margin: 0 0 4px 0; font-weight: 700; }
.steps { font-size: 10px; margin: 8px 0; line-height: 1.4; }
.step { margin-bottom: 2px; }
.branding { font-size: 9px; color: #666; margin-top: auto; }
.machine-info { font-size: 9px; text-align: center; margin-top: 4px; }
```

---

### 4. Add Date/Time to Report Form

**File: `src/pages/ReportIssue.tsx`**

Add a read-only info section showing current date and time in the machine info header card:

```tsx
// In the Machine Info Header card, after location info:
<div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
  <div className="flex items-center gap-1">
    <Calendar className="h-3 w-3" />
    <span>{format(new Date(), "MMMM d, yyyy")}</span>
  </div>
  <div className="flex items-center gap-1">
    <Clock className="h-3 w-3" />
    <span>{format(new Date(), "h:mm a")}</span>
  </div>
</div>
```

This shows customers the current date/time as context, and it gets captured in the `created_at` timestamp when they submit.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Change route from `/report/:machineId` to `/m/:machineId` |
| `src/components/maintenance/QRCodeGenerator.tsx` | Use published URL, redesign print layout for business card |
| `src/pages/ReportIssue.tsx` | Add date/time display in header |

---

### Print Preview: Business Card Sticker

```text
+-----------------------------------------------+
|                                               |
|  HAVING TROUBLE?          +---------------+   |
|  Scan to report an issue  |               |   |
|                           |   ████████    |   |
|  1. Open your camera      |   ████████    |   |
|  2. Point at the QR code  |   ████████    |   |
|  3. Tap the link          |               |   |
|                           +---------------+   |
|  ClawOps                    Claw Machine #1   |
|                             Pizza Palace      |
+-----------------------------------------------+
       ^                            ^
   Instructions                 QR Code +
    on LEFT                   Machine info
```

---

### Technical Notes

**Why hardcode the published URL?**
- `window.location.origin` returns the current environment's URL
- In preview mode, this gives `id-preview--*.lovable.app` which requires auth
- The published URL `clawops-command-center.lovable.app` is the production site where the `/m/:machineId` route works without login

**Why `/m/` instead of `/report/`?**
- Shorter = less intimidating
- Looks like a standard short-link format
- Still descriptive enough (m = machine)

