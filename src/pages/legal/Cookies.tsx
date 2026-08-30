import { LegalLayout, Section } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

const rows = [
  {
    name: "Authentication session",
    type: "Essential · local storage",
    purpose: "Keeps you signed in securely between visits.",
    retention: "Until sign-out or expiry",
  },
  {
    name: "App preferences",
    type: "Essential · local storage",
    purpose: "Remembers theme, compact view, dashboard layout, list sizes, and business defaults.",
    retention: "Until you clear browser storage",
  },
  {
    name: "Offline queue",
    type: "Essential · IndexedDB",
    purpose: "Stores entries created while offline so they can sync when you reconnect.",
    retention: "Until synced",
  },
  {
    name: "Notice acknowledgements",
    type: "Essential · local storage",
    purpose: "Remembers that you dismissed the cookie notice and viewed reminders.",
    retention: "Until you clear browser storage",
  },
  {
    name: "Stripe checkout",
    type: "Essential · third-party cookie",
    purpose: "Set by Stripe during checkout for fraud prevention and payment processing.",
    retention: "Per Stripe's policy",
  },
];

export default function Cookies() {
  return (
    <LegalLayout
      title="Cookie & Local Storage Notice"
      description="ClawOps uses only essential cookies and browser storage. No advertising or cross-site tracking."
    >
      <p>
        ClawOps does not use advertising, analytics profiling, or cross-site tracking cookies. We
        use a small number of strictly necessary cookies and browser storage entries required to run
        the Service.
      </p>

      <Section heading="What we store">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-semibold">Item</th>
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 pr-4 font-semibold">Purpose</th>
                <th className="py-2 font-semibold">Retention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{r.type}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{r.purpose}</td>
                  <td className="py-2 text-muted-foreground">{r.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading="Your choices">
        <p>
          Because these items are strictly necessary, there is no opt-out toggle — blocking them
          would prevent sign-in and core features from working. You can clear them at any time
          through your browser settings, which will sign you out and reset your preferences.
        </p>
      </Section>

      <Section heading="Questions">
        <p>Email {COMPANY.privacyEmail}.</p>
      </Section>
    </LegalLayout>
  );
}
