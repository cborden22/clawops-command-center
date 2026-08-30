import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY, SUBPROCESSORS } from "@/config/legal";

export default function DPA() {
  return (
    <LegalLayout title="Data Processing Addendum" description="Applies where we process personal data on your behalf.">
      <h2>1. Roles</h2>
      <p>
        For personal data you upload to ClawOps (such as location contacts, leads, and team members), you are
        the controller and {COMPANY.legalName} is the processor. For your own account and billing data, we
        act as controller under our Privacy Policy.
      </p>

      <h2>2. Scope of Processing</h2>
      <ul>
        <li><strong>Subject matter:</strong> providing the ClawOps operations platform.</li>
        <li><strong>Duration:</strong> the term of your subscription plus deletion periods.</li>
        <li><strong>Categories of data subjects:</strong> your staff, location owners/contacts, and sales leads.</li>
        <li><strong>Categories of data:</strong> names, business contact details, addresses, notes, and operational records.</li>
      </ul>

      <h2>3. Our Obligations</h2>
      <ul>
        <li>Process personal data only on your documented instructions, including use of the Service.</li>
        <li>Ensure personnel with access are bound by confidentiality.</li>
        <li>Implement appropriate technical and organizational measures (see our Security page).</li>
        <li>Assist you with data-subject requests, security incidents, and impact assessments.</li>
        <li>Delete or return personal data at the end of the relationship, subject to legal retention.</li>
      </ul>

      <h2>4. Subprocessors</h2>
      <p>
        You authorize the subprocessors listed on our Subprocessors page:{" "}
        {SUBPROCESSORS.map((s) => s.name).join(", ")}. We remain responsible for their performance and will
        notify you before adding new ones.
      </p>

      <h2>5. International Transfers</h2>
      <p>
        Where personal data is transferred out of the EEA/UK, the EU Standard Contractual Clauses (and UK
        Addendum where applicable) are incorporated by reference.
      </p>

      <h2>6. Security Incidents</h2>
      <p>
        We will notify you without undue delay after becoming aware of a personal data breach affecting your
        data, with the information reasonably available to us.
      </p>

      <h2>7. Audits</h2>
      <p>
        On reasonable written request (no more than once per year), we will provide information necessary to
        demonstrate compliance with this addendum.
      </p>

      <h2>8. Signature</h2>
      <p>
        This addendum is accepted by your acceptance of the Terms of Service. For a countersigned copy,
        email <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>.
      </p>
      <p>
        {COMPANY.displayName}
        <br />
        {COMPANY.addressLine}
      </p>
    </LegalLayout>
  );
}
