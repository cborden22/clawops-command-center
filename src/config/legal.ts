// Central legal constants for ClawOps. Update here and everything else follows.

export const COMPANY = {
  legalName: "Course Money LLC",
  dba: "ClawOps",
  displayName: "Course Money LLC (DBA ClawOps)",
  address: {
    line1: "4700 Williams Ferry Rd",
    city: "Lenoir City",
    state: "TN",
    postalCode: "37771",
    country: "United States",
  },
  addressLine: "4700 Williams Ferry Rd, Lenoir City, TN 37771",
  supportEmail: "support@clawops.com",
  privacyEmail: "privacy@clawops.com",
  legalEmail: "legal@clawops.com",
  website: "https://clawops.com",
  // Governing law / venue
  governingLawState: "Tennessee",
  venue: "Loudon County, Tennessee",
} as const;

// Bump this whenever the Terms or Privacy Policy materially change.
// Bumping triggers a re-acceptance prompt for existing users.
export const LEGAL_VERSION = "2026-08-30";

export const LEGAL_EFFECTIVE_DATE = "August 30, 2026";

export const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Notice", href: "/cookies" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Subprocessors", href: "/subprocessors" },
  { label: "Data Processing Addendum", href: "/dpa" },
  { label: "Security", href: "/security" },
] as const;

export const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Database, authentication, file storage, serverless functions", location: "United States" },
  { name: "Stripe", purpose: "Subscription billing and payment processing", location: "United States" },
  { name: "Resend", purpose: "Transactional and notification email delivery", location: "United States" },
  { name: "OpenStreetMap / Nominatim / OSRM", purpose: "Geocoding, maps and route distance calculation", location: "European Union" },
] as const;
