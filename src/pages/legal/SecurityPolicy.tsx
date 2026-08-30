import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function SecurityPolicy() {
  return (
    <LegalLayout title="Security" description="How we protect your ClawOps data.">
      <h2>Data isolation</h2>
      <p>
        Every table is protected by row-level security so records are only readable by the account that owns
        them and the team members that account has authorized. There is no internal admin interface that can
        browse customer business data.
      </p>

      <h2>Encryption</h2>
      <p>All traffic is served over TLS. Data at rest is encrypted by our hosting provider.</p>

      <h2>Files</h2>
      <p>
        Receipts, machine photos, and collection verification images are stored in private buckets and served
        through short-lived signed URLs only.
      </p>

      <h2>Authentication</h2>
      <ul>
        <li>Passwords require at least 8 characters with mixed case, a number, and a symbol.</li>
        <li>Email verification is required before first sign-in.</li>
        <li>Leaked-password protection is enabled.</li>
        <li>Sensitive account changes require one-time-code re-authentication.</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Card data is handled entirely by Stripe (PCI DSS Level 1). ClawOps never receives full card numbers.
      </p>

      <h2>Access control</h2>
      <p>
        Team members receive only the permissions the account owner grants, enforced both in the interface
        and at the database level.
      </p>

      <h2>Reporting a vulnerability</h2>
      <p>
        Email <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a> with details and steps to
        reproduce. We acknowledge reports within 3 business days and do not pursue legal action against
        good-faith research.
      </p>
    </LegalLayout>
  );
}
