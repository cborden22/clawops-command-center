
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
    commissionAmount: 0,
    startDate: undefined,
    endDate: undefined,
    machineCount: 1,
    notes: ""
  })

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0; color: #333;">Commission Summary Report</h1>
          <p style="color: #666; margin: 10px 0;">Generated on ${currentDate}</p>
        </div>

        <div style="margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="font-size: 16px; margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Location Information</h2>
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold; width: 30%;">Business Name:</div>
              <div style="display: table-cell; padding: 8px 0;">${locationData.name}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Contact Person:</div>
              <div style="display: table-cell; padding: 8px 0;">${locationData.contactPerson || 'N/A'}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Period:</div>
              <div style="display: table-cell; padding: 8px 0;">${periodText}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Number of Machines:</div>
              <div style="display: table-cell; padding: 8px 0;">${locationData.machineCount}</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="margin-bottom: 20px;">
            <p style="color: #666; margin: 0; font-size: 14px;">Total Revenue</p>
            <p style="font-size: 28px; font-weight: bold; margin: 8px 0; color: #333;">$${locationData.totalRevenue.toFixed(2)}</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #22c55e;">
            <p style="color: #666; margin: 0; font-size: 14px;">Commission Payment</p>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #22c55e;">$${locationData.commissionAmount.toFixed(2)}</p>
          </div>
        </div>

        ${locationData.notes ? `
        <div style="margin: 25px 0;">
          <h3 style="font-size: 14px; color: #333; margin: 0 0 10px 0;">Additional Notes</h3>
          <p style="color: #666; line-height: 1.5; margin: 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">${locationData.notes}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
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
        letterRendering: true,
        logging: true
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
            <Input
              id="totalRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.totalRevenue || ""}
              onChange={(e) => setLocationData(prev => ({ ...prev, totalRevenue: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionAmount">Commission Amount ($)</Label>
            <Input
              id="commissionAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.commissionAmount || ""}
              onChange={(e) => setLocationData(prev => ({ ...prev, commissionAmount: parseFloat(e.target.value) || 0 }))}
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
