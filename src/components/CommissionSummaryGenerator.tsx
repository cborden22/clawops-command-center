
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
  commissionRate: number
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
    commissionRate: 50,
    commissionAmount: 0,
    startDate: undefined,
    endDate: undefined,
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

    const currentDate = new Date().toLocaleDateString()
    const periodText = getFormattedPeriod()
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Business Summary Report</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px;
            line-height: 1.2;
            color: #333;
            padding: 15px;
            width: 8.5in;
            height: 11in;
            overflow: hidden;
          }
          .header { 
            text-align: center; 
            margin-bottom: 15px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
          }
          .header h1 { 
            font-size: 18px;
            color: #1e40af;
            margin-bottom: 3px;
            font-weight: bold;
          }
          .header p { 
            color: #64748b;
            font-size: 9px;
          }
          .content {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-box {
            flex: 1;
            min-width: 180px;
            background: #f8fafc;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .info-box h3 {
            font-size: 11px;
            color: #1e40af;
            margin-bottom: 6px;
            font-weight: 600;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 10px;
          }
          .info-label {
            color: #64748b;
            font-weight: 500;
          }
          .info-value {
            color: #1e293b;
            font-weight: 600;
          }
          .revenue-highlight {
            text-align: center;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
          }
          .revenue-amount {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .revenue-label {
            font-size: 9px;
            opacity: 0.9;
          }
          .notes-section {
            background: #fefce8;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #eab308;
            margin-top: 10px;
          }
          .notes-section h4 {
            font-size: 10px;
            color: #92400e;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .notes-text {
            font-size: 9px;
            color: #78716c;
            line-height: 1.3;
            max-height: 40px;
            overflow: hidden;
          }
          .footer {
            position: absolute;
            bottom: 15px;
            left: 15px;
            right: 15px;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
          @page {
            size: letter;
            margin: 0;
          }
          @media print {
            body { height: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BUSINESS SUMMARY REPORT</h1>
          <p>Generated on ${currentDate} | ClawOps Business Dashboard</p>
        </div>

        <div class="content">
          <div class="info-box">
            <h3>📍 Location Details</h3>
            <div class="info-row">
              <span class="info-label">Business:</span>
              <span class="info-value">${locationData.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact:</span>
              <span class="info-value">${locationData.contactPerson || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Machines:</span>
              <span class="info-value">${locationData.machineCount}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>📅 Period</h3>
            <div class="info-row">
              <span class="info-label">Dates:</span>
              <span class="info-value">${periodText}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Generated:</span>
              <span class="info-value">${currentDate}</span>
            </div>
          </div>
        </div>

        <div class="revenue-highlight">
          <div class="revenue-amount">$${locationData.totalRevenue.toFixed(2)}</div>
          <div class="revenue-label">TOTAL REVENUE GENERATED</div>
        </div>

        ${locationData.notes ? `
        <div class="notes-section">
          <h4>📝 Notes</h4>
          <div class="notes-text">${locationData.notes}</div>
        </div>
        ` : ''}

        <div class="footer">
          <strong>ClawOps Business Dashboard</strong> | Professional Business Reporting
        </div>
      </body>
      </html>
    `

    const opt = {
      margin: 0,
      filename: `business-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 612,
        height: 792,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'pt', 
        format: 'letter', 
        orientation: 'portrait'
      }
    }

    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.width = '612pt'
    element.style.height = '792pt'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '-9999px'
    
    document.body.appendChild(element)
    
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element)
      toast({
        title: "Business Summary Generated",
        description: `Professional PDF report created for ${locationData.name}`,
      })
    }).catch((error) => {
      document.body.removeChild(element)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      })
      console.error('PDF generation error:', error)
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
              onChange={(e) => handleRevenueChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Split Rate (%)</Label>
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
          Generate Business Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
