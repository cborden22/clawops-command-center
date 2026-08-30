import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/legal";

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" description={`These terms govern your use of ClawOps, operated by ${COMPANY.displayName}.`}>
      <h2>1. Agreement</h2>
      <p>
        By creating an account or using ClawOps (the "Service"), you agree to these Terms of Service. If you
        are using the Service on behalf of a business, you represent that you are authorized to bind that
        business to these terms.
      </p>

      <h2>2. The Service</h2>
      <p>
        ClawOps is a business operations platform for amusement and vending route operators, including
        location, machine, inventory, revenue, mileage, and team management tools. We may add, change, or
        remove features over time.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials secure.</li>
        <li>You are responsible for all activity that occurs under your account and any team accounts you invite.</li>
        <li>Accounts are for business use; you must be at least 18 years old.</li>
      </ul>

      <h2>4. Subscriptions, Trials & Billing</h2>
      <ul>
        <li>Paid plans are billed in advance on a monthly or annual basis through Stripe.</li>
        <li>Free trials require a valid payment method. Unless canceled before the trial ends, the plan converts to a paid subscription automatically.</li>
        <li>Subscriptions renew automatically until canceled. You may cancel at any time from Settings; access continues through the end of the paid period.</li>
        <li>Complimentary access may be granted at our discretion and may be modified or ended at any time.</li>
        <li>Fees are exclusive of applicable taxes. See our Refund Policy for refund terms.</li>
      </ul>

      <h2>5. Your Data</h2>
      <p>
        You retain ownership of the data you submit. You grant us a limited license to host, process, and
        transmit that data solely to operate and support the Service. We do not sell your data.
      </p>

      <h2>6. Acceptable Use</h2>
      <ul>
        <li>No unlawful, infringing, or fraudulent use of the Service.</li>
        <li>No attempts to breach security, access other customers' data, or disrupt the Service.</li>
        <li>No reverse engineering, resale, or automated scraping without written permission.</li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>
        The Service integrates with third parties such as Stripe, mapping providers, and email delivery
        providers. Your use of those services is subject to their terms.
      </p>

      <h2>8. Compliance Information Disclaimer</h2>
      <p>
        Any regulatory, tax, or compliance content in the Service is provided for general informational
        purposes only and is not legal, tax, or accounting advice. You are responsible for verifying the
        rules that apply to your operations.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available" without warranties of any kind, express or
        implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not
        warrant that the Service will be uninterrupted or error-free.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, {COMPANY.legalName} will not be liable for indirect,
        incidental, special, consequential, or punitive damages, or for lost profits, revenue, or data. Our
        total liability for any claim will not exceed the amounts you paid for the Service in the twelve (12)
        months preceding the claim.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {COMPANY.legalName} from claims arising out of your data,
        your use of the Service, or your violation of these terms or applicable law.
      </p>

      <h2>12. Suspension & Termination</h2>
      <p>
        We may suspend or terminate accounts for non-payment, violation of these terms, or activity that
        risks harm to the Service or other customers. You may stop using the Service and delete your account
        at any time from Settings.
      </p>

      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these terms. Material changes will be announced in the app, and continued use after the
        effective date constitutes acceptance. We may require you to re-accept updated terms.
      </p>

      <h2>14. Governing Law & Venue</h2>
      <p>
        These terms are governed by the laws of the State of {COMPANY.governingLawState}, without regard to
        its conflict-of-law rules. The exclusive venue for any dispute is the state or federal courts located
        in {COMPANY.venue}, and both parties consent to personal jurisdiction there. Consumer rights that
        cannot be waived under {COMPANY.governingLawState} law remain unaffected.
      </p>

      <h2>15. Contact</h2>
      <p>
        {COMPANY.displayName}
        <br />
        {COMPANY.addressLine}
        <br />
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>
      </p>
    </LegalLayout>
  );
}
