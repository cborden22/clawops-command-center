
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Copy } from 'lucide-react';
import { StateRegulation } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';

interface ComplianceExportProps {
  stateData: StateRegulation;
  cityCounty?: string;
}

export const ComplianceExport: React.FC<ComplianceExportProps> = ({ 
  stateData, 
  cityCounty 
}) => {
  const { toast } = useToast();

  const generateTextSummary = (): string => {
    const timestamp = new Date().toLocaleDateString();
    const location = cityCounty ? `${stateData.state} - ${cityCounty}` : stateData.state;
    
    return `
CLAW MACHINE COMPLIANCE SUMMARY
Generated: ${timestamp}
Location: ${location}
Data Version: 1.0.0

CLASSIFICATION: ${stateData.classification}
STATUS: ${stateData.status}

LICENSING & PERMITS:
- Required: ${stateData.licensing.required ? 'Yes' : 'No'}
- Type: ${stateData.licensing.permit_type}
- Who Licenses: ${stateData.licensing.who_licenses}
- Fees: $${stateData.licensing.fees_usd.join(' - $')}
- Renewal: ${stateData.licensing.renewal}
- Processing Time: ${stateData.licensing.processing_time_days} days

PRIZE & PAYOUT RULES:
- Prize Cap: ${stateData.prize_caps.per_prize_usd > 0 ? `$${stateData.prize_caps.per_prize_usd}` : 'None/Prohibited'}
- Notes: ${stateData.prize_caps.notes}
- Payout Rules: ${stateData.operational_rules.payout_rules}

OPERATIONAL REQUIREMENTS:
- Age Limits: ${stateData.operational_rules.age_limits}
- Required Signage: ${stateData.operational_rules.signage_required.join(', ')}
- Machine Marking: ${stateData.operational_rules.machine_marking}
- Inspection: ${stateData.operational_rules.inspection}

TAX & FINANCIAL:
- Amusement Tax: ${stateData.tax_finance.amusement_tax}
- Sales Tax on Plays: ${stateData.tax_finance.sales_tax_on_plays ? 'Yes' : 'No'}
- Distributor Registration: ${stateData.tax_finance.distributor_reg ? 'Required' : 'Not Required'}

${stateData.red_flags.length > 0 ? `
RED FLAGS & WARNINGS:
${stateData.red_flags.map(flag => `- ${flag}`).join('\n')}
` : ''}

SOURCES:
${stateData.sources.map(source => `- ${source.title}: ${source.url}`).join('\n')}

DISCLAIMER: ${stateData.disclaimer}

---
This summary is for informational purposes only and does not constitute legal advice.
Always verify current regulations with the appropriate authorities before operating.
    `.trim();
  };

  const copyToClipboard = async () => {
    try {
      const textSummary = generateTextSummary();
      await navigator.clipboard.writeText(textSummary);
      toast({
        title: "Copied to clipboard",
        description: "Compliance summary copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = () => {
    const textSummary = generateTextSummary();
    const blob = new Blob([textSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-summary-${stateData.abbr}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Compliance summary downloaded as text file",
    });
  };

  const generatePDF = () => {
    // For now, we'll create a simple HTML page that can be printed as PDF
    const textSummary = generateTextSummary();
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Compliance Summary - ${stateData.state}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.4; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 25px; }
            .warning { color: #d32f2f; font-weight: bold; }
            .disclaimer { background: #f5f5f5; padding: 15px; border-left: 4px solid #666; margin-top: 20px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${textSummary}</pre>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
          URL.revokeObjectURL(url);
        }, 100);
      };
    }
    
    toast({
      title: "PDF generation",
      description: "Opening print dialog for PDF export",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Share
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            onClick={generatePDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Save PDF
          </Button>
          
          <Button 
            onClick={downloadAsText}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Text
          </Button>
          
          <Button 
            onClick={copyToClipboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Summary
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
          <strong>Note:</strong> Exports are generated locally and not stored. 
          Session data will be cleared after export.
        </div>
      </CardContent>
    </Card>
  );
};
