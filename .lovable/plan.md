
## What’s actually broken (root cause)
You are getting a **server/browser 404**, not the app’s internal 404 page. That means **your app isn’t even loading** when someone hits a deep link like:

- `/report/el-senor-rancho/mini_claw-1`
- `/m/<uuid>`

This is almost always caused by **domain/routing configuration**, not React code:
- Your custom domain (`clawops.com`) is not currently serving this Lovable project correctly (or not as the primary domain).
- Because of that, any non-root path (like `/report/...`) returns a server 404 before React Router can render the form.

Separately, I also see a data hygiene issue: `unit_code` is showing underscores (`mini_claw-1`). That won’t cause a server 404, but we should normalize it to match your intended format (`mini-claw-1`) to avoid “Machine Not Found” later.

---

## Outcome we’re aiming for
When a customer scans a QR code, it should open:

- `https://clawops.com/report/<location-slug>/<unit-code>`

…and the app should:
1) load the public Report Issue form,
2) submit into `maintenance_reports`,
3) show up in your Dashboard Maintenance tab/widget.

---

## Step-by-step plan (what I will do next)

### 1) Fix the custom domain so deep links load the app (this is the blocker)
**What you’ll do in Lovable settings (no code):**
1. Go to **Project Settings → Domains**
2. Connect **both**:
   - `clawops.com`
   - `www.clawops.com` (if you want it)
3. Follow the DNS instructions exactly (A + TXT records).
4. Make `clawops.com` the **Primary** domain once it shows **Active**.
5. Ensure the domain status is **Active** (not Verifying/Offline/Failed).
6. After it’s Active: click **Publish / Update** to push the latest frontend to the live domain.

**Why this fixes it:** once the domain is correctly connected to this project, the hosting will serve the app shell for routes like `/report/...` instead of returning a server 404.

---

### 2) Make QR code URLs automatically use whatever domain the app is running on (code change)
Right now, QR generation hardcodes:
- `https://clawops-command-center.lovable.app/...`

That’s risky because:
- if you move to `https://clawops.com`, the QR code still points at the old domain
- if you test from preview, QR might point at live incorrectly

**Change:** build the QR URL from `window.location.origin` (the current domain) and append `/report/...`.

Result:
- On production, QR codes automatically become `https://clawops.com/report/...`
- On preview, they automatically become preview URLs (useful for testing)

---

### 3) Normalize existing `unit_code` values to be URL-safe and consistent (backend migration)
You currently have at least one unit code like:
- `mini_claw-1` (underscore)

But the intended format is:
- `mini-claw-1` (hyphen)

**Migration:**
- update any existing `location_machines.unit_code` to replace `_` with `-`
- also ensure newly generated/backfilled unit codes never include `_`

This prevents the next failure mode (app loads but shows “Machine Not Found” because the URL and DB unit_code don’t match your new format expectations).

---

### 4) End-to-end validation path (how we’ll prove it works)
Once domain + code + unit_code normalization are in place:

**A. Direct URL test (fastest)**
- Open: `https://clawops.com/report/<your-location-slug>/<your-unit-code>`
- Expected: Report Issue form renders (not server 404)

**B. Submit test**
- Fill the form and submit
- Expected: success message

**C. Confirm in dashboard**
- Log in as operator
- Go to Dashboard Maintenance section/tab/widget
- Expected: new report appears under the correct machine, status open

---

## Technical notes (so you know we’re covering the full stack)
- Your React routing is already correct for public access:
  - `/report/:locationSlug/:unitCode` and `/m/:machineId` are outside auth protection.
- Your `maintenance_reports` table already has an INSERT policy designed for public submissions (“Anyone can create reports for valid machines”), so once the customer can actually load the app, submission should succeed.
- The fact that **legacy `/m/:uuid` also 404s on clawops.com** strongly confirms this is domain/hosting, not a bug in `ReportIssue.tsx`.

---

## What I need from you (to unblock quickly)
1) Make sure `clawops.com` is connected as an **Active** domain to this project in Lovable settings and set as **Primary**.
2) Tell me once domain status shows Active (or paste the status text you see there). Then I’ll proceed with the code+migration steps above.

