import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Box,
  Printer,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Location, MACHINE_TYPE_OPTIONS, CommissionSummaryRecord, LocationAgreementRecord, useLocations } from "@/hooks/useLocationsDB";
import { useMachineCollections } from "@/hooks/useMachineCollections";
import { generatePDFFromHTML } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

// Parse date-only strings (YYYY-MM-DD) as local dates to avoid timezone shifts
const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface LocationDetailDialogProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationDetailDialog({
  location,
  open,
  onOpenChange,
}: LocationDetailDialogProps) {
  const { toast } = useToast();
  const { deleteCommissionSummary } = useLocations();
  const [deletingCommissionId, setDeletingCommissionId] = useState<string | null>(null);
  const {
    getCollectionsForLocation,
    calculateMachineStats,
    calculateLocationStats,
    calculateCollectionWinRate,
    formatWinRate,
    formatOdds,
    formatPlays,
    compareToExpected,
    deleteCollection,
  } = useMachineCollections();
  
  if (!location) return null;

  const agreementCount = location.agreements?.length || 0;
  const commissionCount = location.commissionSummaries?.length || 0;
  const locationCollections = getCollectionsForLocation(location.id);
  const collectionCount = locationCollections.length;
  const locationStats = calculateLocationStats(location.id);

  const handleDeleteCommission = async (summaryId: string) => {
    setDeletingCommissionId(summaryId);
    const success = await deleteCommissionSummary(summaryId);
    setDeletingCommissionId(null);
    if (success) {
      toast({
        title: "Commission Deleted",
        description: "The commission summary and related expense have been removed.",
      });
    }
  };

  const printCommissionSummary = (summary: CommissionSummaryRecord) => {
    const currentDate = new Date().toLocaleDateString();
    const periodText = `${format(parseDateOnly(summary.startDate), "MMM dd, yyyy")} - ${format(parseDateOnly(summary.endDate), "MMM dd, yyyy")}`;
    
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0; color: #1f2937; font-weight: bold;">COMMISSION SUMMARY</h1>
          <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">Generated on ${currentDate}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #374151; font-weight: 600;">Location Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; width: 40%; border-bottom: 1px solid #f3f4f6;">Business Name:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${location.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Contact Person:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${location.contactPerson || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Period:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${periodText}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">Number of Machines:</td>
              <td style="padding: 12px 0; color: #1f2937;">${summary.machineCount}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 40px 0; padding: 30px; background: #f9fafb; border-radius: 8px;">
          <div style="margin-bottom: 25px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">TOTAL REVENUE</p>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1f2937;">$${summary.totalRevenue.toFixed(2)}</p>
          </div>

          <div style="background: #dcfce7; padding: 25px; border-radius: 8px; border: 2px solid #22c55e;">
            <p style="color: #15803d; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">COMMISSION PAYMENT</p>
            <p style="font-size: 36px; font-weight: bold; margin: 15px 0; color: #15803d;">$${summary.commissionAmount.toFixed(2)}</p>
          </div>
        </div>

        ${summary.notes ? `
        <div style="margin: 30px 0;">
          <h3 style="font-size: 16px; color: #374151; margin: 0 0 15px 0; font-weight: 600;">Additional Notes</h3>
          <div style="color: #4b5563; line-height: 1.6; margin: 0; padding: 20px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #e5e7eb;">${summary.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This commission summary was generated by ClawOps Business Dashboard
          </p>
        </div>
      </div>
    `;

    const filename = `commission-summary-${location.name.replace(/\s+/g, '-').toLowerCase()}-${format(parseDateOnly(summary.startDate), 'yyyy-MM-dd')}.pdf`;
    
    generatePDFFromHTML(content, {
      filename,
      margin: 12,
      format: 'letter',
      orientation: 'portrait'
    })
      .then(() => {
        toast({
          title: "PDF Generated",
          description: `Commission summary for ${location.name} downloaded.`,
        });
      })
      .catch((error: unknown) => {
        console.error('PDF generation error:', error);
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating the PDF.",
          variant: "destructive"
        });
      });
  };

  const printAgreement = (agreement: LocationAgreementRecord) => {
    const currentDate = format(new Date(agreement.agreementDate), "PPP");
    const paymentDetails = agreement.paymentType === "percentage" 
      ? `${agreement.revenueSharePercentage || 0}% of all revenue generated by the Machine(s)`
      : `$${agreement.flatFeeAmount?.toFixed(2) || "0.00"} per month (flat fee)`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Claw Machine Placement Agreement</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .subtitle { 
            font-size: 16px; 
            margin-bottom: 15px;
          }
          .parties { 
            margin-bottom: 25px;
          }
          .party-section {
            margin-bottom: 20px;
          }
          .party-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            text-decoration: underline;
          }
          .section { 
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .section-content { 
            margin-bottom: 15px;
          }
          .compensation-box {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #ddd;
            text-align: center;
            font-weight: bold;
          }
          .responsibilities {
            display: table;
            width: 100%;
            margin: 15px 0;
          }
          .responsibility-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
          }
          .responsibility-title {
            font-weight: bold;
            margin-bottom: 8px;
            text-decoration: underline;
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 5px;
          }
          .signatures { 
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .signature-section {
            display: table;
            width: 100%;
            margin-top: 30px;
          }
          .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            height: 30px;
            margin: 20px auto;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CLAW MACHINE PLACEMENT AGREEMENT</div>
          <div class="subtitle">Standard 1-Year Term</div>
          <div><strong>Effective Date: ${currentDate}</strong></div>
        </div>

        <div class="parties">
          <h3>PARTIES TO THIS AGREEMENT</h3>
          <div class="party-section">
            <div class="party-title">Claw Machine Provider</div>
            <div><strong>Name:</strong> ${agreement.providerName || "[Provider Name]"}</div>
            <div><strong>Address:</strong> ${agreement.providerAddress || "[Provider Address]"}</div>
            <div><strong>Contact:</strong> ${agreement.providerContact || "[Contact Information]"}</div>
          </div>
          <div class="party-section">
            <div class="party-title">Business Location Owner</div>
            <div><strong>Name:</strong> ${location.name || "[Business Name]"}</div>
            <div><strong>Address:</strong> ${location.address || "[Business Address]"}</div>
            <div><strong>Contact:</strong> ${[location.contactPerson, location.contactPhone, location.contactEmail].filter(Boolean).join(" - ") || "[Contact Information]"}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. PURPOSE</div>
          <div class="section-content">
            The Provider agrees to place and operate one or more claw machines (the "Machine(s)") at the Location Owner's place of business. The Location Owner agrees to host the Machine(s) in exchange for compensation as outlined in Section 3.
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. TERM</div>
          <div class="section-content">
            This Agreement is valid for <strong>12 months</strong>, beginning on <strong>${format(new Date(agreement.startDate), "PPP")}</strong> and ending on <strong>${format(new Date(agreement.endDate), "PPP")}</strong>, unless terminated earlier as outlined in Section 9.
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. COMPENSATION</div>
          <div class="section-content">
            The Provider will collect all revenue from the Machine(s) and compensate the Location Owner with:
          </div>
          <div class="compensation-box">
            ${paymentDetails}
          </div>
          <div class="section-content">
            Payments will be made by the <strong>10th of each month</strong> for the prior month's earnings via <strong>${agreement.paymentMethod || "[Payment Method]"}</strong>.
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. RESPONSIBILITIES</div>
          <div class="responsibilities">
            <div class="responsibility-column">
              <div class="responsibility-title">Provider Responsibilities</div>
              <ul>
                <li>Owns all machines and their contents</li>
                <li>Handles installation, restocking, and servicing</li>
                <li>Covers all maintenance and repairs</li>
                <li>Pays for electricity usage</li>
                <li>Provides timely revenue reporting</li>
              </ul>
            </div>
            <div class="responsibility-column">
              <div class="responsibility-title">Location Owner Responsibilities</div>
              <ul>
                <li>Provides accessible space for Machine(s)</li>
                <li>Supplies power outlet near placement area</li>
                <li>Maintains general cleanliness around machine</li>
                <li>Ensures customer access during business hours</li>
                <li>Cooperates with maintenance schedules</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">5. THEFT, DAMAGE & COOPERATION</div>
          <div class="section-content">
            The Location Owner will not be held liable for theft, vandalism, or accidental damage to the Machine(s).
          </div>
          <div class="section-content">
            <strong>In the event of incidents, the Location Owner agrees to:</strong>
            <ul>
              <li>Provide available security footage, if applicable</li>
              <li>Allow access for inspection and assessment</li>
              <li>Cooperate with law enforcement or insurance representatives</li>
              <li>Notify Provider within 24 hours of any incidents</li>
            </ul>
          </div>
        </div>

        <div class="section">
          <div class="section-title">6. INSURANCE & LIABILITY</div>
          <div class="section-content">
            The Provider is responsible for carrying comprehensive insurance for equipment and general liability. The Location Owner assumes no liability for injuries or damages related to the Machine(s), except in cases of gross negligence.
          </div>
        </div>

        <div class="section">
          <div class="section-title">7. MARKETING & SIGNAGE</div>
          <div class="section-content">
            The Provider may display branding and promotional signage on or immediately near the Machine(s). Any additional signage in other areas of the premises must receive prior written approval from the Location Owner.
          </div>
        </div>

        <div class="section">
          <div class="section-title">8. RELOCATION OR REMOVAL</div>
          <div class="section-content">
            The Provider may replace, relocate, or remove the Machine(s) with <strong>${agreement.noticePeriod || "[Notice Period]"}</strong> notice to the Location Owner. The Location Owner may request relocation of the machine within the business premises if operationally necessary.
          </div>
        </div>

        <div class="section">
          <div class="section-title">9. TERMINATION</div>
          <div class="section-content">
            Either party may terminate this Agreement with <strong>30 days' written notice</strong>. Immediate termination is permitted in the event of material breach that remains uncured after 7 days' written notice.
          </div>
        </div>

        <div class="section">
          <div class="section-title">10. RENEWAL</div>
          <div class="section-content">
            If neither party provides written notice of termination at least 30 days before the end date, this Agreement automatically renews for another 12-month term under the same conditions.
          </div>
        </div>

        <div class="section">
          <div class="section-title">11. ENTIRE AGREEMENT</div>
          <div class="section-content">
            This document represents the complete agreement between the Parties. Any amendments must be in writing and signed by both Parties. This Agreement supersedes all prior negotiations, understandings, or agreements.
          </div>
        </div>

        <div class="signatures">
          <div class="section-title">SIGNATURES</div>
          <div class="signature-section">
            <div class="signature-box">
              <div><strong>Claw Machine Provider</strong></div>
              <div class="signature-line"></div>
              <div>Signature</div>
              <div>Date: _________________</div>
            </div>
            <div class="signature-box">
              <div><strong>Business Location Owner</strong></div>
              <div class="signature-line"></div>
              <div>Signature</div>
              <div>Date: _________________</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          Generated on ${new Date().toLocaleDateString()} by ClawOps Document Creator
        </div>
      </body>
      </html>
    `;

    const filename = `${location.name.replace(/\s+/g, '-').toLowerCase()}-agreement-${format(new Date(agreement.agreementDate), 'yyyy-MM-dd')}.pdf`;

    generatePDFFromHTML(htmlContent, {
      filename,
      margin: 15,
      format: 'a4',
      orientation: 'portrait'
    })
      .then(() => {
        toast({
          title: "PDF Generated",
          description: `Agreement for ${location.name} downloaded.`,
        });
      })
      .catch((error: unknown) => {
        console.error('PDF generation error:', error);
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating the PDF.",
          variant: "destructive"
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{location.name}</span>
              <Badge
                variant={location.isActive ? "default" : "secondary"}
                className="ml-3"
              >
                {location.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center gap-1 text-xs px-2">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-1 text-xs px-2">
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Collections</span>
              {collectionCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {collectionCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agreements" className="flex items-center gap-1 text-xs px-2">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agreements</span>
              {agreementCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {agreementCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-1 text-xs px-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Commissions</span>
              {commissionCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {commissionCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Address
                      </p>
                      <p className="font-medium">{location.address || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Contact Person
                      </p>
                      <p className="font-medium">{location.contactPerson || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="font-medium">{location.contactPhone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="font-medium">{location.contactEmail || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Total Machines
                      </p>
                      <p className="font-medium">{location.machineCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission Rate</p>
                      <p className="font-medium">
                        {location.commissionRate > 0
                          ? `${location.commissionRate}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Machine Types Breakdown */}
                  {location.machines && location.machines.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <Box className="h-3 w-3" /> Machine Breakdown
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {location.machines.map((machine, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {machine.label}: {machine.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {location.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{location.notes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created: {format(new Date(location.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collections Tab */}
            <TabsContent value="collections" className="mt-0 space-y-4">
              {collectionCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No collections yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Add collection metrics when logging revenue
                  </p>
                </div>
              ) : (
                <>
                  {/* Location Summary */}
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{locationStats.collectionCount}</p>
                          <p className="text-xs text-muted-foreground">Collections</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{locationStats.totalCoins.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Coins</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{locationStats.totalPrizes.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Prizes</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatWinRate(locationStats.winRate)}</p>
                          <p className="text-xs text-muted-foreground">Avg Win Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Per-Machine Breakdown */}
                  {location.machines && location.machines.length > 0 && (
                    <Accordion type="single" collapsible className="space-y-2">
                      {location.machines.map((machine) => {
                        const machineId = machine.id;
                        if (!machineId) return null;
                        
                        const stats = calculateMachineStats(machineId, machine.costPerPlay);
                        const comparison = machine.winProbability
                          ? compareToExpected(stats.trueWinRate, machine.winProbability)
                          : { status: "unknown" as const, variance: 0, message: "" };
                        const machineCollections = locationCollections
                          .filter((c) => c.machineId === machineId)
                          .sort((a, b) => b.collectionDate.getTime() - a.collectionDate.getTime());

                        if (machineCollections.length === 0) return null;

                        return (
                          <AccordionItem
                            key={machineId}
                            value={machineId}
                            className="border rounded-lg px-4"
                          >
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{machine.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {machine.winProbability
                                      ? `Expected: 1 in ${machine.winProbability}`
                                      : "No probability set"}
                                    {stats.collectionCount > 0 && (
                                      <> | Actual: {formatOdds(stats.trueOdds)}</>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {comparison.status === "on-target" && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                                      <Minus className="h-3 w-3 mr-1" />
                                      On Target
                                    </Badge>
                                  )}
                                  {comparison.status === "over" && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      +{comparison.variance.toFixed(0)}%
                                    </Badge>
                                  )}
                                  {comparison.status === "under" && (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      -{comparison.variance.toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {machineCollections.map((collection) => {
                                  const collStats = calculateCollectionWinRate(
                                    collection.coinsInserted,
                                    collection.prizesWon,
                                    machine.costPerPlay
                                  );
                                  return (
                                    <div
                                      key={collection.id}
                                      className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {format(collection.collectionDate, "MMM d, yyyy")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatPlays(collStats.totalPlays)} plays → {collection.prizesWon} prizes (
                                          {formatWinRate(collStats.trueWinRate)})
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">
                                          {collection.coinsInserted} coins = ${collStats.totalDollars.toFixed(2)}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteCollection(collection.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </>
              )}
            </TabsContent>

            {/* Agreements Tab */}
            <TabsContent value="agreements" className="mt-0 space-y-3">
              {agreementCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No agreements yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Generate an agreement from the Documents page
                  </p>
                </div>
              ) : (
                location.agreements.map((agreement) => (
                  <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{agreement.providerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {agreement.providerAddress}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {agreement.paymentType === "percentage"
                              ? `${agreement.revenueSharePercentage}% Share`
                              : `$${agreement.flatFeeAmount?.toFixed(2)} Flat`}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printAgreement(agreement)}
                            className="h-7 px-2"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Agreement Date
                          </p>
                          <p className="font-medium">
                            {format(new Date(agreement.agreementDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">
                            {format(new Date(agreement.startDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-medium">
                            {format(new Date(agreement.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                        <span>Payment: {agreement.paymentMethod}</span>
                        <span>Notice: {agreement.noticePeriod}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Commission Summaries Tab */}
            <TabsContent value="commissions" className="mt-0 space-y-3">
              {commissionCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No commission summaries yet
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Generate a summary from the Commission Summary page
                  </p>
                </div>
              ) : (
                location.commissionSummaries.map((summary) => (
                  <Card key={summary.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(parseDateOnly(summary.startDate), "MMM d")} -{" "}
                            {format(parseDateOnly(summary.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                            ${summary.commissionAmount.toFixed(2)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printCommissionSummary(summary)}
                            className="h-7 px-2"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingCommissionId === summary.id}
                              >
                                {deletingCommissionId === summary.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Delete Commission Summary?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    Are you sure you want to delete this commission summary for <strong>{format(parseDateOnly(summary.startDate), "MMM d")} - {format(parseDateOnly(summary.endDate), "MMM d, yyyy")}</strong>?
                                  </p>
                                  <p className="text-destructive font-medium">
                                    This will also delete the associated ${summary.commissionAmount.toFixed(2)} expense entry from your Revenue Tracker.
                                  </p>
                                  <p className="text-xs">This action cannot be undone.</p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCommission(summary.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Commission
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Revenue</p>
                          <p className="font-medium text-lg">
                            ${summary.totalRevenue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Commission</p>
                          <p className="font-medium">
                            {summary.commissionPercentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Machines</p>
                          <p className="font-medium">{summary.machineCount}</p>
                        </div>
                      </div>

                      {summary.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            Notes: {summary.notes}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Generated:{" "}
                        {format(new Date(summary.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
