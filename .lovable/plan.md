

## Fix QR Code Public Reporting - Make It Work Wonderfully

### Root Cause Analysis

I've identified **two critical issues** preventing the form from working:

| Issue | Description |
|-------|-------------|
| **1. Greedy Route Pattern** | The route `/:locationSlug/:unitCode` matches ANY two-segment URL, including legitimate app routes like `/auth` when accessed incorrectly. More importantly, it matches when only one segment exists, causing conflicts. |
| **2. App Not Published** | Even if the code is correct in development, the production URL (`clawops-command-center.lovable.app`) still has the old code. The app MUST be published for QR codes to work. |

---

### The Routing Problem Explained

The current routing in `App.tsx`:

```tsx
<Routes>
  <Route path="/:locationSlug/:unitCode" element={<ReportIssue />} />  // TOO GREEDY!
  <Route path="/m/:machineId" element={<ReportIssue />} />
  <Route path="/*" element={<ProtectedAppRoutes />} />
</Routes>
```

**Problem**: When a user visits `/locations`, React Router sees this as potentially matching `/:locationSlug/:unitCode` with only one segment. While it won't fully match (needs 2 segments), the routing priority can cause issues with nested routes.

The real issue is that `/downtown-pizza-taproom/claw-1` matches the pattern correctly, but the page may be hitting errors because:
1. The database RPC call fails
2. The form submission fails due to RLS policies

---

### Solution: Add a Dedicated Prefix for Public URLs

Change the URL pattern from `/:locationSlug/:unitCode` to `/report/:locationSlug/:unitCode`.

**Benefits:**
- No collision with app routes (`/locations`, `/auth`, `/revenue`, etc.)
- Clear, dedicated namespace for public reporting
- Still human-readable: `clawops-command-center.lovable.app/report/downtown-pizza/claw-1`

---

### Implementation Changes

#### 1. Update Routing (src/App.tsx)

Change the public route pattern:

```tsx
<Routes>
  {/* Public reporting route with /report prefix */}
  <Route path="/report/:locationSlug/:unitCode" element={<ReportIssue />} />
  {/* Legacy UUID route for existing QR codes */}
  <Route path="/m/:machineId" element={<ReportIssue />} />
  {/* All other routes go through AuthProvider */}
  <Route path="/*" element={<ProtectedAppRoutes />} />
</Routes>
```

#### 2. Update QR Code Generator (src/components/maintenance/QRCodeGenerator.tsx)

Update the URL generation:

```tsx
// Before
const reportUrl = `https://clawops-command-center.lovable.app/${locationSlug}/${unitCode}`;

// After
const reportUrl = `https://clawops-command-center.lovable.app/report/${locationSlug}/${unitCode}`;
```

#### 3. Update ReportIssue Page (src/pages/ReportIssue.tsx)

The page already supports both URL formats - no changes needed to the component logic.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Change route from `/:locationSlug/:unitCode` to `/report/:locationSlug/:unitCode` |
| `src/components/maintenance/QRCodeGenerator.tsx` | Update URL template to include `/report/` prefix |

---

### New URL Format

| Before (problematic) | After (fixed) |
|---------------------|---------------|
| `/downtown-pizza/claw-1` | `/report/downtown-pizza/claw-1` |
| Conflicts with app routes | Clear separation from app routes |

---

### Full Flow After Fix

1. **Operator generates QR code** in Machines Manager
2. **QR code contains URL**: `https://clawops-command-center.lovable.app/report/downtown-pizza/claw-1`
3. **Customer scans QR code** and lands on the ReportIssue form
4. **Customer fills out form** with issue details
5. **Form submits** to `maintenance_reports` table
6. **Operator sees report** in the Maintenance Widget on Dashboard

---

### After Implementation

1. **Publish the app** - Click the Publish button to deploy changes
2. **Generate a new QR code** for any machine
3. **Scan the QR code** - The form should appear immediately
4. **Submit a test report** - Verify it appears in the Dashboard maintenance tab

---

### Example Working URLs

| Location | Machine | URL |
|----------|---------|-----|
| Downtown Pizza & Taproom | Claw #1 | `/report/downtown-pizza-taproom/claw-1` |
| RoCo Social | Clip #1 | `/report/roco-social/clip-1` |
| Midtown Pizza | Mini Claw #1 | `/report/midtown-pizza/mini-claw-1` |

