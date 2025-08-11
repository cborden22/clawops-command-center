
import { StateRegulation } from '@/types/compliance';

export const stateComplianceData: StateRegulation[] = [
  {
    state: "Alabama",
    abbr: "AL",
    status: "Regulated",
    classification: "Amusement/skill",
    prize_caps: {
      per_prize_usd: 25,
      notes: "Merchandise only, no cash or cash equivalents"
    },
    licensing: {
      required: true,
      permit_type: "Amusement device permit",
      who_licenses: "Alabama Department of Revenue",
      fees_usd: [50, 100],
      renewal: "Annual",
      processing_time_days: 21
    },
    tax_finance: {
      amusement_tax: "4% on gross receipts",
      sales_tax_on_plays: true,
      distributor_reg: true
    },
    operational_rules: {
      age_limits: "None specified",
      signage_required: ["No cash prizes", "Skill-based game"],
      payout_rules: "Merchandise only",
      inspection: "Annual",
      machine_marking: "Serial number and operator info required"
    },
    local_overrides: [],
    red_flags: [
      "Must register as amusement operator",
      "High tax rate on gross receipts"
    ],
    sources: [
      {"title": "Alabama Code § 40-26-1", "url": "https://codes.findlaw.com/al/title-40/"},
      {"title": "AL Dept of Revenue - Amusement Devices", "url": "https://revenue.alabama.gov/"}
    ],
    disclaimer: "Not legal advice. Verify with Alabama Department of Revenue."
  },
  {
    state: "Alaska",
    abbr: "AK", 
    status: "Allowed",
    classification: "Amusement/skill",
    prize_caps: {
      per_prize_usd: 50,
      notes: "Merchandise only, skill-based games allowed"
    },
    licensing: {
      required: false,
      permit_type: "None required at state level",
      who_licenses: "Local jurisdiction",
      fees_usd: [0],
      renewal: "N/A",
      processing_time_days: 0
    },
    tax_finance: {
      amusement_tax: "None at state level",
      sales_tax_on_plays: false,
      distributor_reg: false
    },
    operational_rules: {
      age_limits: "None specified",
      signage_required: ["Skill game disclosure"],
      payout_rules: "Merchandise only",
      inspection: "Local discretion",
      machine_marking: "Recommended"
    },
    local_overrides: [
      {
        jurisdiction: "Anchorage, AK",
        notes: "Business license required for operation",
        source: [{"title": "Anchorage Municipal Code", "url": "https://www.muni.org/"}]
      }
    ],
    red_flags: [],
    sources: [
      {"title": "Alaska Statutes Title 11", "url": "http://www.legis.state.ak.us/"}
    ],
    disclaimer: "Not legal advice. Check with local authorities."
  },
  {
    state: "Arizona",
    abbr: "AZ",
    status: "Restricted", 
    classification: "Mixed",
    prize_caps: {
      per_prize_usd: 0,
      notes: "No monetary value prizes allowed in most interpretations"
    },
    licensing: {
      required: true,
      permit_type: "Amusement device license",
      who_licenses: "Arizona Department of Gaming",
      fees_usd: [200, 500],
      renewal: "Annual",
      processing_time_days: 45
    },
    tax_finance: {
      amusement_tax: "Varies by jurisdiction",
      sales_tax_on_plays: true,
      distributor_reg: true
    },
    operational_rules: {
      age_limits: "18+ in establishments serving alcohol",
      signage_required: ["No cash prizes", "Amusement only"],
      payout_rules: "No prizes with monetary value",
      inspection: "Regular",
      machine_marking: "License number visible"
    },
    local_overrides: [
      {
        jurisdiction: "Phoenix, AZ",
        notes: "Additional city permits required, placement restrictions",
        source: [{"title": "Phoenix City Code", "url": "https://www.phoenix.gov/"}]
      }
    ],
    red_flags: [
      "Very restrictive interpretation of gambling laws",
      "High enforcement risk"
    ],
    sources: [
      {"title": "Arizona Revised Statutes § 13-3301", "url": "https://www.azleg.gov/"}
    ],
    disclaimer: "Not legal advice. Consult Arizona Department of Gaming."
  },
  {
    state: "Arkansas",
    abbr: "AR",
    status: "Prohibited",
    classification: "Gambling",
    prize_caps: {
      per_prize_usd: 0,
      notes: "All prize-awarding devices prohibited"
    },
    licensing: {
      required: false,
      permit_type: "Prohibited",
      who_licenses: "N/A",
      fees_usd: [0],
      renewal: "N/A",
      processing_time_days: 0
    },
    tax_finance: {
      amusement_tax: "N/A",
      sales_tax_on_plays: false,
      distributor_reg: false
    },
    operational_rules: {
      age_limits: "N/A - Prohibited",
      signage_required: [],
      payout_rules: "Prohibited",
      inspection: "N/A",
      machine_marking: "N/A"
    },
    local_overrides: [],
    red_flags: [
      "Complete prohibition on prize-awarding devices",
      "Criminal penalties for operation"
    ],
    sources: [
      {"title": "Arkansas Code § 5-66-101", "url": "https://codes.findlaw.com/ar/"}
    ],
    disclaimer: "Not legal advice. Operation prohibited by state law."
  },
  {
    state: "California",
    abbr: "CA",
    status: "Restricted",
    classification: "Mixed",
    prize_caps: {
      per_prize_usd: 0,
      notes: "No monetary prizes allowed; merchandise under $10 recommended"
    },
    licensing: {
      required: true,
      permit_type: "Amusement device license",
      who_licenses: "California Department of Justice",
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
        notes: "Additional city permit required; zoning restrictions apply",
        source: [{"title": "LA Municipal Code", "url": "https://codelibrary.amlegal.com/codes/los_angeles/"}]
      },
      {
        jurisdiction: "San Francisco, CA", 
        notes: "Entertainment permit required; health department approval",
        source: [{"title": "SF Police Code", "url": "https://codelibrary.amlegal.com/codes/san_francisco/"}]
      }
    ],
    red_flags: [
      "Coin pushers often classified as gambling",
      "Strict enforcement in some counties",
      "Complex local permitting requirements"
    ],
    sources: [
      {"title": "California Penal Code 330b", "url": "https://codes.findlaw.com/ca/penal-code/"}
    ],
    disclaimer: "Not legal advice. Verify with California DOJ and local authorities."
  }
];
