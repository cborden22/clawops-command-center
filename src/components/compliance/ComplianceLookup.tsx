
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, FileText, Trash2, Download, Wand2 } from 'lucide-react';
import { complianceData } from '@/data/complianceData';
import { StateRegulation, LocalOverride } from '@/types/compliance';
import { DeviceWizard } from './DeviceWizard';
import { ComplianceExport } from './ComplianceExport';

export const ComplianceLookup = () => {
  const [selectedState, setSelectedState] = useState<string>('');
  const [cityCounty, setCityCounty] = useState<string>('');
  const [stateData, setStateData] = useState<StateRegulation | null>(null);
  const [localOverrides, setLocalOverrides] = useState<LocalOverride[]>([]);
  const [showWizard, setShowWizard] = useState(false);

  const handleStateSelect = (stateAbbr: string) => {
    setSelectedState(stateAbbr);
    const state = complianceData.states.find(s => s.abbr === stateAbbr);
    setStateData(state || null);
    
    // Filter local overrides if city/county is provided
    if (state && cityCounty) {
      const filteredOverrides = state.local_overrides.filter(override =>
        override.jurisdiction.toLowerCase().includes(cityCounty.toLowerCase())
      );
      setLocalOverrides(filteredOverrides);
    } else {
      setLocalOverrides(state?.local_overrides || []);
    }
  };

  const handleCityChange = (value: string) => {
    setCityCounty(value);
    if (stateData && value) {
      const filteredOverrides = stateData.local_overrides.filter(override =>
        override.jurisdiction.toLowerCase().includes(value.toLowerCase())
      );
      setLocalOverrides(filteredOverrides);
    } else {
      setLocalOverrides(stateData?.local_overrides || []);
    }
  };

  const clearSession = () => {
    setSelectedState('');
    setCityCounty('');
    setStateData(null);
    setLocalOverrides([]);
    setShowWizard(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Allowed': return 'bg-green-500';
      case 'Regulated': return 'bg-yellow-500';
      case 'Restricted': return 'bg-orange-500';
      case 'Prohibited': return 'bg-red-500';
      case 'Ambiguous': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Law & Compliance Quick Lookup
        </h1>
        <p className="text-muted-foreground">
          Fast, plain-English snapshot of state and local rules for claw/skill machines
        </p>
        <div className="text-xs text-muted-foreground">
          Data v{complianceData.schema_version} • Updated {complianceData.updated_at}
        </div>
      </div>

      {/* Input Controls */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Find My Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">State *</label>
              <Select value={selectedState} onValueChange={handleStateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {complianceData.states.map(state => (
                    <SelectItem key={state.abbr} value={state.abbr}>
                      {state.state} ({state.abbr})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">City/County (Optional)</label>
              <Input
                placeholder="Enter city or county"
                value={cityCounty}
                onChange={(e) => handleCityChange(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowWizard(true)}
                className="flex-1"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Open Wizard
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={clearSession}
                title="Clear session"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {stateData && (
        <div className="space-y-4">
          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stateData.state} - Compliance Summary</span>
                <Badge className={`${getStatusColor(stateData.status)} text-white`}>
                  {stateData.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Permit</div>
                  <Badge variant={stateData.licensing.required ? "destructive" : "secondary"}>
                    {stateData.licensing.required ? "Required" : "Not Required"}
                  </Badge>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Prize Cap</div>
                  <div className="text-sm">
                    {stateData.prize_caps.per_prize_usd > 0 
                      ? `$${stateData.prize_caps.per_prize_usd}` 
                      : "None/Prohibited"}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Tax</div>
                  <Badge variant={stateData.tax_finance.sales_tax_on_plays ? "destructive" : "secondary"}>
                    {stateData.tax_finance.sales_tax_on_plays ? "Sales Tax" : "No Tax"}
                  </Badge>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Inspection</div>
                  <div className="text-sm">{stateData.operational_rules.inspection}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="licensing">
              <AccordionTrigger>Licensing & Permits</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Permit Type:</strong> {stateData.licensing.permit_type}
                  </div>
                  <div>
                    <strong>Who Licenses:</strong> {stateData.licensing.who_licenses}
                  </div>
                  <div>
                    <strong>Fees:</strong> ${stateData.licensing.fees_usd.join(' - $')}
                  </div>
                  <div>
                    <strong>Renewal:</strong> {stateData.licensing.renewal}
                  </div>
                  <div>
                    <strong>Processing Time:</strong> {stateData.licensing.processing_time_days} days
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="operational">
              <AccordionTrigger>Operational Rules</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <strong>Age Limits:</strong> {stateData.operational_rules.age_limits}
                </div>
                <div>
                  <strong>Payout Rules:</strong> {stateData.operational_rules.payout_rules}
                </div>
                <div>
                  <strong>Machine Marking:</strong> {stateData.operational_rules.machine_marking}
                </div>
                <div>
                  <strong>Required Signage:</strong>
                  <ul className="list-disc pl-6 mt-1">
                    {stateData.operational_rules.signage_required.map((sign, idx) => (
                      <li key={idx}>{sign}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="financial">
              <AccordionTrigger>Tax & Financial</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div>
                  <strong>Amusement Tax:</strong> {stateData.tax_finance.amusement_tax}
                </div>
                <div>
                  <strong>Sales Tax on Plays:</strong> {stateData.tax_finance.sales_tax_on_plays ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Distributor Registration:</strong> {stateData.tax_finance.distributor_reg ? 'Required' : 'Not Required'}
                </div>
              </AccordionContent>
            </AccordionItem>

            {localOverrides.length > 0 && (
              <AccordionItem value="local">
                <AccordionTrigger>Local Requirements</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {localOverrides.map((override, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold">{override.jurisdiction}</div>
                      <div className="text-sm mt-1">{override.notes}</div>
                      {override.source.map((src, srcIdx) => (
                        <a 
                          key={srcIdx}
                          href={src.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {src.title}
                        </a>
                      ))}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {stateData.red_flags.length > 0 && (
              <AccordionItem value="warnings">
                <AccordionTrigger className="text-red-600">⚠️ Red Flags & Warnings</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    {stateData.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-red-600">{flag}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="sources">
              <AccordionTrigger>Sources & References</AccordionTrigger>
              <AccordionContent className="space-y-2">
                {stateData.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {source.title}
                  </a>
                ))}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
                  <strong>Disclaimer:</strong> {stateData.disclaimer}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Export Options */}
          <ComplianceExport stateData={stateData} cityCounty={cityCounty} />
        </div>
      )}

      {/* Device Wizard Modal */}
      {showWizard && (
        <DeviceWizard 
          isOpen={showWizard} 
          onClose={() => setShowWizard(false)} 
        />
      )}
    </div>
  );
};
