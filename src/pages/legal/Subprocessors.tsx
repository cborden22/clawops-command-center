import { LegalLayout, Section } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

const subprocessors = [
  {
    name: "Stripe, Inc.",
    purpose: "Subscription billing, checkout, and payment processing",
    data: "Name, email, billing details, card data (held by Stripe), subscription status",
    location: "United States",
  },
  {
    name: "Supabase / cloud database & storage provider",
    purpose: "Application database, authentication, file storage, and serverless functions",
    data: "All account and business data, uploaded photos and receipts",
    location: "United States",
  },
  {
    name: "Lovable (application hosting)",
    purpose: "Hosting and delivery of the web application",
    data: "Technical request data such as IP address and browser type",
    location: "United States / EU",
  },
  {
    name: "Resend",
    purpose: "Transactional email (verification, invitations, reminder digests)",
    data: "Recipient email address, name, message content",
    location: "United States",
  },
  {
    name: "OpenStreetMap / Nominatim / OSRM",
    purpose: "Map tiles, address geocoding, and driving distance estimates",
    data: "Location addresses and coordinates you enter (no account identifiers)",
    location: "European Union",
  },
];

export default function Subprocessors() {
  return (
    <LegalLayout
      title="Subprocessors"
      description="The third-party service providers ClawOps uses to deliver the platform, what they do, and what data they handle."
    >
      <p>
        We use the providers below to operate ClawOps. Each is bound by contractual confidentiality
        and data protection obligations and may process personal information only on our
        instructions.
      </p>

      <Section heading="Current subprocessors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-semibold">Provider</th>
                <th className="py-2 pr-4 font-semibold">Purpose</th>
                <th className="py-2 pr-4 font-semibold">Data handled</th>
                <th className="py-2 font-semibold">Region</th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((s) => (
                <tr key={s.name} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-4 font-medium">{s.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{s.purpose}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{s.data}</td>
                  <td className="py-2 text-muted-foreground">{s.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading="Changes">
        <p>
          We will update this page before adding a new subprocessor that processes personal
          information. To be notified of changes, email {COMPANY.privacyEmail} and ask to be added
          to the subprocessor notification list.
        </p>
      </Section>
    </LegalLayout>
  );
}
