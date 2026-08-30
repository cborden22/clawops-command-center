import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function Refunds() {
  return (
    <LegalLayout title="Refund Policy" description="How trials, cancellations, and refunds work for ClawOps subscriptions.">
      <h2>Free trial</h2>
      <p>
        New accounts get a 7-day free trial. A valid payment method is required to start it, but you are not
        charged until the trial ends. Cancel any time before the trial ends and you pay nothing.
      </p>

      <h2>Cancellation</h2>
      <p>
        You can cancel from Settings → Subscription at any time. Cancellation stops future renewals; your
        access continues until the end of the period you already paid for.
      </p>

      <h2>Refunds</h2>
      <ul>
        <li>Monthly plans: charges are non-refundable, but you keep access through the paid period.</li>
        <li>Annual plans: contact us within 14 days of the charge for a pro-rated refund of unused full months.</li>
        <li>Duplicate charges or billing errors are refunded in full.</li>
        <li>Extended outages caused by us may be credited at our discretion.</li>
      </ul>

      <h2>Complimentary accounts</h2>
      <p>
        Accounts granted complimentary access are not billed and are not eligible for refunds. Complimentary
        access may be changed or ended at any time with notice.
      </p>

      <h2>Requesting a refund</h2>
      <p>
        Email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> from your account email
        with the charge date and amount. Approved refunds are returned to the original payment method within
        5–10 business days.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.displayName}
        <br />
        {COMPANY.addressLine}
      </p>
    </LegalLayout>
  );
}
