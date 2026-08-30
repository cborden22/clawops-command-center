import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY, SUBPROCESSORS } from "@/config/legal";

export default function Subprocessors() {
  return (
    <LegalLayout title="Subprocessors" description="Third parties that may process customer data on our behalf.">
      <p>
        {COMPANY.displayName} uses the vendors below to operate ClawOps. Each is bound by contractual
        confidentiality and security obligations.
      </p>

      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Purpose</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((s) => (
            <tr key={s.name} className="border-t border-border">
              <td className="font-medium">{s.name}</td>
              <td>{s.purpose}</td>
              <td>{s.location}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Changes</h2>
      <p>
        We update this page before adding a new subprocessor. To be notified of changes, email{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
      </p>
    </LegalLayout>
  );
}
