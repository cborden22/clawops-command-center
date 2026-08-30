import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function Cookies() {
  return (
    <LegalLayout title="Cookie Notice" description="ClawOps uses essential storage only — no advertising or tracking cookies.">
      <h2>What we use</h2>
      <ul>
        <li><strong>Authentication storage:</strong> keeps you signed in between visits.</li>
        <li><strong>Preferences:</strong> local storage for theme, compact view, dashboard layout, and dismissed notices.</li>
        <li><strong>Offline queue:</strong> browser storage (IndexedDB) that holds entries created offline until they sync.</li>
        <li><strong>Billing:</strong> Stripe sets cookies on its own checkout and billing pages for fraud prevention.</li>
      </ul>

      <h2>What we do not use</h2>
      <p>No advertising cookies, no cross-site tracking, no third-party analytics profiling.</p>

      <h2>Managing storage</h2>
      <p>
        You can clear cookies and site data in your browser settings. Clearing them signs you out and removes
        any unsynced offline entries.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>
      </p>
    </LegalLayout>
  );
}
