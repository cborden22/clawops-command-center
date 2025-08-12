
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import html2pdf from "html2pdf.js"

interface LocationData {
  name: string
  contactPerson: string
  totalRevenue: number
  commissionPercentage: number
  commissionAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
  machineCount: number
  notes: string
}

export function CommissionSummaryGenerator() {
  const { toast } = useToast()
  const [locationData, setLocationData] = useState<LocationData>({
    name: "",
    contactPerson: "",
    totalRevenue: 0,
    commissionPercentage: 0,
    commissionAmount: 0,
    startDate: undefined,
    endDate: undefined,
    machineCount: 1,
    notes: ""
  })

  // Calculate commission amount when revenue or percentage changes
  const updateCommissionFromPercentage = (revenue: number, percentage: number) => {
    const calculatedAmount = (revenue * percentage) / 100
    setLocationData(prev => ({ 
      ...prev, 
      totalRevenue: revenue,
      commissionPercentage: percentage,
      commissionAmount: calculatedAmount 
    }))
  }

  const getFormattedPeriod = () => {
    if (!locationData.startDate || !locationData.endDate) return ""
    return `${format(locationData.startDate, "MMM dd, yyyy")} - ${format(locationData.endDate, "MMM dd, yyyy")}`
  }

  const generatePDF = () => {
    if (!locationData.name || !locationData.startDate || !locationData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in the location name and select both start and end dates.",
        variant: "destructive"
      })
      return
    }

    console.log('Starting PDF generation...')
    console.log('Location data:', locationData)
    
    const currentDate = new Date().toLocaleDateString()
    const periodText = getFormattedPeriod()
    
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
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${locationData.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Contact Person:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${locationData.contactPerson || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Period:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${periodText}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">Number of Machines:</td>
              <td style="padding: 12px 0; color: #1f2937;">${locationData.machineCount}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 40px 0; padding: 30px; background: #f9fafb; border-radius: 8px;">
          <div style="margin-bottom: 25px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">TOTAL REVENUE</p>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1f2937;">$${locationData.totalRevenue.toFixed(2)}</p>
          </div>

          <div style="background: #dcfce7; padding: 25px; border-radius: 8px; border: 2px solid #22c55e;">
            <p style="color: #15803d; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">COMMISSION PAYMENT</p>
            <p style="font-size: 36px; font-weight: bold; margin: 15px 0; color: #15803d;">$${locationData.commissionAmount.toFixed(2)}</p>
          </div>
        </div>

        ${locationData.notes ? `
        <div style="margin: 30px 0;">
          <h3 style="font-size: 16px; color: #374151; margin: 0 0 15px 0; font-weight: 600;">Additional Notes</h3>
          <div style="color: #4b5563; line-height: 1.6; margin: 0; padding: 20px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #e5e7eb;">${locationData.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This commission summary was generated by ClawOps Business Dashboard
          </p>
        </div>
      </div>
    `

    const filename = `commission-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}.pdf`
    
    const options = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      }
    }

    console.log('Creating PDF with options:', options)
    
    html2pdf()
      .set(options)
      .from(content)
      .save()
      .then(() => {
        console.log('PDF generated successfully')
        toast({
          title: "Commission Summary Generated",
          description: `PDF report created for ${locationData.name}`,
        })
      })
      .catch((error) => {
        console.error('PDF generation error:', error)
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating the PDF. Please try again.",
          variant: "destructive"
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
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !locationData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {locationData.startDate ? format(locationData.startDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={locationData.startDate}
                  onSelect={(date) => setLocationData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !locationData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {locationData.endDate ? format(locationData.endDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={locationData.endDate}
                  onSelect={(date) => setLocationData(prev => ({ ...prev, endDate: date }))}
                  disabled={(date) => locationData.startDate ? date < locationData.startDate : false}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
            <Input
              id="totalRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.totalRevenue || ""}
              onChange={(e) => updateCommissionFromPercentage(parseFloat(e.target.value) || 0, locationData.commissionPercentage)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionPercentage">Commission (%)</Label>
            <Input
              id="commissionPercentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0.0"
              value={locationData.commissionPercentage || ""}
              onChange={(e) => updateCommissionFromPercentage(locationData.totalRevenue, parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionAmount">Commission Amount ($)</Label>
            <Input
              id="commissionAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.commissionAmount.toFixed(2)}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Location Earnings:</span>
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
          disabled={!locationData.name || !locationData.startDate || !locationData.endDate}
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Commission Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
