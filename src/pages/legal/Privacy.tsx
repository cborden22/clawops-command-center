import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY, SUBPROCESSORS } from "@/config/legal";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" description={`How ${COMPANY.displayName} collects, uses, and protects your information.`}>
      <h2>1. Who We Are</h2>
      <p>
        {COMPANY.displayName}, {COMPANY.addressLine}. Questions? Email{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
      </p>

      <h2>2. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, password hash, team role, notification preferences.</li>
        <li><strong>Business data you enter:</strong> locations, machines, inventory, revenue and expense entries, receipts and photos, mileage and routes, leads and contacts.</li>
        <li><strong>Billing data:</strong> subscription status and identifiers from Stripe. We never see or store full card numbers.</li>
        <li><strong>Technical data:</strong> log data, device/browser information, and approximate location if you enable route features.</li>
      </ul>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>To provide, secure, and support the Service.</li>
        <li>To process subscriptions and send transactional or reminder emails you have enabled.</li>
        <li>To diagnose problems, prevent abuse, and improve reliability.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>We do not sell personal information and we do not use your business data to train AI models.</p>

      <h2>4. Legal Bases (EEA/UK users)</h2>
      <p>
        We process data to perform our contract with you, to pursue legitimate interests in operating and
        securing the Service, to comply with legal obligations, and — where required — with your consent.
      </p>

      <h2>5. Sharing</h2>
      <p>We share data only with service providers acting on our behalf:</p>
      <ul>
        {SUBPROCESSORS.map((s) => (
          <li key={s.name}>
            <strong>{s.name}</strong> — {s.purpose} ({s.location})
          </li>
        ))}
      </ul>
      <p>
        We may also disclose information when required by law or to protect our rights, and in connection
        with a merger or acquisition (with notice to you).
      </p>

      <h2>6. Data Isolation & Security</h2>
      <p>
        Every record is scoped to your account and enforced with row-level security in the database. Files
        such as receipts and photos live in private storage and are served only through short-lived signed
        links. Data is encrypted in transit and at rest. No staff-facing admin UI can browse your business
        data.
      </p>

      <h2>7. Retention</h2>
      <p>
        We keep your data while your account is active. After deletion, data is removed from production
        systems promptly and from backups within 30 days, except where retention is legally required (for
        example, billing records).
      </p>

      <h2>8. Your Rights</h2>
      <ul>
        <li>Access and export your data (Settings → Security → Privacy & Data).</li>
        <li>Correct inaccurate data directly in the app.</li>
        <li>Delete your account and associated data at any time.</li>
        <li>Object to or restrict certain processing, and lodge a complaint with your supervisory authority.</li>
      </ul>

      <h2>9. Children</h2>
      <p>The Service is not directed to anyone under 18 and we do not knowingly collect their data.</p>

      <h2>10. International Transfers</h2>
      <p>
        Our systems are primarily hosted in the United States. Where data is transferred from the EEA/UK we
        rely on Standard Contractual Clauses with our providers.
      </p>

      <h2>11. Changes</h2>
      <p>
        We will post updates here and notify you in the app for material changes. Continued use after the
        effective date means you accept the updated policy.
      </p>
    </LegalLayout>
  );
}
