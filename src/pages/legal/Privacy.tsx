import { Link } from "react-router-dom";
import { LegalLayout, Section } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How ClawOps collects, uses, shares, and protects personal information, and the privacy rights available to you."
    >
      <p>
        {COMPANY.displayName} respects your privacy. This policy explains what personal information
        we collect through the ClawOps platform and website, why we collect it, who we share it
        with, and the choices you have.
      </p>

      <Section heading="1. Information we collect">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account information</strong> — name, email address, password hash, profile
            settings, notification preferences, and the version of our policies you accepted.
          </li>
          <li>
            <strong>Business data you enter</strong> — locations, contacts at those locations,
            machines, revenue and expense entries, receipts, inventory, leads, maintenance reports,
            commission statements, and team member records.
          </li>
          <li>
            <strong>Photos and files</strong> — location photos, collection-screen verification
            photos, receipts, and logos you upload.
          </li>
          <li>
            <strong>Trip and route data</strong> — odometer readings, route stops, and, when you
            enable it, your device location for arrival detection and mileage estimates.
          </li>
          <li>
            <strong>Payment information</strong> — handled by Stripe. We receive subscription
            status, plan, renewal dates, and the last four digits/brand of the card. We never
            receive or store your full card number.
          </li>
          <li>
            <strong>Technical data</strong> — IP address, browser and device type, timestamps, and
            error logs generated when you use the Service.
          </li>
          <li>
            <strong>Support communications</strong> — messages and feedback you send us.
          </li>
        </ul>
      </Section>

      <Section heading="2. How we use information">
        <ul className="list-disc space-y-2 pl-6">
          <li>provide, operate, secure, and improve the Service;</li>
          <li>authenticate you and enforce team permissions;</li>
          <li>process subscriptions, trials, invoices, and refunds;</li>
          <li>send transactional email such as verification, password resets, team invitations, and reminder digests you have enabled;</li>
          <li>respond to support requests;</li>
          <li>detect, investigate, and prevent fraud, abuse, and security incidents;</li>
          <li>comply with legal, tax, and accounting obligations.</li>
        </ul>
        <p>
          We do not sell or share personal information for cross-context behavioral advertising, and
          we do not use your business data to build advertising profiles.
        </p>
      </Section>

      <Section heading="3. Legal bases (EEA/UK)">
        <p>
          Where the GDPR or UK GDPR applies, we process personal information to perform our contract
          with you (providing the Service), on the basis of legitimate interests (security, product
          improvement, direct communications about the Service), with your consent (device location,
          optional notifications), and to comply with legal obligations.
        </p>
      </Section>

      <Section heading="4. Who we share information with">
        <p>
          We share personal information only with service providers acting on our instructions, and
          only as needed to run the Service. Current providers are listed on our{" "}
          <Link to="/legal/subprocessors" className="text-primary hover:underline">Subprocessors</Link> page and include payment
          processing, transactional email, cloud hosting and database, and mapping/routing services.
          We may also disclose information when required by law, to enforce our Terms, or in
          connection with a merger or sale of assets (with notice to you).
        </p>
        <p>
          If you share a location owner portal link, anyone with that link can view that location's
          machines and commission statements without signing in. Share those links only with the
          intended recipient; you can rotate or disable a link at any time.
        </p>
      </Section>

      <Section heading="5. Retention">
        <p>
          We keep account and business data for as long as your account is active. After account
          deletion we remove your data from active systems promptly and from routine backups within
          90 days, except records we must retain for tax, accounting, fraud prevention, or legal
          obligations.
        </p>
      </Section>

      <Section heading="6. Security">
        <p>
          Data is encrypted in transit, stored in access-controlled managed infrastructure, and
          isolated per account using database row-level security. Uploaded photos and receipts live
          in private storage accessible only through short-lived signed links. Team access is
          governed by role-based permissions you control. More detail is on our{" "}
          <Link to="/legal/security" className="text-primary hover:underline">Security</Link> page. No system is perfectly secure;
          please report concerns to {COMPANY.securityEmail}.
        </p>
      </Section>

      <Section heading="7. Your rights and choices">
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Access and portability</strong> — export your data from Settings → Privacy &amp; Data.</li>
          <li><strong>Correction</strong> — edit your profile and records directly in the app.</li>
          <li><strong>Deletion</strong> — delete your account from Settings → Privacy &amp; Data, or email us.</li>
          <li><strong>Marketing and reminders</strong> — turn notification emails off in Settings.</li>
          <li><strong>Location</strong> — device location is optional and controlled by your browser or device permissions.</li>
        </ul>
        <p>
          Depending on where you live, you may also have the right to object to or restrict
          processing, to withdraw consent, and to lodge a complaint with your supervisory authority.
          California residents may request disclosure of the categories of information collected and
          may exercise deletion rights as described above; we do not sell personal information. To
          make a request, email {COMPANY.privacyEmail}. We will not discriminate against you for
          exercising these rights.
        </p>
      </Section>

      <Section heading="8. Cookies and local storage">
        <p>
          We use only essential cookies and browser storage. Details are in the{" "}
          <Link to="/legal/cookies" className="text-primary hover:underline">Cookie Notice</Link>.
        </p>
      </Section>

      <Section heading="9. International transfers">
        <p>
          Our providers may process data in the United States and other countries. Where required,
          transfers rely on appropriate safeguards such as the EU Standard Contractual Clauses.
        </p>
      </Section>

      <Section heading="10. Children">
        <p>
          The Service is intended for business use by adults. We do not knowingly collect personal
          information from children under 16. If you believe a child provided information, contact{" "}
          {COMPANY.privacyEmail} and we will delete it.
        </p>
      </Section>

      <Section heading="11. Changes">
        <p>
          We will post updates to this policy here and update the version and effective date. If
          changes are material we will notify you in-app or by email.
        </p>
      </Section>

      <Section heading="12. Contact">
        <p>
          Data controller: {COMPANY.legalName} (DBA {COMPANY.dba})
          <br />
          {COMPANY.privacyEmail} · {COMPANY.website}
          <br />
          {COMPANY.mailingAddress}
        </p>
      </Section>
    </LegalLayout>
  );
}
