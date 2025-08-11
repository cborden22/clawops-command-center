
export interface ComplianceData {
  schema_version: string;
  updated_at: string;
  states: StateRegulation[];
}

export interface StateRegulation {
  state: string;
  abbr: string;
  status: 'Allowed' | 'Regulated' | 'Restricted' | 'Prohibited' | 'Ambiguous';
  classification: 'Amusement/skill' | 'Gambling' | 'Mixed';
  prize_caps: {
    per_prize_usd: number;
    notes: string;
  };
  licensing: {
    required: boolean;
    permit_type: string;
    who_licenses: string;
    fees_usd: number[];
    renewal: string;
    processing_time_days: number;
  };
  tax_finance: {
    amusement_tax: string;
    sales_tax_on_plays: boolean;
    distributor_reg: boolean;
  };
  operational_rules: {
    age_limits: string;
    signage_required: string[];
    payout_rules: string;
    inspection: string;
    machine_marking: string;
  };
  local_overrides: LocalOverride[];
  red_flags: string[];
  sources: Source[];
  disclaimer: string;
}

export interface LocalOverride {
  jurisdiction: string;
  notes: string;
  source: Source[];
}

export interface Source {
  title: string;
  url: string;
}

export interface WizardQuestion {
  id: string;
  question: string;
  type: 'yes_no' | 'select';
  options?: string[];
}

export interface WizardResult {
  classification: string;
  risk_flags: string[];
  requirements: string[];
  sources: Source[];
}

export interface DeviceClassification {
  questions: WizardQuestion[];
  logic: (answers: Record<string, string>) => WizardResult;
}
