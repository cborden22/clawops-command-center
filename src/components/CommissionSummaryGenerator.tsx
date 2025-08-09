
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar, DollarSign, TrendingUp } from "lucide-react"
import html2pdf from "html2pdf.js"

interface LocationData {
  name: string
  contactPerson: string
  totalRevenue: number
  commissionRate: number
  commissionAmount: number
  period: string
  machineCount: number
  notes: string
}

export function CommissionSummaryGenerator() {
  const { toast } = useToast()
  const [locationData, setLocationData] = useState<LocationData>({
    name: "",
    contactPerson: "",
    totalRevenue: 0,
    commissionRate: 50,
    commissionAmount: 0,
    period: "",
    machineCount: 1,
    notes: ""
  })

  const calculateCommission = (revenue: number, rate: number) => {
    return (revenue * rate) / 100
  }

  const handleRevenueChange = (value: string) => {
    const revenue = parseFloat(value) || 0
    const commission = calculateCommission(revenue, locationData.commissionRate)
    setLocationData(prev => ({
      ...prev,
      totalRevenue: revenue,
      commissionAmount: commission
    }))
  }

  const handleRateChange = (value: string) => {
    const rate = parseFloat(value) || 0
    const commission = calculateCommission(locationData.totalRevenue, rate)
    setLocationData(prev => ({
      ...prev,
      commissionRate: rate,
      commissionAmount: commission
    }))
  }

  const generatePDF = () => {
    if (!locationData.name || !locationData.period) {
      toast({
        title: "Missing Information",
        description: "Please fill in the location name and period.",
        variant: "destructive"
      })
      return
    }

    const currentDate = new Date().toLocaleDateString()
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #333; margin-bottom: 10px;">Commission Summary Report</h1>
          <p style="color: #666; margin: 0;">Generated on ${currentDate}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Location Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div>
              <strong>Business Name:</strong> ${locationData.name}
            </div>
            <div>
              <strong>Contact Person:</strong> ${locationData.contactPerson || 'N/A'}
            </div>
            <div>
              <strong>Reporting Period:</strong> ${locationData.period}
            </div>
            <div>
              <strong>Number of Machines:</strong> ${locationData.machineCount}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Financial Summary</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="text-align: center;">
                <div style="color: #666; font-size: 14px;">Total Revenue</div>
                <div style="font-size: 24px; font-weight: bold; color: #333;">$${locationData.totalRevenue.toFixed(2)}</div>
              </div>
              <div style="text-align: center;">
                <div style="color: #666; font-size: 14px;">Commission Rate</div>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${locationData.commissionRate}%</div>
              </div>
            </div>
            <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
              <div style="color: #666; font-size: 14px;">Your Commission Payment</div>
              <div style="font-size: 32px; font-weight: bold; color: #22c55e;">$${locationData.commissionAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        ${locationData.notes ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Additional Notes</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; line-height: 1.5;">${locationData.notes}</p>
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This commission summary was generated automatically by ClawOps Business Dashboard.</p>
          <p>For questions or concerns, please contact our support team.</p>
        </div>
      </div>
    `

    const opt = {
      margin: 1,
      filename: `commission-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${locationData.period.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    const element = document.createElement('div')
    element.innerHTML = htmlContent
    
    html2pdf().set(opt).from(element).save().then(() => {
      toast({
        title: "Commission Summary Generated",
        description: `PDF created for ${locationData.name}`,
      })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Commission Summary Generator
        </CardTitle>
        <CardDescription>
          Generate professional commission reports for your partner locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locationName">Business Name *</Label>
            <Input
              id="locationName"
              placeholder="Enter business name"
              value={locationData.name}
              onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="Enter contact name"
              value={locationData.contactPerson}
              onChange={(e) => setLocationData(prev => ({ ...prev, contactPerson: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="period">Reporting Period *</Label>
            <Input
              id="period"
              placeholder="e.g., January 2024, Q1 2024"
              value={locationData.period}
              onChange={(e) => setLocationData(prev => ({ ...prev, period: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="machineCount">Number of Machines</Label>
            <Input
              id="machineCount"
              type="number"
              min="1"
              value={locationData.machineCount}
              onChange={(e) => setLocationData(prev => ({ ...prev, machineCount: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
            <Input
              id="totalRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.totalRevenue || ""}
              onChange={(e) => handleRevenueChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={locationData.commissionRate}
              onChange={(e) => handleRateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Commission Amount:</span>
            <span className="text-lg font-bold text-primary">
              ${locationData.commissionAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional information or notes for this location..."
            value={locationData.notes}
            onChange={(e) => setLocationData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <Button 
          onClick={generatePDF}
          className="w-full"
          disabled={!locationData.name || !locationData.period}
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Commission Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
