

## Fix Hardcoded Lovable URLs to clawops.com

### What This Does

Replaces all remaining `clawops-command-center.lovable.app` fallback URLs with `clawops.com` across 3 files. These are fallback values that would only be used if the primary source (environment variable or `window.location.origin`) is unavailable.

### Changes

| File | Line | Current Fallback | New Fallback |
|------|------|-----------------|--------------|
| `supabase/functions/send-team-invite/index.ts` | 95 | `https://clawops-command-center.lovable.app` | `https://clawops.com` |
| `supabase/functions/submit-maintenance-report/index.ts` | 115 | `https://clawops-command-center.lovable.app` | `https://clawops.com` |
| `src/components/maintenance/QRCodeGenerator.tsx` | 41 | `https://clawops-command-center.lovable.app` | `https://clawops.com` |

### Technical Notes

- The two edge functions already read `APP_BASE_URL` from environment first -- the hardcoded string is only a fallback if the secret is missing.
- The QR code generator uses `window.location.origin` at runtime -- the hardcoded string is only a fallback for server-side rendering contexts.
- Both edge functions will be redeployed automatically after the change.

