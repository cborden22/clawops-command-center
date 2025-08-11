
export interface ResearchStatus {
  state: string;
  abbr: string;
  research_status: 'complete' | 'partial' | 'needs_research' | 'conflicting';
  last_updated: string;
  sources_verified: number;
  confidence_level: 'high' | 'medium' | 'low';
  notes: string;
}

export const researchTracker: ResearchStatus[] = [
  {
    state: "Alabama",
    abbr: "AL", 
    research_status: "complete",
    last_updated: "2025-01-15",
    sources_verified: 3,
    confidence_level: "high",
    notes: "State department confirmed regulations"
  },
  {
    state: "Alaska",
    abbr: "AK",
    research_status: "partial", 
    last_updated: "2025-01-10",
    sources_verified: 2,
    confidence_level: "medium",
    notes: "Need to verify local municipality requirements"
  },
  {
    state: "Arizona", 
    abbr: "AZ",
    research_status: "complete",
    last_updated: "2025-01-12",
    sources_verified: 4,
    confidence_level: "high", 
    notes: "Department of Gaming provided detailed guidance"
  },
  {
    state: "Arkansas",
    abbr: "AR",
    research_status: "complete",
    last_updated: "2025-01-08", 
    sources_verified: 2,
    confidence_level: "high",
    notes: "Clear statutory prohibition confirmed"
  },
  {
    state: "California",
    abbr: "CA",
    research_status: "partial",
    last_updated: "2025-01-14",
    sources_verified: 5,
    confidence_level: "medium",
    notes: "Complex local variations, need more county research"
  }
];

export const researchPriorities = [
  { state: "Texas", priority: "high", reason: "Large market, unclear regulations" },
  { state: "Florida", priority: "high", reason: "Major tourist destination" },
  { state: "New York", priority: "high", reason: "Complex local laws" },
  { state: "Illinois", priority: "medium", reason: "Gaming law changes" },
  { state: "Nevada", priority: "medium", reason: "Gaming regulations vary by venue" }
];
