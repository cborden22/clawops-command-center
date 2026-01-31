
## Maintenance Tracker with QR Code Issue Reporting

### Overview
Add a complete maintenance tracking system that allows you to:
1. Generate unique QR codes for each machine
2. Customers scan the QR code to report issues via a public form
3. View and manage maintenance requests on a dedicated dashboard widget
4. Track issue status (open, in progress, resolved)

---

### System Architecture

```text
+-------------------+     +-------------------+     +-------------------+
|   Machine QR      |     |   Public Report   |     |   Maintenance     |
|   Code Page       | --> |   Form (No Auth)  | --> |   Dashboard       |
+-------------------+     +-------------------+     +-------------------+
       |                          |                         |
       |  QR contains URL         |  Submits to DB          |  User views
       |  /report/{machine_id}    |  (public insert)        |  & manages
+------v--------------------------v-------------------------v------+
|                       maintenance_reports table                   |
|  - machine_id, location, issue_type, description, status, etc.   |
+-------------------------------------------------------------------+
```

---

### Database Design

**New Table: `maintenance_reports`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| machine_id | uuid | FK to location_machines |
| user_id | uuid | Owner of the machine (for RLS) |
| reporter_name | text | Customer's name (optional) |
| reporter_contact | text | Phone/email (optional) |
| issue_type | text | 'not_working', 'stuck_prize', 'coin_jam', 'other' |
| description | text | Details of the problem |
| severity | text | 'low', 'medium', 'high' |
| status | text | 'open', 'in_progress', 'resolved' |
| resolution_notes | text | What was done to fix it |
| created_at | timestamp | When reported |
| resolved_at | timestamp | When marked resolved |

**RLS Policies:**
- Public INSERT allowed (no auth required for customers)
- Only authenticated owner can SELECT/UPDATE/DELETE their reports

---

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/ReportIssue.tsx` | Public form for customers (no auth) |
| `src/components/maintenance/MaintenanceWidget.tsx` | Dashboard widget showing open issues |
| `src/components/maintenance/MaintenanceDialog.tsx` | View/update issue details |
| `src/components/maintenance/QRCodeGenerator.tsx` | Generate & download QR codes |
| `src/hooks/useMaintenanceReports.ts` | CRUD operations for reports |

---

### Feature Components

#### 1. QR Code Generator (Added to MachinesManager)

Add a "QR Code" button to each machine row that opens a dialog showing:
- The generated QR code (using `qrcode.react` library)
- The public URL it points to
- Download button (PNG)
- Print button

The QR code URL format:
```
https://clawops-command-center.lovable.app/report/{machine_id}
```

#### 2. Public Report Form (`/report/:machineId`)

A clean, mobile-friendly form that:
- Shows machine info (type, location name)
- Does NOT require login
- Captures:
  - Issue type (dropdown)
  - Description (textarea)
  - Severity (radio buttons)
  - Contact info (optional)
- Submits directly to database

Form validation using Zod schema for security.

#### 3. Dashboard Maintenance Widget

New widget option for the Dashboard showing:
- Count of open issues (with badge)
- Recent reports (last 5)
- Quick status update buttons
- Link to full maintenance view

#### 4. Full Maintenance View (Optional - can add later)

A dedicated page or modal with:
- Filter by status/location/machine
- Bulk actions
- Resolution history

---

### Technical Implementation

#### Step 1: Database Migration

```sql
CREATE TABLE maintenance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES location_machines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  issue_type TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Public can insert (for customer reports)
CREATE POLICY "Anyone can create reports"
  ON maintenance_reports FOR INSERT
  WITH CHECK (true);

-- Only owner can view/update/delete
CREATE POLICY "Users can view own reports"
  ON maintenance_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON maintenance_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON maintenance_reports FOR DELETE
  USING (auth.uid() = user_id);
```

#### Step 2: Install QR Code Library

```bash
npm install qrcode.react
```

#### Step 3: Route Configuration

Add new public route in App.tsx:
```tsx
<Route path="/report/:machineId" element={<ReportIssue />} />
```

Note: This route is OUTSIDE the ProtectedRoute wrapper so customers can access without login.

---

### User Experience Flow

**For Operators:**
1. Go to Machines page (or Location details)
2. Click "QR Code" button on a machine
3. Download or print the QR code
4. Stick it on the machine

**For Customers:**
1. See a problem with a machine
2. Scan QR code with phone camera
3. Fill out simple form (no account needed)
4. Submit - see confirmation message

**For Operators (receiving reports):**
1. See notification badge on Dashboard
2. Open Maintenance widget
3. View issue details
4. Update status or add resolution notes
5. Mark as resolved when fixed

---

### Security Considerations

1. **Public Form Protection:**
   - Rate limiting via database constraints
   - Input validation with Zod
   - No sensitive data exposed on public page

2. **Machine ID Lookup:**
   - Create a secure lookup that only returns minimal public info (machine type, location name)
   - Does NOT expose owner info, address, or other sensitive data

3. **RLS Policies:**
   - Reports are always linked to the machine owner's user_id
   - Owner-only access for viewing/updating reports

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add public `/report/:machineId` route |
| `src/components/MachinesManager.tsx` | Add QR code button to machine rows |
| `src/pages/Dashboard.tsx` | Add Maintenance widget to widget list |

---

### Summary

This feature creates a complete feedback loop between customers and operators:

- **QR Codes**: Easy way to identify machines for reporting
- **Public Form**: No friction for customers to report issues
- **Dashboard Integration**: See issues at a glance
- **Status Tracking**: Know what needs attention and what's been fixed

The implementation is secure (RLS enforced), mobile-friendly (customers report from phones), and integrates seamlessly with your existing dashboard widget system.

