

## Update Resend Email Domain to clawops.com

### Overview
Update the email sender domain in both edge functions from `clawops.io` to `clawops.com`.

---

### Changes Required

| File | Current | Updated |
|------|---------|---------|
| `supabase/functions/submit-maintenance-report/index.ts` | `from: "ClawOps <noreply@clawops.io>"` | `from: "ClawOps <noreply@clawops.com>"` |
| `supabase/functions/send-team-invite/index.ts` | `from: "ClawOps <noreply@clawops.io>"` | `from: "ClawOps <noreply@clawops.com>"` |

---

### Important Reminder
Make sure the domain `clawops.com` is verified in your Resend dashboard at https://resend.com/domains before these changes go live. Emails will fail to send if the domain isn't verified.

