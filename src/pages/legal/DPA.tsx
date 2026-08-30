import { Link } from "react-router-dom";
import { LegalLayout, Section } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function DPA() {
  return (
    <LegalLayout
      title="Data Processing Addendum"
      description="The data processing terms that apply when ClawOps processes personal data on behalf of a business customer."
    >
      <p>
        This Data Processing Addendum ("DPA") forms part of the{" "}
        <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> between {COMPANY.displayName}
        ("Processor") and the customer ("Controller") and applies where the Processor processes
        personal data on the Controller's behalf. By accepting the Terms, the Controller accepts
        this DPA.
      </p>

      <Section heading="1. Subject matter and duration">
        <p>
          The Processor processes personal data to provide the ClawOps platform for the duration of
          the Controller's subscription, plus any deletion period described below.
        </p>
      </Section>

      <Section heading="2. Nature and purpose">
        <p>
          Hosting, storage, transmission, backup, and display of Controller data for operations
          management: locations, machines, revenue, inventory, maintenance, mileage, leads, team
          administration, and reporting.
        </p>
      </Section>

      <Section heading="3. Categories of data subjects and personal data">
        <ul className="list-disc space-y-2 pl-6">
          <li>Controller's staff and invited team members — name, email, role, permissions, activity attribution, trip and route records, uploaded verification photos.</li>
          <li>Controller's location contacts and leads — business name, contact name, phone, email, address.</li>
          <li>People who submit machine issue reports — optional name and contact details they choose to provide.</li>
        </ul>
        <p>No special category data is required by the Service and it should not be uploaded.</p>
      </Section>

      <Section heading="4. Processor obligations">
        <ul className="list-disc space-y-2 pl-6">
          <li>process personal data only on documented instructions from the Controller, including for international transfers, unless legally required otherwise;</li>
          <li>ensure personnel with access are bound by confidentiality;</li>
          <li>implement appropriate technical and organisational measures, including encryption in transit, per-tenant row-level isolation, private file storage with expiring links, and role-based access control;</li>
          <li>assist the Controller with data subject requests, security incidents, and data protection impact assessments, taking into account the nature of processing;</li>
          <li>make available information necessary to demonstrate compliance and allow reasonable audits, no more than once per year unless required by a supervisory authority.</li>
        </ul>
      </Section>

      <Section heading="5. Subprocessors">
        <p>
          The Controller gives general authorisation for the Processor to engage the subprocessors
          listed on the <Link to="/legal/subprocessors" className="text-primary hover:underline">Subprocessors</Link> page. The
          Processor imposes data protection terms on each subprocessor no less protective than this
          DPA and remains liable for their performance. The Processor will update that page before
          adding a new subprocessor, and the Controller may object on reasonable data protection
          grounds by writing to {COMPANY.privacyEmail}.
        </p>
      </Section>

      <Section heading="6. Security incidents">
        <p>
          The Processor will notify the Controller without undue delay, and in any case within 72
          hours of becoming aware of a personal data breach affecting Controller data, and will
          provide the information reasonably needed for the Controller to meet its own notification
          obligations.
        </p>
      </Section>

      <Section heading="7. International transfers">
        <p>
          Where personal data is transferred out of the EEA, UK, or Switzerland, the parties rely on
          the EU Standard Contractual Clauses (Module Two, controller-to-processor) and the UK
          Addendum, which are incorporated by reference with this DPA supplying the required details.
        </p>
      </Section>

      <Section heading="8. Return and deletion">
        <p>
          The Controller may export data at any time from Settings → Privacy &amp; Data. On
          termination or on request, the Processor deletes Controller personal data from active
          systems promptly and from backups within 90 days, except where retention is legally
          required.
        </p>
      </Section>

      <Section heading="9. Order of precedence">
        <p>
          In the event of a conflict, this DPA prevails over the Terms of Service with respect to
          the processing of personal data.
        </p>
      </Section>

      <Section heading="10. Signature">
        <p>
          A countersigned copy is available on request — email {COMPANY.privacyEmail} with your
          account email and entity details.
        </p>
      </Section>
    </LegalLayout>
  );
}
