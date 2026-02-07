
## Fix Maintenance Email Links & Remove Lovable Branding

### Problem Analysis

**Issue 1: Email links not working**
The maintenance report email at line 179 contains a hardcoded URL:
```html
<a href="https://clawops-command-center.lovable.app/maintenance">
```

This is problematic because:
- If you set up a custom domain (e.g., `clawops.com`), this link would bypass it
- Email clients may have issues with the long subdomain format

**Issue 2: Lovable branding still present**
Found in these locations:
| File | Line(s) | Content |
|------|---------|---------|
| `index.html` | 23, 26-27 | Lovable OpenGraph images and Twitter @lovable_dev reference |
| `submit-maintenance-report/index.ts` | 179 | `clawops-command-center.lovable.app` URL |
| `send-team-invite/index.ts` | 131 | `clawops-command-center.lovable.app` URL |
| `README.md` | All | Lovable project documentation (internal file) |

---

### Solution

#### 1. Update Edge Functions to Use Dynamic Base URL

The edge functions cannot use `window.location.origin` (no browser context). Instead, we'll:
- Use an environment variable for the base URL
- Fall back to the published URL if not set

**submit-maintenance-report/index.ts** (line 179):
```typescript
// Before
<a href="https://clawops-command-center.lovable.app/maintenance" ...>

// After - use environment variable
const baseUrl = Deno.env.get("APP_BASE_URL") || "https://clawops.com";
// Then in the email HTML:
<a href="${baseUrl}/maintenance" ...>
```

**send-team-invite/index.ts** (line 131):
```typescript
// Before
<a href="https://clawops-command-center.lovable.app/auth" ...>

// After
const baseUrl = Deno.env.get("APP_BASE_URL") || "https://clawops.com";
// Then in the email HTML:
<a href="${baseUrl}/auth" ...>
```

#### 2. Add APP_BASE_URL Secret

Add a new secret `APP_BASE_URL` with value:
- If you have a custom domain: `https://your-custom-domain.com`
- If not: `https://clawops-command-center.lovable.app`

This allows you to change the domain later without modifying code.

#### 3. Update index.html - Remove Lovable Meta Tags

**Remove/update these lines (22-27)**:
```html
<!-- BEFORE -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@lovable_dev" />
<meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

<!-- AFTER - Use ClawOps branding -->
<meta property="og:image" content="/icons/icon-512.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@clawops" /> <!-- or remove if no Twitter -->
<meta name="twitter:image" content="/icons/icon-512.png" />
```

#### 4. Update README.md

Replace Lovable references with ClawOps documentation. This is primarily a developer file but good to clean up.

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/submit-maintenance-report/index.ts` | Add `baseUrl` variable from env, use in email link |
| `supabase/functions/send-team-invite/index.ts` | Add `baseUrl` variable from env, use in email link |
| `index.html` | Replace Lovable OpenGraph/Twitter images with ClawOps icons |
| `README.md` | Replace Lovable references with ClawOps branding |

### Secret to Add

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `APP_BASE_URL` | `https://clawops.com` (or your domain) | Base URL for email links |

---

### Implementation Notes

1. **Edge function changes**: The `baseUrl` will be defined at the top of the handler function, making it easy to update centrally if needed.

2. **Fallback behavior**: If `APP_BASE_URL` is not set, the functions will use `https://clawops.com` as the default (assuming you own this domain). If not, we can set a different fallback.

3. **Testing**: After deployment, trigger a maintenance report submission and verify the email link opens correctly.

4. **No QRCodeGenerator changes needed**: That file already uses `window.location.origin` dynamically, which is correct for client-side code.
