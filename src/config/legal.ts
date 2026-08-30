// Central legal/company constants. Bump LEGAL_VERSION when policies materially change.
export const LEGAL_VERSION = "2026-08-30";
export const LEGAL_EFFECTIVE_DATE = "August 30, 2026";

export const COMPANY = {
  legalName: "Course Money LLC",
  dba: "ClawOps",
  displayName: "Course Money LLC (DBA ClawOps)",
  supportEmail: "support@clawops.com",
  privacyEmail: "privacy@clawops.com",
  securityEmail: "security@clawops.com",
  website: "https://clawops.com",
  governingLaw: "the State of Ohio, United States",
  mailingAddress: "Course Money LLC, ClawOps — mailing address available on request",
} as const;

export const LEGAL_LINKS = [
  { to: "/legal/terms", label: "Terms of Service" },
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/cookies", label: "Cookie Notice" },
  { to: "/legal/refunds", label: "Billing & Refunds" },
  { to: "/legal/subprocessors", label: "Subprocessors" },
  { to: "/legal/dpa", label: "Data Processing Addendum" },
  { to: "/legal/security", label: "Security" },
] as const;
