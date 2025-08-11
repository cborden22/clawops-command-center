
import { ComplianceData } from '@/types/compliance';

export const complianceData: ComplianceData = {
  schema_version: "1.0.0",
  updated_at: "2025-08-11",
  states: [
    {
      state: "Tennessee",
      abbr: "TN",
      status: "Regulated",
      classification: "Amusement/skill",
      prize_caps: {
        per_prize_usd: 25,
        notes: "Prize value <= $25; no cash, alcohol, tobacco"
      },
      licensing: {
        required: true,
        permit_type: "Amusement device permit",
        who_licenses: "State/County/City",
        fees_usd: [75, 100],
        renewal: "Annual",
        processing_time_days: 14
      },
      tax_finance: {
        amusement_tax: "None specified",
        sales_tax_on_plays: true,
        distributor_reg: false
      },
      operational_rules: {
        age_limits: "None specified",
        signage_required: ["No cash prizes", "Skill disclosure"],
        payout_rules: "No cash payout; only merchandise",
        inspection: "Complaint-based",
        machine_marking: "Serial/owner info visible"
      },
      local_overrides: [
        {
          jurisdiction: "Nashville, TN",
          notes: "City amusement permit required; placement limits in sidewalks",
          source: [{"title":"Municipal Code 5.XX","url":"https://example.com"}]
        }
      ],
      red_flags: [
        "No gift cards redeemable for cash equivalents if prize value cap exceeded"
      ],
      sources: [
        {"title": "State statute §X.Y.Z", "url": "https://example.com"},
        {"title": "Revenue Dept. guidance", "url": "https://example.com"}
      ],
      disclaimer: "Not legal advice. Verify with regulator."
    },
    {
      state: "Florida",
      abbr: "FL",
      status: "Allowed",
      classification: "Amusement/skill",
      prize_caps: {
        per_prize_usd: 75,
        notes: "Prize value <= $75; no cash or gift cards"
      },
      licensing: {
        required: false,
        permit_type: "None required",
        who_licenses: "N/A",
        fees_usd: [0],
        renewal: "N/A",
        processing_time_days: 0
      },
      tax_finance: {
        amusement_tax: "None",
        sales_tax_on_plays: true,
        distributor_reg: false
      },
      operational_rules: {
        age_limits: "None",
        signage_required: ["Skill-based play"],
        payout_rules: "Merchandise only",
        inspection: "None",
        machine_marking: "Owner info recommended"
      },
      local_overrides: [],
      red_flags: [],
      sources: [
        {"title": "Florida Statute 849.161", "url": "https://example.com"}
      ],
      disclaimer: "Not legal advice. Verify with regulator."
    },
    {
      state: "California",
      abbr: "CA",
      status: "Restricted",
      classification: "Mixed",
      prize_caps: {
        per_prize_usd: 0,
        notes: "No monetary prizes allowed; merchandise under $10"
      },
      licensing: {
        required: true,
        permit_type: "Amusement device license",
        who_licenses: "State",
        fees_usd: [200, 300],
        renewal: "Annual",
        processing_time_days: 30
      },
      tax_finance: {
        amusement_tax: "Varies by county",
        sales_tax_on_plays: true,
        distributor_reg: true
      },
      operational_rules: {
        age_limits: "18+ in alcohol venues",
        signage_required: ["No cash prizes", "Merchandise only", "Skill disclosure"],
        payout_rules: "Merchandise only, no tickets convertible to cash",
        inspection: "Annual",
        machine_marking: "State license number visible"
      },
      local_overrides: [
        {
          jurisdiction: "Los Angeles, CA",
          notes: "Additional city permit required; zoning restrictions",
          source: [{"title":"LA Municipal Code","url":"https://example.com"}]
        }
      ],
      red_flags: [
        "Coin pushers often classified as gambling",
        "Strict enforcement in some counties"
      ],
      sources: [
        {"title": "California Penal Code 330b", "url": "https://example.com"}
      ],
      disclaimer: "Not legal advice. Verify with regulator."
    },
    {
      state: "Texas",
      abbr: "TX",
      status: "Ambiguous",
      classification: "Mixed",
      prize_caps: {
        per_prize_usd: 0,
        notes: "Unclear; some interpretations allow skill-based prizes"
      },
      licensing: {
        required: false,
        permit_type: "Varies by locality",
        who_licenses: "Local jurisdiction",
        fees_usd: [0, 150],
        renewal: "Varies",
        processing_time_days: 21
      },
      tax_finance: {
        amusement_tax: "Local discretion",
        sales_tax_on_plays: true,
        distributor_reg: false
      },
      operational_rules: {
        age_limits: "Varies by venue",
        signage_required: ["Varies by jurisdiction"],
        payout_rules: "Consult local authority",
        inspection: "Local discretion",
        machine_marking: "Recommended"
      },
      local_overrides: [],
      red_flags: [
        "Gray area - high enforcement risk",
        "Local interpretation varies widely"
      ],
      sources: [
        {"title": "Texas Penal Code 47", "url": "https://example.com"}
      ],
      disclaimer: "Not legal advice. Verify with regulator."
    },
    {
      state: "Nevada",
      abbr: "NV",
      status: "Prohibited",
      classification: "Gambling",
      prize_caps: {
        per_prize_usd: 0,
        notes: "All prize devices regulated as gambling; strict licensing required"
      },
      licensing: {
        required: true,
        permit_type: "Gaming license",
        who_licenses: "Nevada Gaming Commission",
        fees_usd: [1000, 5000],
        renewal: "Annual",
        processing_time_days: 90
      },
      tax_finance: {
        amusement_tax: "Gaming tax applies",
        sales_tax_on_plays: false,
        distributor_reg: true
      },
      operational_rules: {
        age_limits: "21+",
        signage_required: ["Gaming license display", "Age verification"],
        payout_rules: "Full gaming regulations apply",
        inspection: "Regular gaming inspections",
        machine_marking: "Gaming approval number required"
      },
      local_overrides: [],
      red_flags: [
        "Extremely strict - gaming license required for any prize device",
        "High costs and regulatory burden"
      ],
      sources: [
        {"title": "Nevada Gaming Regulations", "url": "https://example.com"}
      ],
      disclaimer: "Not legal advice. Verify with regulator."
    }
  ]
};
