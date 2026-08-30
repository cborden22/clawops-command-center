import { LegalLayout, Section } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function Refunds() {
  return (
    <LegalLayout
      title="Billing & Refund Policy"
      description="How ClawOps trials, subscription charges, cancellations, and refunds work."
    >
      <Section heading="Free trial">
        <p>
          New accounts may start a 7-day free trial. A valid payment method is required up front and
          is verified by Stripe. You are not charged during the trial. If you do not cancel before
          the trial ends, the subscription starts automatically and your card is charged the plan
          price.
        </p>
      </Section>

      <Section heading="Subscription charges">
        <ul className="list-disc space-y-2 pl-6">
          <li>Monthly plans are charged every month on your renewal date.</li>
          <li>Annual plans are charged once per year on your renewal date.</li>
          <li>All prices are in US dollars unless stated otherwise, and exclude any applicable taxes.</li>
          <li>Payments are processed by Stripe; receipts are emailed automatically.</li>
        </ul>
      </Section>

      <Section heading="Cancellation">
        <p>
          You can cancel at any time from Settings → Subscription, or through the Stripe customer
          portal link there. Cancellation stops future renewals. Your access continues until the end
          of the period you already paid for; we do not prorate partial periods.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          Because the trial gives full access before any charge, subscription fees are generally
          non-refundable. We will review refund requests made within 14 days of a charge in good
          faith, and we will refund promptly in cases of duplicate charges, billing errors, or a
          sustained outage that prevented you from using the Service. Email{" "}
          {COMPANY.supportEmail} with your account email and the charge date.
        </p>
      </Section>

      <Section heading="Failed payments">
        <p>
          If a payment fails, Stripe will retry. If it continues to fail we may suspend access until
          payment succeeds. Your data is retained during suspension and restored when billing
          resumes.
        </p>
      </Section>

      <Section heading="Price changes">
        <p>
          We will give at least 30 days' notice of any price increase. You may cancel before the new
          price takes effect.
        </p>
      </Section>

      <Section heading="Complimentary access">
        <p>
          We may grant complimentary access to selected accounts. Complimentary access carries no
          charge, has no refund value, and may be changed or ended at any time.
        </p>
      </Section>

      <Section heading="Chargebacks">
        <p>
          Please contact {COMPANY.supportEmail} before disputing a charge with your bank so we can
          resolve it directly. Accounts with an open chargeback may be suspended pending resolution.
        </p>
      </Section>
    </LegalLayout>
  );
}
